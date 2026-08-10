import { getAllMilestoneContent, getPortalClientByToken } from "@/lib/portalClientStore";

/**
 * Fresh team-authored milestone content for the client's own portal. Exists so
 * the portal can re-fetch while content is still being generated right after
 * checkout — the page's server-rendered props only carry what existed at load
 * time, and the AI content pack lands a minute or two later.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const client = await getPortalClientByToken(token);
  if (!client) {
    return Response.json({ ok: false, error: "Unknown portal token." }, { status: 404 });
  }
  const content = await getAllMilestoneContent(client.id);
  return Response.json({ ok: true, content });
}
