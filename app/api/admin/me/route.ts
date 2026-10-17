import { requireTeam } from "@/lib/teamAuth";
import { setting } from "@/lib/settings";

/** Who is signed in to the back office. 404 while the team board is off. */
export async function GET(request: Request) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const portalBase = (setting("PUBLIC_PORTAL_BASE") ?? new URL(request.url).origin).replace(/\/$/, "");
  return Response.json({ ok: true, ...actor, portalBase, teamBoardEnabled: true });
}
