import { and, asc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { portalComms, portalCommsSeen } from "@/db/schema";
import { portalJourneyFor } from "@/lib/productRegistry";

// Communications (AT Network first, Jesse 2026-10-21): a thread on each step,
// between the client and the team, in portal_comms. Append-only: nothing is
// edited or deleted. Shown only when the client's product switches on
// `features.comms`. Phase 1: kind "message" only.

export type CommsSide = "client" | "team";
/** Client messages a portal can send in a day. */
export const CLIENT_MESSAGES_PER_DAY = 60;
export const MAX_BODY = 6000;
export const MAX_NAME = 80;

const now = () => new Date().toISOString();

export function commsEnabled(clientType: string): boolean {
  return Boolean(portalJourneyFor(clientType).comms);
}

/** The client's steps, in portal order, as { id, title }: the threads a message can sit on. */
export function commsSteps(clientType: string): { id: string; title: string }[] {
  return portalJourneyFor(clientType).stages.flatMap((s) => s.milestones.map((m) => ({ id: m.id, title: m.title })));
}

export async function listComms(clientId: string) {
  return getDb().select().from(portalComms).where(eq(portalComms.clientId, clientId)).orderBy(asc(portalComms.id)).limit(1000);
}

export async function clientMessagesToday(clientId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const rows = await getDb()
    .select({ id: portalComms.id })
    .from(portalComms)
    .where(and(eq(portalComms.clientId, clientId), eq(portalComms.authorSide, "client"), gte(portalComms.createdAt, since)));
  return rows.length;
}

export async function addComm(input: { clientId: string; stepId: string; authorSide: CommsSide; authorName: string; body: string }) {
  const [row] = await getDb()
    .insert(portalComms)
    .values({
      clientId: input.clientId,
      stepId: input.stepId,
      kind: "message",
      authorSide: input.authorSide,
      authorName: input.authorName.slice(0, MAX_NAME),
      body: input.body.slice(0, MAX_BODY),
      createdAt: now(),
    })
    .returning();
  return row;
}

export async function getSeen(clientId: string, side: CommsSide): Promise<number> {
  const row = (await getDb().select().from(portalCommsSeen).where(and(eq(portalCommsSeen.clientId, clientId), eq(portalCommsSeen.side, side))).limit(1))[0];
  return row?.lastSeenId ?? 0;
}

/** Marks everything up to `lastId` as seen by one side. Never moves backwards. */
export async function markSeen(clientId: string, side: CommsSide, lastId: number) {
  if (!Number.isInteger(lastId) || lastId <= 0) return;
  if (lastId <= (await getSeen(clientId, side))) return;
  await getDb()
    .insert(portalCommsSeen)
    .values({ clientId, side, lastSeenId: lastId, updatedAt: now() })
    .onConflictDoUpdate({ target: [portalCommsSeen.clientId, portalCommsSeen.side], set: { lastSeenId: lastId, updatedAt: now() } });
}

/** The thread as either side sees it, with how many of the other side's rows are unseen. */
export async function commsView(clientId: string, side: CommsSide) {
  const rows = await listComms(clientId);
  const seen = await getSeen(clientId, side);
  const other: CommsSide = side === "client" ? "team" : "client";
  return {
    comms: rows.map((r) => ({ id: r.id, stepId: r.stepId, kind: r.kind, authorSide: r.authorSide, authorName: r.authorName, body: r.body, createdAt: r.createdAt })),
    unread: rows.filter((r) => r.authorSide === other && r.id > seen).length,
  };
}
