// BSS Launchpad, the custom 41-task journey for Bitcoin Success School: PAUSED.
// Existing "bss" clients (today only local test clients) render their portal
// from this file: client steps in ./client-steps.ts, String Theory in
// ./portal.ts, the variant's name and look below. It is never offered for a
// new client (offered: false, status paused) and never put on a team board.
// Fin's live product is "bss-meta", a Scale variant (products/scale).
//
// Converted 2026-10-17 from lib/bssJourney.ts (client steps) and the CSM
// template (team tasks, each placed behind the step with the same id).
// npm run check:journeys freezes what a bss client sees.

import { defineProduct } from "../define";
import { bssClientStages } from "./client-steps";
import { bssStringPlan } from "./portal";
import { bssTeamTasks } from "./team-tasks";

export const bss = defineProduct({
  id: "bss",
  name: "BSS Launchpad (custom journey)",
  version: "2026-10-17.1",
  status: "paused",
  totalDays: 42,
  roles: ["Jesse Allan"],
  stages: bssClientStages,
  teamTasks: bssTeamTasks,
  // As before: never shown, brandName wins. No voice guide or Ask-AI: their
  // scripts were written for Scale and CRM. No features.
  portal: { wordmark: "Scale" },
  variants: [
    {
      id: "bss",
      clientType: "bss",
      label: "BSS Fin Creighton",
      offered: false,
      portal: {
        lockedLook: "groveaurora",
        brandName: "BSS Launchpad",
        hidesIncentive: true,
        tagline: "Onboarding & delivery",
        stringPlan: bssStringPlan,
      },
    },
  ],
  source: {
    from: "csm-dashboard lib/bssTasks.ts",
    commit: "5c9abc9",
    files: ["lib/bssTasks.ts", "lib/types.ts"],
    document: {
      title: "Bitcoin Success School — Scope & Agreement v2 (2026-10-14)",
      url: "https://bss-agreement.vercel.app/",
    },
    convertedOn: "2026-10-16",
    report: "docs/products/conversion-report-2026-10.md",
  },
});
