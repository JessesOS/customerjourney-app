import { createSupportRequest } from "@/lib/assistantStore";
import { getPortalClientByToken } from "@/lib/portalClientStore";
import { portalJourneyFor } from "@/lib/productRegistry";

/** POST { title, detail }: the client sends a request to Jesse. It becomes a task on their board and pings Slack. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const client = await getPortalClientByToken(token);
  if (!client || !portalJourneyFor(client.clientType).assistant) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { title?: unknown; detail?: unknown };
  const result = await createSupportRequest(client, {
    title: typeof body.title === "string" ? body.title : "",
    detail: typeof body.detail === "string" ? body.detail : "",
  });
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status });
  return Response.json({ ok: true });
}
