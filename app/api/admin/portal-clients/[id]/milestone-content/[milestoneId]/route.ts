import { requestCanAdmin } from "@/lib/adminAuth";
import { allMilestoneTemplates } from "@/lib/allJourneys";
import { getMilestoneContent, setMilestoneContent } from "@/lib/portalClientStore";

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
    const content = await getMilestoneContent(id, milestoneId);
    return Response.json({ ok: true, content });
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
    const body = (await request.json()) as { content?: string };
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
