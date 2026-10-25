import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalClients } from "@/db/schema";
import { addComm, CHANGE_STATUSES, commsEnabled, commsSteps, commsView, markSeen, MAX_BODY, setChangeStatus, type ChangeStatus } from "@/lib/commsStore";
import { requireTeam } from "@/lib/teamAuth";

// Communications, team side: the client's step threads, a reply box, the
// unread count, and (phase 2) moving a change request to a new status.
// Empty (enabled: false) for products without features.comms.

async function clientById(id: string) {
  return (await getDb().select().from(portalClients).where(eq(portalClients.id, id)).limit(1))[0] ?? null;
}

function teamName(actor: { name: string; via: string }) {
  return actor.via === "code" || !actor.name ? "Jesse" : actor.name;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const client = await clientById((await params).id);
  if (!client) return Response.json({ ok: false, error: "Unknown client." }, { status: 404 });
  if (!commsEnabled(client.clientType)) return Response.json({ ok: true, enabled: false, steps: [], comms: [], unread: 0, oldestUnanswered: null });
  return Response.json({ ok: true, enabled: true, steps: commsSteps(client.clientType), ...(await commsView(client.id, "team")) });
}

/**
 * POST { stepId, body }: a team reply.
 * POST { requestId, status, note? }: move a change request (open | quoted | approved | declined | parked | done).
 * POST { seen: id }: mark client messages seen.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const client = await clientById((await params).id);
  if (!client || !commsEnabled(client.clientType)) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { stepId?: unknown; body?: unknown; seen?: unknown; requestId?: unknown; status?: unknown; note?: unknown };

  if (typeof body.seen === "number") {
    await markSeen(client.id, "team", body.seen);
    return Response.json({ ok: true });
  }

  if (typeof body.requestId === "number") {
    const status = typeof body.status === "string" && CHANGE_STATUSES.includes(body.status as ChangeStatus) ? (body.status as ChangeStatus) : null;
    if (!status) return Response.json({ ok: false, error: "Unknown status." }, { status: 400 });
    const note = typeof body.note === "string" ? body.note.trim().slice(0, MAX_BODY) : "";
    const row = await setChangeStatus(client.id, body.requestId, status, teamName(actor), note);
    if (!row) return Response.json({ ok: false, error: "Not a change request." }, { status: 404 });
    return Response.json({ ok: true, steps: commsSteps(client.clientType), ...(await commsView(client.id, "team")) });
  }

  const stepId = typeof body.stepId === "string" ? body.stepId : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (stepId && !commsSteps(client.clientType).some((s) => s.id === stepId)) return Response.json({ ok: false, error: "Unknown step." }, { status: 400 });
  if (!text) return Response.json({ ok: false, error: "Type a reply first." }, { status: 400 });
  if (text.length > MAX_BODY) return Response.json({ ok: false, error: `Keep it under ${MAX_BODY} characters.` }, { status: 400 });

  const row = await addComm({ clientId: client.id, stepId, authorSide: "team", authorName: teamName(actor), body: text });
  // Replying means the team has read the thread up to here.
  if (row) await markSeen(client.id, "team", row.id);
  return Response.json({ ok: true, steps: commsSteps(client.clientType), ...(await commsView(client.id, "team")) });
}
