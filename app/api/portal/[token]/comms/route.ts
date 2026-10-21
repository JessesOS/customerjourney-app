import { addComm, clientMessagesToday, CLIENT_MESSAGES_PER_DAY, commsEnabled, commsSteps, commsView, markSeen, MAX_BODY, MAX_NAME } from "@/lib/commsStore";
import { getPortalClientByToken } from "@/lib/portalClientStore";

// Communications, client side (AT Network first). Token auth like every portal
// route; 404 unless the client's product switches on features.comms.

async function clientFor(params: Promise<{ token: string }>) {
  const { token } = await params;
  const client = await getPortalClientByToken(token);
  if (!client || !commsEnabled(client.clientType)) return null;
  return client;
}

/** GET: every thread, oldest first, and how many team replies are unseen. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const client = await clientFor(params);
  if (!client) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  return Response.json({ ok: true, ...(await commsView(client.id, "client")) });
}

/** POST { stepId, authorName, body }: a message on a step ("" = general). POST { seen: id }: mark team replies seen. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const client = await clientFor(params);
  if (!client) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { stepId?: unknown; authorName?: unknown; body?: unknown; seen?: unknown };

  if (typeof body.seen === "number") {
    await markSeen(client.id, "client", body.seen);
    return Response.json({ ok: true });
  }

  const stepId = typeof body.stepId === "string" ? body.stepId : "";
  const authorName = typeof body.authorName === "string" ? body.authorName.trim() : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (stepId && !commsSteps(client.clientType).some((s) => s.id === stepId)) return Response.json({ ok: false, error: "Unknown step." }, { status: 400 });
  if (!authorName) return Response.json({ ok: false, error: "Add your name first." }, { status: 400 });
  if (authorName.length > MAX_NAME) return Response.json({ ok: false, error: "That name is too long." }, { status: 400 });
  if (!text) return Response.json({ ok: false, error: "Type a message first." }, { status: 400 });
  if (text.length > MAX_BODY) return Response.json({ ok: false, error: `Keep it under ${MAX_BODY} characters.` }, { status: 400 });
  if ((await clientMessagesToday(client.id)) >= CLIENT_MESSAGES_PER_DAY) {
    return Response.json({ ok: false, error: "That's a lot of messages today. Jesse will reply soon." }, { status: 429 });
  }

  await addComm({ clientId: client.id, stepId, authorSide: "client", authorName, body: text });
  return Response.json({ ok: true, ...(await commsView(client.id, "client")) });
}
