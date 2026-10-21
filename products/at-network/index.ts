// AT Network (Rich Latimer and Martyn Hume Cobbe): a brand-new custom product,
// separate from Fin's. DRAFT: staging and local only (never prod).
//
// Written from the AT Network session's handover, products/at-network/spec.md
// (2026-10-21), on a blank base. Two sides, defined once:
//   - the client's side: 15 steps (./client-steps.ts);
//   - the team's side: the deliverables behind them (./team-tasks.ts).
// OPEN in the spec, so placeholders for now: total days and stage windows, every
// due date, the portal tagline, the welcome video (Jesse will send the mp4).

import { defineCustomProduct } from "../custom";
import { atNetworkStages, atNetworkSteps } from "./client-steps";
import { atNetworkTeamTasks } from "./team-tasks";

export const atNetwork = defineCustomProduct({
  id: "at-network",
  name: "AT Network (Rich and Martyn)",
  version: "2026-10-21.2",
  status: "draft",
  clientType: "at-network",
  label: "AT Network",
  spec: "products/at-network/spec.md",
  base: "blank",
  idPrefix: "atn-",
  totalDays: 42, // PLACEHOLDER: total days are OPEN in the spec
  roles: ["Jesse Allan"],
  stages: atNetworkStages,
  steps: { add: atNetworkSteps },
  teamTasks: { add: atNetworkTeamTasks.map((task) => ({ task })) },
  portal: {
    brandName: "AT Network", // PLACEHOLDER: brand name and tagline are OPEN
    lockedLook: "groveaurora", // an existing look; a look of its own would need code
    // "Ask Jesse" help panel: with no reviewed pack it only takes requests, which
    // become tasks on the board (Jesse, 2026-10-21).
    // Messages: step threads with the team (phase 1 of docs/at-network-communications-plan.md).
    features: { assistant: true, comms: true },
  },
  draftCopy: atNetworkSteps.map((s) => s.step.id),
});
