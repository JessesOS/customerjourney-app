import { requestCanAdmin } from "@/lib/adminAuth";
import { deletePortalClient } from "@/lib/portalClientStore";

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
