import { listPortalMessages } from "@/lib/assistantStore";
import { requireTeam } from "@/lib/teamAuth";

/** GET: the client's "Ask Jesse" panel as the team sees it (last 50 messages), read-only. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const { id } = await params;
  const messages = await listPortalMessages(id, 50);
  return Response.json({ ok: true, messages: messages.map((m) => ({ id: m.id, role: m.role, body: m.body, requestTaskId: m.requestTaskId, createdAt: m.createdAt })) });
}
