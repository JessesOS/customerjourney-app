import { getPortalClientById, setMilestoneDone } from "@/lib/portalClientStore";
import { isBssMilestoneId, requestHasSyncToken } from "@/lib/csmSync";

// CSM → portal: the team changed a BSS task on the CSM board. Store done-ness
// only (status is accepted for a later in-progress view). Never calls the CSM
// back, so a change can't bounce between the two apps.
export async function POST(request: Request) {
  if (!requestHasSyncToken(request)) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as { journeyClientId?: string; milestoneId?: string; status?: string; done?: boolean };
    const clientId = body.journeyClientId?.trim();
    const milestoneId = body.milestoneId?.trim();
    if (!clientId || !milestoneId || !isBssMilestoneId(milestoneId) || typeof body.done !== "boolean") {
      return Response.json({ ok: false, error: "journeyClientId, a bss-NNN milestoneId and done are required." }, { status: 400 });
    }
    const client = await getPortalClientById(clientId);
    if (!client || client.clientType !== "bss") {
      return Response.json({ ok: false, error: "No BSS portal client with that id." }, { status: 404 });
    }
    await setMilestoneDone(clientId, milestoneId, body.done);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not apply the change." }, { status: 500 });
  }
}
