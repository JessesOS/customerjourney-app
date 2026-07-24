import { requestCanAdmin } from "@/lib/adminAuth";
import { deletePortalClient, isPortalThemeVariant, setPortalClientTheme } from "@/lib/portalClientStore";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as { themeVariant?: string };
    if (!isPortalThemeVariant(body.themeVariant)) {
      return Response.json({ ok: false, error: "Portal look must be warm or cool." }, { status: 400 });
    }
    await setPortalClientTheme(id, body.themeVariant);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not update client." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await deletePortalClient(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not delete client." },
      { status: 500 },
    );
  }
}
