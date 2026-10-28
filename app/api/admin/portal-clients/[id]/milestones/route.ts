import { requestCanAdminAsync } from "@/lib/teamAuth";
import { allMilestoneTemplates } from "@/lib/allJourneys";
import { getCompletedMilestoneIds, getPortalClientById, setMilestoneDone } from "@/lib/portalClientStore";
import { checklistStagesFor, DEFAULT_CLIENT_TYPE } from "@/lib/productRegistry";
import { lastTicks } from "@/lib/activityStore";
import { emailIfStageDone } from "@/lib/clientEmails";

// The team's task checklist for one client: the steps of their journey by
// stage (from their product file), which are done, and ticking them off.
// Needed for tasks the team does ("With us"), which the client can't complete
// from the portal.
const validMilestoneIds = new Set(allMilestoneTemplates.map((m) => m.id));

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requestCanAdminAsync(request))) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const [done, client, ticks] = await Promise.all([getCompletedMilestoneIds(id), getPortalClientById(id), lastTicks(id)]);
    return Response.json({ ok: true, completed: [...done], stages: checklistStagesFor(client?.clientType ?? DEFAULT_CLIENT_TYPE), ticks });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not load tasks." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requestCanAdminAsync(request))) {
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
    if (done) {
      const client = await getPortalClientById(id);
      if (client) await emailIfStageDone(new URL(request.url).origin, client, body.milestoneId);
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not update the task." }, { status: 500 });
  }
}
