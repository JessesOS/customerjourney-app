import { isAdminEmail, isLocalDevelopmentHost } from "@/lib/adminAuth";
import { journeyTemplate } from "@/lib/onboardingJourney";
import { getMilestoneContent, setMilestoneContent } from "@/lib/portalClientStore";

function requestCanAdmin(request: Request) {
  const email = request.headers.get("oai-authenticated-user-email");
  if (isAdminEmail(email)) return true;

  const host = request.headers.get("host");
  if (isLocalDevelopmentHost(host)) return true;

  return false;
}

const validMilestoneIds = new Set(journeyTemplate.flatMap((stage) => stage.milestones).map((m) => m.id));

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
