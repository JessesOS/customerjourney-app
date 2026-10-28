import { formMissingRequired, onboardingFormById, sanitizeFormResponses } from "@/lib/onboardingForm";
import { getFormResponses, getPortalClientByToken, markMilestoneComplete, saveFormResponses } from "@/lib/portalClientStore";
import { formStepFor } from "@/lib/productRegistry";
import { recordActivity } from "@/lib/activityStore";

export async function GET(request: Request, { params }: { params: Promise<{ token: string; formId: string }> }) {
  const { token, formId } = await params;

  const form = onboardingFormById(formId);
  if (!form) {
    return Response.json({ ok: false, error: "Unknown form id." }, { status: 404 });
  }

  const client = await getPortalClientByToken(token);
  if (!client) {
    return Response.json({ ok: false, error: "Unknown portal token." }, { status: 404 });
  }

  const saved = await getFormResponses(client.id, formId);
  return Response.json({ ok: true, responses: saved?.responses ?? {}, completedAt: saved?.completedAt ?? null });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string; formId: string }> }) {
  const { token, formId } = await params;

  const form = onboardingFormById(formId);
  if (!form) {
    return Response.json({ ok: false, error: "Unknown form id." }, { status: 404 });
  }

  try {
    const client = await getPortalClientByToken(token);
    if (!client) {
      return Response.json({ ok: false, error: "Unknown portal token." }, { status: 404 });
    }

    const body = (await request.json()) as { responses?: unknown; submit?: boolean };
    const responses = sanitizeFormResponses(body.responses, form);

    let submitted = false;
    if (body.submit) {
      const missing = formMissingRequired(responses, form);
      if (missing.length > 0) {
        return Response.json({ ok: false, error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
      }
      submitted = true;
    }

    await saveFormResponses(client.id, formId, responses, submitted);

    if (submitted) {
      // The step this form completes for THIS client's product (a custom
      // product may reuse a form id on a different step).
      const milestoneId = formStepFor(client.clientType, formId);
      if (milestoneId) {
        await markMilestoneComplete(client.id, milestoneId);
        await recordActivity(request, client, "tick", milestoneId);
      } else {
        await recordActivity(request, client, "form", formId);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not save form responses." },
      { status: 500 },
    );
  }
}
