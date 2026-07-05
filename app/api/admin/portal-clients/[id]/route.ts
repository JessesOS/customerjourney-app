import { isAdminEmail, isLocalDevelopmentHost } from "@/lib/adminAuth";
import { deletePortalClient } from "@/lib/portalClientStore";

function requestCanAdmin(request: Request) {
  const email = request.headers.get("oai-authenticated-user-email");
  if (isAdminEmail(email)) return true;

  const host = request.headers.get("host");
  if (isLocalDevelopmentHost(host)) return true;

  return false;
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
