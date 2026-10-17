import { requireTeam } from "@/lib/teamAuth";
import { getBoard, seedTeamBoard } from "@/lib/teamStore";

type Params = { params: Promise<{ id: string }> };

/** One client's team board (works before it's started: shows what would be seeded). */
export async function GET(request: Request, { params }: Params) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const { id } = await params;
  try {
    const board = await getBoard(id);
    if (!board) return Response.json({ ok: false, error: "Unknown client." }, { status: 404 });
    return Response.json({ ok: true, ...board });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not load the board." }, { status: 500 });
  }
}

/** Starts the client's board from their product file. Safe to repeat. */
export async function POST(request: Request, { params }: Params) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const { id } = await params;
  try {
    const result = await seedTeamBoard(id, actor);
    if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status });
    return Response.json({ ok: true, created: result.created });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not start the board." }, { status: 500 });
  }
}
