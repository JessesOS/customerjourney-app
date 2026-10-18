import { getPortalClientByToken } from "@/lib/portalClientStore";
import { tabTitle } from "@/lib/journeyBuild";
import { portalJourneyFor } from "@/lib/productRegistry";

/**
 * The web app manifest for "Add to Home Screen": opens this client's own link,
 * full screen, with their product's icon. 404 unless the product has an app
 * icon (portal.features.appIcon).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const client = await getPortalClientByToken(token);
  const journey = client ? portalJourneyFor(client.clientType) : null;
  if (!client || !journey?.appIcon) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  const name = tabTitle(journey);
  const icon = (size: number) => ({ src: `/portal/icons/${journey.appIcon}-${size}.png`, sizes: `${size}x${size}`, type: "image/png" });
  return new Response(
    JSON.stringify({
      name,
      short_name: name,
      start_url: `/portal/${token}`,
      scope: `/portal/${token}`,
      display: "standalone",
      background_color: "#0e0e10",
      theme_color: "#0e0e10",
      icons: [icon(192), icon(512)],
    }),
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "private, max-age=3600" } },
  );
}
