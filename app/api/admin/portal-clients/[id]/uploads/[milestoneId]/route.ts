import { isAdminEmail, isLocalDevelopmentHost } from "@/lib/adminAuth";
import { getMilestoneUpload } from "@/lib/portalClientStore";

function requestCanAdmin(request: Request) {
  const email = request.headers.get("oai-authenticated-user-email");
  if (isAdminEmail(email)) return true;

  const host = request.headers.get("host");
  if (isLocalDevelopmentHost(host)) return true;

  return false;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string; milestoneId: string }> }) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id, milestoneId } = await params;
  const upload = await getMilestoneUpload(id, milestoneId);

  if (!upload) {
    return Response.json({ ok: false, error: "No upload found." }, { status: 404 });
  }

  return new Response(upload.content, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${upload.fileName.replace(/"/g, "")}"`,
    },
  });
}
