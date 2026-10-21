import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalClients } from "@/db/schema";
import { addComm, commsEnabled, commsSteps, commsView, markSeen, MAX_BODY } from "@/lib/commsStore";
import { requireTeam } from "@/lib/teamAuth";

// Communications, team side: the client's step threads, a reply box and the
// unread count. Empty (enabled: false) for products without features.comms.

async function clientById(id: string) {
  return (await getDb().select().from(portalClients).where(eq(portalClients.id, id)).limit(1))[0] ?? null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const client = await clientById((await params).id);
  if (!client) return Response.json({ ok: false, error: "Unknown client." }, { status: 404 });
  if (!commsEnabled(client.clientType)) return Response.json({ ok: true, enabled: false, steps: [], comms: [], unread: 0 });
  return Response.json({ ok: true, enabled: true, steps: commsSteps(client.clientType), ...(await commsView(client.id, "team")) });
}

/** POST { stepId, body }: a team reply. POST { seen: id }: mark client messages seen. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const client = await clientById((await params).id);
  if (!client || !commsEnabled(client.clientType)) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { stepId?: unknown; body?: unknown; seen?: unknown };

  if (typeof body.seen === "number") {
    await markSeen(client.id, "team", body.seen);
    return Response.json({ ok: true });
  }

  const stepId = typeof body.stepId === "string" ? body.stepId : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (stepId && !commsSteps(client.clientType).some((s) => s.id === stepId)) return Response.json({ ok: false, error: "Unknown step." }, { status: 400 });
  if (!text) return Response.json({ ok: false, error: "Type a reply first." }, { status: 400 });
  if (text.length > MAX_BODY) return Response.json({ ok: false, error: `Keep it under ${MAX_BODY} characters.` }, { status: 400 });

  const row = await addComm({ clientId: client.id, stepId, authorSide: "team", authorName: actor.via === "code" || !actor.name ? "Jesse" : actor.name, body: text });
  // Replying means the team has read the thread up to here.
  if (row) await markSeen(client.id, "team", row.id);
  return Response.json({ ok: true, steps: commsSteps(client.clientType), ...(await commsView(client.id, "team")) });
}
