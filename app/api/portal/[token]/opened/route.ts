import { getPortalClientByToken, recordPortalOpen } from "@/lib/portalClientStore";

/**
 * The portal page calls this when it loads, so admin can see when a client
 * first and last opened their link (Jesse, 2026-10-16). It runs from the page,
 * not the server render, so link previews in email and chat apps don't count.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const client = await getPortalClientByToken(token);
    if (!client) {
      return Response.json({ ok: false, error: "Unknown portal token." }, { status: 404 });
    }
    await recordPortalOpen(client.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not record the visit." },
      { status: 500 },
    );
  }
}
