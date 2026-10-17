import { requireTeam } from "@/lib/teamAuth";
import { addComment } from "@/lib/teamStore";

/** Adds a comment to a task's history. */
export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const id = Number((await params).taskId);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ ok: false, error: "Unknown task." }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { text?: string };
  const result = await addComment(id, body.text ?? "", actor);
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status });
  return Response.json({ ok: true });
}
