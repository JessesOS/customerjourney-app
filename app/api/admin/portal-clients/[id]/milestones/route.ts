import { requestCanAdmin } from "@/lib/adminAuth";
import { allMilestoneTemplates } from "@/lib/allJourneys";
import { getCompletedMilestoneIds, setMilestoneDone } from "@/lib/portalClientStore";

// The team's task checklist for one client: which tasks are done, and ticking
// them off. Needed for tasks the team does ("With us"), which the client can't
// complete from the portal.
const validMilestoneIds = new Set(allMilestoneTemplates.map((m) => m.id));

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const done = await getCompletedMilestoneIds(id);
    return Response.json({ ok: true, completed: [...done] });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not load tasks." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = (await request.json()) as { milestoneId?: string; done?: boolean };
    if (!body.milestoneId || !validMilestoneIds.has(body.milestoneId)) {
      return Response.json({ ok: false, error: "Unknown milestone id." }, { status: 400 });
    }
    const done = body.done !== false;
    await setMilestoneDone(id, body.milestoneId, done);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not update the task." }, { status: 500 });
  }
}
