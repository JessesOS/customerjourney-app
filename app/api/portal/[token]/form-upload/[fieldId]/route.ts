import { encodePortalFileValue, formFields, respondOnboardingForm, scaleOnboardingForm } from "@/lib/onboardingForm";
import { getFormUpload, getPortalClientByToken, saveFormUpload } from "@/lib/portalClientStore";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB — plenty for a bill PDF or a logo zip

const ALLOWED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "webp", "heic", "svg", "zip"]);

/** File-type field ids across every form definition. */
function fileFieldIds(): Set<string> {
  const ids = new Set<string>();
  for (const form of [scaleOnboardingForm, respondOnboardingForm]) {
    for (const field of formFields(form)) {
      if (field.type === "file") ids.add(field.id);
    }
  }
  return ids;
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string; fieldId: string }> }) {
  const { token, fieldId } = await params;

  if (!fileFieldIds().has(fieldId)) {
    return Response.json({ ok: false, error: "This field doesn't accept uploads." }, { status: 400 });
  }

  try {
    const client = await getPortalClientByToken(token);
    if (!client) {
      return Response.json({ ok: false, error: "Unknown portal token." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ ok: false, error: "Choose a file first." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return Response.json({ ok: false, error: "That file is over 10MB — please compress it or upload a smaller one." }, { status: 400 });
    }
    const fileName = (file.name || "upload").slice(0, 200);
    if (!ALLOWED_EXTENSIONS.has(extensionOf(fileName))) {
      return Response.json({ ok: false, error: "Accepted file types: PDF, images (PNG/JPG/WebP/HEIC/SVG), or a ZIP." }, { status: 400 });
    }

    const saved = await saveFormUpload(client.id, fieldId, fileName, file.type || "application/octet-stream", await file.arrayBuffer());
    if (!saved.ok) {
      return Response.json({ ok: false, error: saved.error }, { status: 503 });
    }

    return Response.json({ ok: true, value: encodePortalFileValue(fieldId, fileName), fileName });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not save the upload." },
      { status: 500 },
    );
  }
}

/** Lets the client view/re-download their own uploaded file. */
export async function GET(request: Request, { params }: { params: Promise<{ token: string; fieldId: string }> }) {
  const { token, fieldId } = await params;

  const client = await getPortalClientByToken(token);
  if (!client) {
    return Response.json({ ok: false, error: "Unknown portal token." }, { status: 404 });
  }

  const upload = await getFormUpload(client.id, fieldId);
  if (!upload) {
    return Response.json({ ok: false, error: "No file uploaded for this field yet." }, { status: 404 });
  }

  return new Response(upload.body, {
    headers: {
      "Content-Type": upload.meta.contentType,
      "Content-Disposition": `attachment; filename="${upload.meta.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
