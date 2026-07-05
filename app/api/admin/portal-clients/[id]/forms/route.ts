import { isAdminEmail, isLocalDevelopmentHost } from "@/lib/adminAuth";
import { journeyTemplate } from "@/lib/onboardingJourney";
import { getFormResponses } from "@/lib/portalClientStore";

function requestCanAdmin(request: Request) {
  const email = request.headers.get("oai-authenticated-user-email");
  if (isAdminEmail(email)) return true;

  const host = request.headers.get("host");
  if (isLocalDevelopmentHost(host)) return true;

  return false;
}

const formIdsInJourney = Array.from(
  new Set(journeyTemplate.flatMap((stage) => stage.milestones).map((m) => m.formId).filter((id): id is string => Boolean(id))),
);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const forms = await Promise.all(
      formIdsInJourney.map(async (formId) => {
        const saved = await getFormResponses(id, formId);
        return { formId, responses: saved?.responses ?? null, completedAt: saved?.completedAt ?? null };
      }),
    );

    return Response.json({ ok: true, forms });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not load form responses." },
      { status: 500 },
    );
  }
}
