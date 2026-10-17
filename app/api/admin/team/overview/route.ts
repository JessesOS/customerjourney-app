import { requireTeam } from "@/lib/teamAuth";
import { teamOverview } from "@/lib/teamStore";

/** Every client with what needs attention, worst first. */
export async function GET(request: Request) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  try {
    return Response.json({ ok: true, clients: await teamOverview() });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not load the overview." }, { status: 500 });
  }
}
