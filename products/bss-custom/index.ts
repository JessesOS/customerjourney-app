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
import { bssJourneyMap } from "./journey-map";
import { bssCustomTeamTasks } from "./team-tasks";

export const bssCustom = defineCustomProduct({
  id: "bss-custom",
  name: "BSS custom (Fin Creighton)",
  version: "2026-10-18.17",
  // Live (Jesse, 2026-10-18): he approved the wording by sending it to Fin.
  status: "live",
  clientType: "bss-custom",
  label: "BSS custom",
  spec: "products/bss-custom/spec.md",
  base: "blank",
  idPrefix: "bssc-",
  totalDays: 30,
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
    // "Ask Jesse" help panel (Jesse, 2026-10-18): answers from Fin's reviewed
    // pack (scripts/assistant-pack.mjs) and takes support requests for the board.
    // Saved to a phone's home screen, the portal opens full screen with this icon (draft, Jesse 2026-10-18).
    // Ask Jesse (assistant) is hidden for now (Jesse, 2026-10-18): add `assistant: true` back to show it.
    features: { appIcon: "bss-launchpad" },
    // The customer journey map on "Approve your customer journey" (draft, Jesse 2026-10-18).
    journeyMap: { step: "bssc-journey-map", content: bssJourneyMap },
    stringPlan: {
      weeks: 5,
      goLiveDay: 23,
      tailLabel: "→ M8",
      workstreams: [
        { id: "access", name: "Access & questions", dayStart: 1, dayEnd: 7, taskIds: ["bssc-bookmark", "bssc-save-portal", "bssc-access-site", "bssc-access-tools", "bssc-contact-lists", "bssc-questions"] },
        { id: "mapping", name: "Journey & findings", dayStart: 1, dayEnd: 7, taskIds: ["bssc-journey-map"], after: ["access"] },
        { id: "website", name: "Website", dayStart: 1, dayEnd: 16, taskIds: ["bssc-review-1", "bssc-assets", "bssc-review-2", "bssc-signoff"] },
        { id: "crm", name: "CRM build", dayStart: 4, dayEnd: 16, taskIds: ["bssc-crm-plan", "bssc-contacts"], after: ["mapping"] },
        { id: "connect", name: "Connect & test", dayStart: 17, dayEnd: 20, taskIds: ["bssc-test-booking", "bssc-launch-day"], after: ["crm", "website"] },
        { id: "launch", name: "Automate & launch", dayStart: 21, dayEnd: 23, taskIds: ["bssc-messages", "bssc-ai-agent", "bssc-walkthrough", "bssc-live-check"], after: ["connect"] },
        { id: "partners", name: "Webinar & onboarding", dayStart: 24, dayEnd: 30, taskIds: ["bssc-webinar", "bssc-onboarding-map", "bssc-reactivation"], after: ["launch"] },
        { id: "support", name: "Refine & support", dayStart: 24, dayEnd: 30, ongoing: true, taskIds: ["bssc-check-ins"], after: ["launch"] },
      ],
    },
  },
  draftCopy: [],
});
