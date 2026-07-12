import { getPortalClientByToken, markMilestoneComplete } from "@/lib/portalClientStore";
import { allMilestoneTemplates } from "@/lib/allJourneys";

const validMilestoneIds = new Set(allMilestoneTemplates.map((m) => m.id));

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const client = await getPortalClientByToken(token);
    if (!client) {
      return Response.json({ ok: false, error: "Unknown portal token." }, { status: 404 });
    }

    const body = (await request.json()) as { milestoneId?: string; note?: string };
    const milestoneId = body.milestoneId;

    if (!milestoneId || !validMilestoneIds.has(milestoneId)) {
      return Response.json({ ok: false, error: "Unknown milestone id." }, { status: 400 });
    }

    const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : undefined;
    await markMilestoneComplete(client.id, milestoneId, note);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not save milestone completion." },
      { status: 500 },
    );
  }
}
