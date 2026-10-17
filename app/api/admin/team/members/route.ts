import { requireTeam } from "@/lib/teamAuth";
import { allRoles, listMembers, upsertMember } from "@/lib/teamStore";

/** The team and the roles a task can be given to. */
export async function GET(request: Request) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  return Response.json({ ok: true, members: await listMembers(), roles: allRoles() });
}

/**
 * Adds or updates a team member (admins only). Signing in also needs their
 * email on the Cloudflare Access policy: two lists, by design.
 */
export async function POST(request: Request) {
  const actor = await requireTeam(request, { admin: true });
  if (actor instanceof Response) return actor;
  const body = (await request.json().catch(() => ({}))) as { email?: string; name?: string; roles?: string[]; isAdmin?: boolean; active?: boolean };
  const result = await upsertMember({ email: body.email ?? "", name: body.name ?? "", roles: Array.isArray(body.roles) ? body.roles : [], isAdmin: body.isAdmin, active: body.active });
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status });
  return Response.json({ ok: true });
}
