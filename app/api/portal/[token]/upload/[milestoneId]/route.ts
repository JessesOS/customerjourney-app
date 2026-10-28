import { uploadMilestoneIds, uploadStayOpenIds } from "@/lib/allJourneys";
import { addMilestoneUpload, deleteMilestoneUpload, getAllMilestoneUploadsMeta, getCompletedMilestoneIds, getPortalClientByToken } from "@/lib/portalClientStore";
import { getUploadsBucket } from "@/lib/uploadsBucket";
import { recordActivity } from "@/lib/activityStore";

// A task takes several files (a lead list can come in parts). Files go to R2
// when it's bound, so they can be bigger; without it they sit in D1.
const MAX_CONTENT_LENGTH_R2 = 20_000_000; // ~20MB of CSV text
const MAX_CONTENT_LENGTH_INLINE = 1_000_000; // ~1MB
const MAX_FILES_PER_TASK = 20;

// "Any files" steps (uploadOptions): real files, sent as multipart, kept in R2.
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_FILES_ANY = 50;
const FILE_TYPES: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", heic: "image/heic", gif: "image/gif", svg: "image/svg+xml",
  pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain", rtf: "application/rtf", zip: "application/zip", mp4: "video/mp4", mov: "video/quicktime",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xls: "application/vnd.ms-excel", csv: "text/csv",
};
const extensionOf = (name: string) => (name.includes(".") ? name.slice(name.lastIndexOf(".") + 1).toLowerCase() : "");

type Params = { params: Promise<{ token: string; milestoneId: string }> };

/** Adds one file to the task. The client finishes the task separately. */
export async function POST(request: Request, { params }: Params) {
  const { token, milestoneId } = await params;

  if (!uploadMilestoneIds.has(milestoneId)) {
    return Response.json({ ok: false, error: "This milestone doesn't accept uploads." }, { status: 400 });
  }

  try {
    const client = await getPortalClientByToken(token);
    if (!client) {
      return Response.json({ ok: false, error: "Unknown portal token." }, { status: 404 });
    }
    // A step that stays open keeps taking files after the client ticks it.
    if (!uploadStayOpenIds.has(milestoneId) && (await getCompletedMilestoneIds(client.id)).has(milestoneId)) {
      return Response.json({ ok: false, error: "This task is already done." }, { status: 409 });
    }

    if ((request.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) return Response.json({ ok: false, error: "Choose a file first." }, { status: 400 });
      const name = (file.name || "upload").slice(0, 200);
      const type = FILE_TYPES[extensionOf(name)];
      if (!type) return Response.json({ ok: false, error: `${name} isn't a file type we can take. Photos, PDFs, documents, short videos and zips are fine.` }, { status: 400 });
      if (file.size > MAX_FILE_BYTES) return Response.json({ ok: false, error: `${name} is over ${MAX_FILE_BYTES / 1024 / 1024}MB. Please send a smaller file or a link instead.` }, { status: 400 });
      if (!getUploadsBucket()) return Response.json({ ok: false, error: "File uploads aren't available right now." }, { status: 503 });
      const have = (await getAllMilestoneUploadsMeta(client.id))[milestoneId] ?? [];
      if (have.length >= MAX_FILES_ANY) return Response.json({ ok: false, error: `That's the limit of ${MAX_FILES_ANY} files for this step.` }, { status: 400 });
      const saved = await addMilestoneUpload(client.id, milestoneId, name, await file.arrayBuffer(), type);
      if (saved) await recordActivity(request, client, "upload", milestoneId);
      return Response.json({ ok: true, file: saved });
    }

    const body = (await request.json()) as { fileName?: string; content?: string };
    const fileName = (body.fileName ?? "upload.csv").slice(0, 200);
    const content = body.content ?? "";
    const maxLength = getUploadsBucket() ? MAX_CONTENT_LENGTH_R2 : MAX_CONTENT_LENGTH_INLINE;

    if (!content.trim()) {
      return Response.json({ ok: false, error: "The file appears to be empty." }, { status: 400 });
    }
    if (content.length > maxLength) {
      return Response.json({ ok: false, error: `That file is too large. Please keep each file under ${Math.round(maxLength / 1_000_000)}MB.` }, { status: 400 });
    }
    const existing = (await getAllMilestoneUploadsMeta(client.id))[milestoneId] ?? [];
    if (existing.length >= MAX_FILES_PER_TASK) {
      return Response.json({ ok: false, error: `That's the limit of ${MAX_FILES_PER_TASK} files for this task.` }, { status: 400 });
    }

    const file = await addMilestoneUpload(client.id, milestoneId, fileName, content);
    await recordActivity(request, client, "upload", milestoneId);
    return Response.json({ ok: true, file });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not save the upload." },
      { status: 500 },
    );
  }
}

/** Removes one file (?id=) while the task is still open. */
export async function DELETE(request: Request, { params }: Params) {
  const { token, milestoneId } = await params;
  const uploadId = Number(new URL(request.url).searchParams.get("id"));

  if (!uploadMilestoneIds.has(milestoneId) || !Number.isInteger(uploadId) || uploadId <= 0) {
    return Response.json({ ok: false, error: "Unknown file." }, { status: 400 });
  }

  try {
    const client = await getPortalClientByToken(token);
    if (!client) {
      return Response.json({ ok: false, error: "Unknown portal token." }, { status: 404 });
    }
    if (!uploadStayOpenIds.has(milestoneId) && (await getCompletedMilestoneIds(client.id)).has(milestoneId)) {
      return Response.json({ ok: false, error: "This task is already done." }, { status: 409 });
    }
    if (!(await deleteMilestoneUpload(client.id, milestoneId, uploadId))) {
      return Response.json({ ok: false, error: "Unknown file." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not remove the file." },
      { status: 500 },
    );
  }
}
