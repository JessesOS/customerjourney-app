import { requireTeam } from "@/lib/teamAuth";
import { deleteCustomTask, taskEvents, teamTaskById, updateTeamTask, type TaskPatch } from "@/lib/teamStore";

type Params = { params: Promise<{ taskId: string }> };

function taskIdOf(raw: string) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** A task's history and comments. */
export async function GET(request: Request, { params }: Params) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const id = taskIdOf((await params).taskId);
  if (!id || !(await teamTaskById(id))) return Response.json({ ok: false, error: "Unknown task." }, { status: 404 });
  return Response.json({ ok: true, events: await taskEvents(id) });
}

/** Changes a task. Send `expectedUpdatedAt` to refuse overwriting someone else's change (409). */
export async function PATCH(request: Request, { params }: Params) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const id = taskIdOf((await params).taskId);
  if (!id) return Response.json({ ok: false, error: "Unknown task." }, { status: 404 });
  try {
    const body = (await request.json().catch(() => null)) as (TaskPatch & { expectedUpdatedAt?: string }) | null;
    if (!body || typeof body !== "object") return Response.json({ ok: false, error: "Send the changes as JSON." }, { status: 400 });
    const allowed: (keyof TaskPatch)[] = ["status", "assigneeEmail", "blockedReason", "priority", "notes", "loomUrl", "title", "dueWindow"];
    const patch: TaskPatch = {};
    for (const key of allowed) if (key in body) (patch as Record<string, unknown>)[key] = (body as Record<string, unknown>)[key];
    const result = await updateTeamTask(id, patch, actor, body.expectedUpdatedAt);
    if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status });
    return Response.json({ ok: true, updatedAt: result.task.updatedAt });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not save the task." }, { status: 500 });
  }
}

/** Deletes a task the team added (product tasks can't be deleted). */
export async function DELETE(request: Request, { params }: Params) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const id = taskIdOf((await params).taskId);
  if (!id) return Response.json({ ok: false, error: "Unknown task." }, { status: 404 });
  const result = await deleteCustomTask(id, actor);
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status });
  return Response.json({ ok: true });
}
