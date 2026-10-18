import { requestCanAdminAsync } from "@/lib/teamAuth";
import { getMilestoneUpload } from "@/lib/portalClientStore";

const BINARY_TYPES: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", heic: "image/heic", gif: "image/gif", svg: "image/svg+xml",
  pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain", rtf: "application/rtf", zip: "application/zip", mp4: "video/mp4", mov: "video/quicktime",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xls: "application/vnd.ms-excel",
};

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

  // A photo or PDF comes back as its own bytes; everything else (the CSV lead lists) as before.
  const ext = upload.fileName.includes(".") ? upload.fileName.slice(upload.fileName.lastIndexOf(".") + 1).toLowerCase() : "";
  const binaryType = upload.bytes ? BINARY_TYPES[ext] : undefined;
  return new Response(binaryType ? upload.bytes : upload.content, {
    headers: {
      "Content-Type": binaryType ?? "text/csv",
      "Content-Disposition": `attachment; filename="${upload.fileName.replace(/"/g, "")}"`,
    },
  });
}
