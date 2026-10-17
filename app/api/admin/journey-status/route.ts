import { requestCanAdmin } from "@/lib/adminAuth";
import { formFields, onboardingFormById } from "@/lib/onboardingForm";
import { journeyStatusPlan } from "@/lib/productRegistry";
import {
  getAllFormUploadsMeta,
  getCompletedMilestoneIds,
  getFormResponses,
  getLastActivityAt,
  listPortalClients,
} from "@/lib/portalClientStore";

/**
 * One read that answers "where is every client, and what are they missing?".
 * Powers the brain's nudge worker (stalled clients -> reminder with a resume
 * link) and the admin's missing-items summary.
 *
 * Deliberately says nothing about who to message — that judgment (governor,
 * cadence, escalation) lives in the worker. This endpoint only reports state.
 */

const PORTAL_BASE = "https://scale-onboarding-portal.jesse-b4e.workers.dev";

// Which steps a client sees, and which never block them (a product's
// features.nonBlockingSteps, e.g. Scale's in products/scale/portal.ts), come
// from the product files via lib/productRegistry.ts.

export async function GET(request: Request) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const clients = await listPortalClients();
    const now = Date.now();

    const rows = await Promise.all(
      clients.map(async (client) => {
        const clientType = client.clientType;
        const plan = journeyStatusPlan(clientType);
        const nonBlocking = new Set(plan.nonBlocking);
        const completed = await getCompletedMilestoneIds(client.id);

        // Visible milestones in journey order.
        const visible = plan.visible;
        const openMilestone = visible.find((m) => !completed.has(m.id)) ?? null;

        // What's outstanding but NOT blocking their progress.
        const missing: { kind: string; id: string; label: string }[] = [];
        for (const m of visible) {
          if (completed.has(m.id)) continue;
          if (nonBlocking.has(m.id)) {
            missing.push({ kind: "task", id: m.id, label: m.title });
          }
        }

        // Unanswered required form fields + un-uploaded file fields.
        const formMilestone = visible.find((m) => m.formId);
        if (formMilestone?.formId) {
          const form = onboardingFormById(formMilestone.formId);
          const saved = await getFormResponses(client.id, formMilestone.formId);
          const uploads = await getAllFormUploadsMeta(client.id);
          if (form) {
            for (const field of formFields(form)) {
              const value = saved?.responses?.[field.id];
              const answered = Array.isArray(value) ? value.length > 0 : Boolean(value);
              if (field.type === "file" && !answered && !uploads[field.id]) {
                missing.push({ kind: "document", id: field.id, label: field.label });
              } else if (field.required && !answered) {
                missing.push({ kind: "answer", id: field.id, label: field.label });
              }
            }
          }
        }

        const lastActivityAt = await getLastActivityAt(client.id);
        const daysSinceActivity = lastActivityAt
          ? Math.floor((now - new Date(lastActivityAt).getTime()) / 86400000)
          : null;

        return {
          id: client.id,
          name: client.name,
          companyName: client.companyName,
          email: client.email ?? null,
          phone: client.phone ?? null,
          ghlContactId: client.ghlContactId ?? null,
          clientType,
          journeyState: client.journeyState ?? "active",
          startDate: client.startDate,
          completedMilestoneCount: client.completedMilestoneCount,
          totalMilestoneCount: client.totalMilestoneCount,
          lastActivityAt,
          daysSinceActivity,
          openMilestone: openMilestone
            ? { id: openMilestone.id, title: openMilestone.title, stage: openMilestone.stageName }
            : null,
          // Where a reminder should send them: straight into the open task.
          resumeUrl: openMilestone
            ? `${PORTAL_BASE}/portal/${client.portalToken}?task=${openMilestone.id}`
            : `${PORTAL_BASE}/portal/${client.portalToken}`,
          missing,
          journeyComplete: !openMilestone,
        };
      }),
    );

    return Response.json({ ok: true, clients: rows });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not compute journey status." },
      { status: 500 },
    );
  }
}
