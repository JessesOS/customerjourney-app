import { getPortalClientByToken, isPortalThemeVariant, setPortalClientTheme } from "@/lib/portalClientStore";

/** Lets a client persist their own portal look (warm/cool) from the topbar
 *  switcher. Authenticated the same way as every portal route: knowing the
 *  unguessable portal token IS the credential, and it only ever updates the
 *  matching client's own row. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const client = await getPortalClientByToken(token);
    if (!client) {
      return Response.json({ ok: false, error: "Unknown portal token." }, { status: 404 });
    }

    const body = (await request.json()) as { themeVariant?: string };
    if (!isPortalThemeVariant(body.themeVariant)) {
      return Response.json({ ok: false, error: "Portal look must be warm or cool." }, { status: 400 });
    }

    await setPortalClientTheme(client.id, body.themeVariant);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not save portal look." },
      { status: 500 },
    );
  }
}
