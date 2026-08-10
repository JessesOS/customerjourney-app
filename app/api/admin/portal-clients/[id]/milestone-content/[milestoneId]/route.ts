import { requestCanAdmin } from "@/lib/adminAuth";
import { allMilestoneTemplates } from "@/lib/allJourneys";
import { getMilestoneContentFull, resolveMilestoneDraft, setMilestoneContent, setMilestoneDraft } from "@/lib/portalClientStore";

const validMilestoneIds = new Set(allMilestoneTemplates.map((m) => m.id));

export async function GET(request: Request, { params }: { params: Promise<{ id: string; milestoneId: string }> }) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id, milestoneId } = await params;
  if (!validMilestoneIds.has(milestoneId)) {
    return Response.json({ ok: false, error: "Unknown milestone id." }, { status: 404 });
  }

  try {
    const full = await getMilestoneContentFull(id, milestoneId);
    return Response.json({ ok: true, ...full });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not load content." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; milestoneId: string }> }) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id, milestoneId } = await params;
  if (!validMilestoneIds.has(milestoneId)) {
    return Response.json({ ok: false, error: "Unknown milestone id." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      content?: string;
      draft?: string;
      draftSource?: string;
      resolveDraft?: "publish" | "dismiss";
    };

    // Publish or dismiss a pending AI draft.
    if (body.resolveDraft) {
      const resolved = await resolveMilestoneDraft(id, milestoneId, body.resolveDraft === "publish");
      if (!resolved) {
        return Response.json({ ok: false, error: "No pending draft to resolve." }, { status: 400 });
      }
      return Response.json({ ok: true });
    }

    // Store an AI draft for team review (the client never sees drafts).
    if (typeof body.draft === "string") {
      await setMilestoneDraft(id, milestoneId, body.draft.slice(0, 8000), (body.draftSource ?? "").slice(0, 300));
      return Response.json({ ok: true });
    }

    const content = (body.content ?? "").slice(0, 8000);
    await setMilestoneContent(id, milestoneId, content);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not save content." },
      { status: 500 },
    );
  }
}
