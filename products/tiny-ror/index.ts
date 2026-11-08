// Tiny ROR (Luisa, ROR The Journey): the third custom product, separate from
// Fin's and AT Network's. DRAFT: staging only until Jesse OKs prod.
//
// Written from the Tiny ROR session's handover, products/tiny-ror/spec.md
// (2026-11-08), on a blank base. Jesse OK'd the 23-step list on 2026-11-08.
//   - the client's side: 23 steps in five stages (./client-steps.ts);
//   - the team's side: the work behind them (./team-tasks.ts).
// PLACEHOLDERS: the booking link on step 1 (Jesse's AT kickoff page until he
// makes a one-hour Tiny ROR page) and the look ("warm": a red and cream Tiny
// ROR look would need CSS, Jesse's OK). Messages and email alerts are off:
// Luisa is on WhatsApp.

import { defineCustomProduct } from "../custom";
import { tinyRorStages, tinyRorSteps } from "./client-steps";
import { tinyRorTeamTasks } from "./team-tasks";

export const tinyRor = defineCustomProduct({
  id: "tiny-ror",
  name: "Tiny ROR (Luisa)",
  version: "2026-11-08.1",
  status: "draft",
  clientType: "tiny-ror",
  label: "Tiny ROR",
  spec: "products/tiny-ror/spec.md",
  base: "blank",
  idPrefix: "tror-",
  totalDays: 30, // 9 Nov to about 8 Dec (go-live, brief section 10)
  roles: ["Jesse Allan"],
  stages: tinyRorStages,
  steps: { add: tinyRorSteps },
  teamTasks: { add: tinyRorTeamTasks.map((task) => ({ task })) },
  portal: {
    brandName: "Tiny ROR",
    tagline: "Building tiny hearts.", // the brand's own line (site/README.md)
    lockedLook: "warm",
  },
  draftCopy: tinyRorSteps.map(({ step }) => step.id),
});
