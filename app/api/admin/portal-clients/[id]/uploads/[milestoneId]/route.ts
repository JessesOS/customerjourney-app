import { requestCanAdminAsync } from "@/lib/teamAuth";
import { getMilestoneUpload } from "@/lib/portalClientStore";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; milestoneId: string }> }) {
  if (!(await requestCanAdminAsync(request))) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id, milestoneId } = await params;
  const fileParam = new URL(request.url).searchParams.get("file");
  const upload = await getMilestoneUpload(id, milestoneId, fileParam ? Number(fileParam) : undefined);

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
