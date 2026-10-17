import { requireTeam } from "@/lib/teamAuth";
import { createCustomTask } from "@/lib/teamStore";

/** Adds a task the team needs that isn't in the product file. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const { id } = await params;
  try {
    const body = ((await request.json().catch(() => null)) ?? {}) as { title?: string; stageId?: string; stepId?: string | null; role?: string; priority?: string; dueWindow?: string; notes?: string };
    const result = await createCustomTask(id, { title: body.title ?? "", stageId: body.stageId ?? "onboarding", stepId: body.stepId, role: body.role, priority: body.priority, dueWindow: body.dueWindow, notes: body.notes }, actor);
    if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status });
    return Response.json({ ok: true, id: result.id });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not add the task." }, { status: 500 });
  }
}
