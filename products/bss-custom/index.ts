// BSS custom: Fin Creighton's own product (Bitcoin Success School). DRAFT.
//
// Written from scratch (blank base) from Jesse's spec, products/bss-custom/spec.md
// (the BSS handover of 17 Oct 2026). Two sides, defined once:
//   - Fin's side is short: 21 client steps (./client-steps.ts) for access,
//     questions, content, approvals, calls and tests. All drafted by Claude.
//   - The team side is every granular task in the spec: 337 tasks
//     (./team-tasks.ts), each behind the client step it supports, or team-only.
//     Automations and messages are in, marked DEFERRED in their notes (Fin:
//     website and core GHL first).
//
// Fin stays on "bss-meta" until Jesse moves him (a separate prod change, with
// npm run products:check -- --compare bss-meta bss-custom).

import { defineCustomProduct } from "../custom";
import { bssCustomStages, bssCustomSteps } from "./client-steps";
import { bssCustomTeamTasks } from "./team-tasks";

export const bssCustom = defineCustomProduct({
  id: "bss-custom",
  name: "BSS custom (Fin Creighton)",
  version: "2026-10-17.2",
  status: "draft",
  clientType: "bss-custom",
  label: "BSS custom",
  spec: "products/bss-custom/spec.md",
  base: "blank",
  idPrefix: "bssc-",
  totalDays: 42,
  roles: ["Jesse Allan"],
  stages: bssCustomStages,
  steps: { add: bssCustomSteps },
  teamTasks: { add: bssCustomTeamTasks.map((task) => ({ task })) },
  portal: {
    // Draft (spec section 5): the name and tagline are proposals, not agreed with Fin.
    // The look is Fin's current portal's: a BSS look of its own would need code.
    brandName: "BSS Launchpad",
    tagline: "Your new website and client system, built step by step.",
    lockedLook: "groveaurora",
    stringPlan: {
      weeks: 10,
      goLiveDay: 42,
      tailLabel: "→ M8",
      workstreams: [
        { id: "access", name: "Access & questions", dayStart: 1, dayEnd: 14, taskIds: ["bssc-kickoff", "bssc-access-site", "bssc-access-tools", "bssc-questions"] },
        { id: "mapping", name: "Journey & findings", dayStart: 1, dayEnd: 14, taskIds: ["bssc-journey-map"], after: ["access"] },
        { id: "website", name: "Website", dayStart: 1, dayEnd: 28, taskIds: ["bssc-review-1", "bssc-assets", "bssc-review-2", "bssc-signoff"] },
        { id: "crm", name: "CRM build", dayStart: 8, dayEnd: 28, taskIds: ["bssc-crm-plan", "bssc-contacts"], after: ["mapping"] },
        { id: "connect", name: "Connect & test", dayStart: 29, dayEnd: 35, taskIds: ["bssc-test-booking", "bssc-launch-day"], after: ["crm", "website"] },
        { id: "launch", name: "Automate & launch", dayStart: 36, dayEnd: 42, taskIds: ["bssc-messages", "bssc-ai-agent", "bssc-walkthrough", "bssc-live-check"], after: ["connect"] },
        { id: "partners", name: "Webinar & onboarding", dayStart: 43, dayEnd: 70, taskIds: ["bssc-webinar", "bssc-onboarding-map", "bssc-reactivation"], after: ["launch"] },
        { id: "support", name: "Refine & support", dayStart: 43, dayEnd: 70, ongoing: true, taskIds: ["bssc-check-ins"], after: ["launch"] },
      ],
    },
  },
  draftCopy: bssCustomSteps.map(({ step }) => step.id),
});
