import { listBssClientsForSync } from "@/lib/portalClientStore";
import { requestHasSyncToken } from "@/lib/csmSync";

// CSM → portal, read-only: the CSM dashboard lists BSS clients created here
// (in the portal admin, the one place clients are created) so it can add any it
// doesn't have yet, linked by id, with their completed tasks. Shared
// JOURNEY_SYNC_TOKEN. No side effects; never calls the CSM.
export async function GET(request: Request) {
  if (!requestHasSyncToken(request)) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  try {
    const clients = await listBssClientsForSync();
    return Response.json({ ok: true, clients });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not list clients." }, { status: 500 });
  }
}
