import { requireTeam } from "@/lib/teamAuth";
import { listMyTasks } from "@/lib/teamStore";

/** The signed-in person's open tasks, plus unclaimed ones in their roles. */
export async function GET(request: Request) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  try {
    return Response.json({ ok: true, ...(await listMyTasks(actor)) });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not load your tasks." }, { status: 500 });
  }
}
