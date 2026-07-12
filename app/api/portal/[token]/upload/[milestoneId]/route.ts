import { allMilestoneTemplates } from "@/lib/allJourneys";
import { getPortalClientByToken, markMilestoneComplete, saveMilestoneUpload } from "@/lib/portalClientStore";

const uploadMilestoneIds = new Set(allMilestoneTemplates.filter((m) => m.hasUpload).map((m) => m.id));

const MAX_CONTENT_LENGTH = 1_000_000; // ~1MB of CSV text

export async function POST(request: Request, { params }: { params: Promise<{ token: string; milestoneId: string }> }) {
  const { token, milestoneId } = await params;

  if (!uploadMilestoneIds.has(milestoneId)) {
    return Response.json({ ok: false, error: "This milestone doesn't accept uploads." }, { status: 400 });
  }

  try {
    const client = await getPortalClientByToken(token);
    if (!client) {
      return Response.json({ ok: false, error: "Unknown portal token." }, { status: 404 });
    }

    const body = (await request.json()) as { fileName?: string; content?: string };
    const fileName = (body.fileName ?? "upload.csv").slice(0, 200);
    const content = body.content ?? "";

    if (!content.trim()) {
      return Response.json({ ok: false, error: "The file appears to be empty." }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return Response.json({ ok: false, error: "That file is too large — please keep it under 1MB." }, { status: 400 });
    }

    await saveMilestoneUpload(client.id, milestoneId, fileName, content);
    await markMilestoneComplete(client.id, milestoneId);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not save the upload." },
      { status: 500 },
    );
  }
}
