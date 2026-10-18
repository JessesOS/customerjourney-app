import { replyToClient } from "@/lib/assistantStore";
import { requireTeam } from "@/lib/teamAuth";

/** POST { text }: the team replies to a client's support request. The reply shows in the client's "Ask Jesse" panel. */
export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const id = Number((await params).taskId);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ ok: false, error: "Unknown task." }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { text?: string };
  const result = await replyToClient(id, body.text ?? "", actor);
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status });
  return Response.json({ ok: true });
}
