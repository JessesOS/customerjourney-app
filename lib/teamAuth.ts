import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { teamMembers } from "@/db/schema";
import { verifyAccessToken } from "@/lib/accessJwt";
import { isAdminToken, isLocalDevelopmentHost, requestCanAdmin } from "@/lib/adminAuth";
import { setting } from "@/lib/settings";

/**
 * Who is using the team back office (Option D, 2026-10-17).
 *
 * In order:
 *  1. A Cloudflare Access login: the signed `Cf-Access-Jwt-Assertion` token,
 *     verified against the team's Access certificates (RS256, audience, issuer,
 *     expiry). The email must be an active team member, or OWNER_EMAIL.
 *  2. The local dev server (exact localhost hostname): treated as the owner.
 *  3. The admin access code (x-admin-token / ?token=): treated as the owner, so
 *     Jesse and the brain's nudge worker keep working.
 *
 * Never trusts a bare identity header (Cf-Access-Authenticated-User-Email or
 * the old oai-authenticated-user-email): anyone can send those.
 */

export type TeamActor = {
  email: string;
  name: string;
  isAdmin: boolean;
  roles: string[];
  via: "access" | "local" | "code";
};

/** The email in a valid Cloudflare Access token on this request, or null. */
export async function verifyAccessJwt(request: Request): Promise<string | null> {
  const audiences = (setting("ACCESS_AUD") ?? "").split(",").map((a) => a.trim()).filter(Boolean);
  return verifyAccessToken(request.headers.get("cf-access-jwt-assertion"), setting("ACCESS_TEAM_DOMAIN"), audiences);
}

function ownerEmail(): string {
  return (setting("OWNER_EMAIL") ?? "owner@local").toLowerCase();
}

async function memberActor(email: string, via: TeamActor["via"]): Promise<TeamActor | null> {
  const db = getDb();
  const rows = await db.select().from(teamMembers).where(eq(teamMembers.email, email)).limit(1);
  const member = rows[0];
  const isOwner = email === ownerEmail();
  if (member && member.active) {
    // Note when they were last seen, at most every ten minutes.
    const seen = member.lastSeenAt ? Date.parse(member.lastSeenAt) : 0;
    if (Date.now() - seen > 10 * 60 * 1000) {
      await db.update(teamMembers).set({ lastSeenAt: new Date().toISOString() }).where(eq(teamMembers.id, member.id));
    }
    let roles: string[] = [];
    try { roles = JSON.parse(member.roles) as string[]; } catch {}
    return { email, name: member.name, isAdmin: member.isAdmin || isOwner, roles, via };
  }
  if (isOwner) return { email, name: "Jesse", isAdmin: true, roles: [], via };
  return null;
}

export async function getTeamActor(request: Request): Promise<TeamActor | null> {
  const accessEmail = await verifyAccessJwt(request);
  if (accessEmail) return memberActor(accessEmail, "access");

  if (isLocalDevelopmentHost(new URL(request.url).hostname)) {
    return (await memberActor(ownerEmail(), "local")) ?? { email: ownerEmail(), name: "Jesse (local)", isAdmin: true, roles: [], via: "local" };
  }

  const token = new URL(request.url).searchParams.get("token") ?? request.headers.get("x-admin-token");
  if (isAdminToken(token)) {
    const actor = await memberActor(ownerEmail(), "code");
    return { ...(actor ?? { email: ownerEmail(), roles: [], isAdmin: true }), name: "Jesse (access code)", isAdmin: true, via: "code" };
  }
  return null;
}

/** True when the team board is switched on for this deploy (TEAM_BOARD=1). */
export function teamBoardEnabled(): boolean {
  return setting("TEAM_BOARD") === "1";
}

/**
 * Gate for team API routes. Returns the actor, or a Response to send back:
 * 404 while the board is switched off, 403 without a valid sign-in, 403 for a
 * non-admin on an admin-only route.
 */
export async function requireTeam(request: Request, { admin = false }: { admin?: boolean } = {}): Promise<TeamActor | Response> {
  if (!teamBoardEnabled()) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  const actor = await getTeamActor(request);
  if (!actor) return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  if (admin && !actor.isAdmin) return Response.json({ ok: false, error: "Admins only" }, { status: 403 });
  return actor;
}

/**
 * The admin gate for the existing admin routes (clients, forms, uploads...):
 * the access code or localhost as before, or — when the team board is on — a
 * signed-in team admin, so the Clients page works on the team address too.
 */
export async function requestCanAdminAsync(request: Request): Promise<boolean> {
  if (requestCanAdmin(request)) return true;
  if (!teamBoardEnabled()) return false;
  const actor = await getTeamActor(request);
  return Boolean(actor?.isAdmin);
}
