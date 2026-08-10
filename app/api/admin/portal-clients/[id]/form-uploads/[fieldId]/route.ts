import { requestCanAdmin } from "@/lib/adminAuth";
import { getFormUpload } from "@/lib/portalClientStore";

/** Admin download of a client's guided-form file upload, served from R2. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string; fieldId: string }> }) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id, fieldId } = await params;
  const upload = await getFormUpload(id, fieldId);
  if (!upload) {
    return Response.json({ ok: false, error: "No file uploaded for this field." }, { status: 404 });
  }

  return new Response(upload.body, {
    headers: {
      "Content-Type": upload.meta.contentType,
      "Content-Disposition": `attachment; filename="${upload.meta.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
