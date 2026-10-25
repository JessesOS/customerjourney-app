import { and, asc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { portalComms, portalCommsSeen } from "@/db/schema";
import { portalJourneyFor } from "@/lib/productRegistry";

// Communications (AT Network first, Jesse 2026-10-21): a thread on each step,
// between the client and the team, in portal_comms. Append-only: nothing is
// edited or deleted. Shown only when the client's product switches on
// `features.comms`.
// Phase 2 (2026-10-25): kinds. "message"; "approval" (a typed full name, a
// dated record); "change_request" (opens with status "open"); "status" (a team
// row that moves a change request to quoted, approved, declined, parked or
// done; parentId = the request). The export lists approvals, change requests
// and their status history.

export type CommsSide = "client" | "team";
export type CommKind = "message" | "approval" | "change_request" | "status";
export type ChangeStatus = "open" | "quoted" | "approved" | "declined" | "parked" | "done";
export const CHANGE_STATUSES: ChangeStatus[] = ["open", "quoted", "approved", "declined", "parked", "done"];
export const STATUS_LABEL: Record<ChangeStatus, string> = { open: "Open", quoted: "Quoted", approved: "Approved", declined: "Declined", parked: "Parked (Phase 2)", done: "Done" };
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
  return getDb().select().from(portalComms).where(eq(portalComms.clientId, clientId)).orderBy(asc(portalComms.id)).limit(2000);
}

export async function clientMessagesToday(clientId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const rows = await getDb()
    .select({ id: portalComms.id })
    .from(portalComms)
    .where(and(eq(portalComms.clientId, clientId), eq(portalComms.authorSide, "client"), gte(portalComms.createdAt, since)));
  return rows.length;
}

export async function addComm(input: { clientId: string; stepId: string; kind?: CommKind; authorSide: CommsSide; authorName: string; body: string; parentId?: number | null; status?: ChangeStatus | null }) {
  const kind = input.kind ?? "message";
  const [row] = await getDb()
    .insert(portalComms)
    .values({
      clientId: input.clientId,
      stepId: input.stepId,
      kind,
      authorSide: input.authorSide,
      authorName: input.authorName.slice(0, MAX_NAME),
      body: input.body.slice(0, MAX_BODY),
      parentId: input.parentId ?? null,
      status: input.status ?? (kind === "change_request" ? "open" : null),
      createdAt: now(),
    })
    .returning();
  return row;
}

/** A sign-off step completed with a typed name: an Approval record on that step's thread. */
export async function recordStepApproval(client: { id: string; clientType: string }, stepId: string, note: string) {
  const journey = portalJourneyFor(client.clientType);
  if (!journey.comms || !journey.approvalSteps?.includes(stepId)) return;
  const title = commsSteps(client.clientType).find((s) => s.id === stepId)?.title ?? stepId;
  await addComm({ clientId: client.id, stepId, kind: "approval", authorSide: "client", authorName: note.trim().split("\n")[0].slice(0, MAX_NAME), body: `Approved "${title}".` });
}

/** The team moves a change request on. A new status row; the request itself is never edited. */
export async function setChangeStatus(clientId: string, requestId: number, status: ChangeStatus, authorName: string, note: string) {
  const req = (await getDb().select().from(portalComms).where(eq(portalComms.id, requestId)).limit(1))[0];
  if (!req || req.clientId !== clientId || req.kind !== "change_request") return null;
  return addComm({ clientId, stepId: req.stepId, kind: "status", authorSide: "team", authorName, body: note || `Marked ${STATUS_LABEL[status]}.`, parentId: requestId, status });
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

export type CommView = { id: number; stepId: string; kind: CommKind; authorSide: CommsSide; authorName: string; body: string; parentId: number | null; status: ChangeStatus | null; createdAt: string; currentStatus?: ChangeStatus };

/** The thread as either side sees it. Change requests carry their latest status. */
export async function commsView(clientId: string, side: CommsSide) {
  const rows = await listComms(clientId);
  const seen = await getSeen(clientId, side);
  const other: CommsSide = side === "client" ? "team" : "client";
  const latest = new Map<number, ChangeStatus>();
  for (const r of rows) if (r.kind === "status" && r.parentId && r.status) latest.set(r.parentId, r.status as ChangeStatus);
  const comms: CommView[] = rows.map((r) => ({
    id: r.id, stepId: r.stepId, kind: r.kind as CommKind, authorSide: r.authorSide as CommsSide, authorName: r.authorName, body: r.body,
    parentId: r.parentId, status: (r.status as ChangeStatus | null) ?? null, createdAt: r.createdAt,
    ...(r.kind === "change_request" ? { currentStatus: latest.get(r.id) ?? "open" } : {}),
  }));
  const unanswered = rows.filter((r) => r.authorSide === "client" && r.id > seen);
  const oldest = unanswered[0]?.createdAt ?? null;
  return { comms, unread: rows.filter((r) => r.authorSide === other && r.id > seen).length, oldestUnanswered: side === "team" ? oldest : null };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const csvCell = (s: string) => `"${s.replace(/"/g, '""')}"`;

/** The record: approvals and change requests (with their status history), oldest first. */
export async function commsRecord(clientId: string, clientType: string) {
  const rows = await listComms(clientId);
  const titles = new Map(commsSteps(clientType).map((s) => [s.id, s.title]));
  const history = new Map<number, typeof rows>();
  for (const r of rows) if (r.kind === "status" && r.parentId) history.set(r.parentId, [...(history.get(r.parentId) ?? []), r]);
  return rows
    .filter((r) => r.kind === "approval" || r.kind === "change_request")
    .map((r) => ({
      id: r.id, kind: r.kind, step: r.stepId ? titles.get(r.stepId) ?? r.stepId : "General", author: r.authorName, side: r.authorSide, body: r.body, createdAt: r.createdAt,
      status: r.kind === "change_request" ? ((history.get(r.id)?.at(-1)?.status as ChangeStatus | undefined) ?? "open") : "",
      history: (history.get(r.id) ?? []).map((h) => `${h.createdAt} ${STATUS_LABEL[h.status as ChangeStatus] ?? h.status} (${h.authorName})${h.body ? `: ${h.body}` : ""}`),
    }));
}

export function recordCsv(rows: Awaited<ReturnType<typeof commsRecord>>): string {
  const head = ["id", "kind", "step", "author", "side", "text", "created_at_utc", "status", "status_history"];
  return [head.join(","), ...rows.map((r) => [String(r.id), r.kind, r.step, r.author, r.side, r.body, r.createdAt, r.status, r.history.join(" | ")].map(csvCell).join(","))].join("\n");
}

export function recordPageHtml(rows: Awaited<ReturnType<typeof commsRecord>>, clientName: string): string {
  const body = rows
    .map((r) => `<tr><td>${r.id}</td><td>${r.kind === "approval" ? "Approval" : "Change request"}</td><td>${esc(r.step)}</td><td>${esc(r.author)}<br><small>${r.side}</small></td><td>${esc(r.body)}</td><td>${esc(r.createdAt)}</td><td>${r.status ? esc(STATUS_LABEL[r.status as ChangeStatus] ?? r.status) : ""}${r.history.length ? `<br><small>${r.history.map(esc).join("<br>")}</small>` : ""}</td></tr>`)
    .join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Approvals and change requests</title>
<style>body{font:14px/1.5 -apple-system,system-ui,sans-serif;color:#111;margin:32px}h1{font-size:20px;margin:0 0 4px}.sub{color:#666;font-size:12.5px;margin-bottom:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:7px 9px;vertical-align:top;text-align:left}th{background:#f3f3f3;font-size:12px;text-transform:uppercase;letter-spacing:.04em}small{color:#555}button{padding:8px 14px;border-radius:8px;border:1px solid #999;background:#fff;cursor:pointer;font:inherit;margin-bottom:16px}@media print{button{display:none}}</style></head>
<body><button onclick="window.print()">Print or save as PDF</button><h1>Approvals and change requests</h1><div class="sub">${esc(clientName)} · exported ${esc(now())} UTC · ${rows.length} records · append-only</div>
<table><thead><tr><th>#</th><th>Kind</th><th>Step</th><th>By</th><th>Text</th><th>Date (UTC)</th><th>Status</th></tr></thead><tbody>${body}</tbody></table></body></html>`;
}
