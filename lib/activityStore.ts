import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalActivity } from "@/db/schema";
import { portalJourneyFor } from "@/lib/productRegistry";

// Who did what (AT Network first, Jesse 2026-10-28): several people share one
// link, so each device picks a name once ("Who's this?") and the portal sends
// it in the x-portal-person header. Only products with `features.people`
// record anything, and only names on that list. Append-only.

export type ActivityKind = "tick" | "upload" | "form" | "form_upload";
/** An automatic email that went out (lib/clientEmails.ts): ref says which, person is "system". Stops it going twice. */
export const EMAIL_KIND = "email";
export const PERSON_HEADER = "x-portal-person";

/** The person on the request, if the client's product lists them. */
export function personFrom(request: Request, clientType: string): string | null {
  const people = portalJourneyFor(clientType).people;
  if (!people?.length) return null;
  let raw = request.headers.get(PERSON_HEADER) ?? "";
  try { raw = decodeURIComponent(raw); } catch {}
  return people.find((p) => p === raw.trim()) ?? null;
}

/** Records one action. Never throws: a stamp is a nice-to-have, the action itself is what matters. */
export async function recordActivity(request: Request, client: { id: string; clientType: string }, kind: ActivityKind, ref: string) {
  const person = personFrom(request, client.clientType);
  if (!person) return;
  try {
    await getDb().insert(portalActivity).values({ clientId: client.id, kind, ref, person, createdAt: new Date().toISOString() });
  } catch {}
}

export type ActivityRow = { kind: string; ref: string; person: string; createdAt: string };

export async function listActivity(clientId: string): Promise<ActivityRow[]> {
  try {
    return await getDb()
      .select({ kind: portalActivity.kind, ref: portalActivity.ref, person: portalActivity.person, createdAt: portalActivity.createdAt })
      .from(portalActivity)
      .where(eq(portalActivity.clientId, clientId))
      .orderBy(asc(portalActivity.id))
      .limit(5000);
  } catch {
    // The table isn't there yet (a database the migration hasn't reached).
    return [];
  }
}

/** Who last ticked each step, and when. */
export async function lastTicks(clientId: string): Promise<Record<string, { person: string; at: string }>> {
  const out: Record<string, { person: string; at: string }> = {};
  for (const row of await listActivity(clientId)) if (row.kind === "tick") out[row.ref] = { person: row.person, at: row.createdAt };
  return out;
}
