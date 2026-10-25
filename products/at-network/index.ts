// AT Network (Rich Latimer and Martyn Hume Cobbe): a brand-new custom product,
// separate from Fin's. DRAFT: staging and local only (never prod).
//
// Written from the AT Network session's handover, products/at-network/spec.md
// (2026-10-21), on a blank base. Two sides, defined once:
//   - the client's side: 25 steps in five stages (./client-steps.ts), restructured
//     2026-10-25 around the kickoff call, with the Scope and Map (./scope-map.ts);
//   - the team's side: the deliverables behind them (./team-tasks.ts).
// OPEN in the spec, so placeholders for now: total days and stage windows, every
// due date, the portal tagline, the welcome video (Jesse will send the mp4).

import { defineCustomProduct } from "../custom";
import { atNetworkAgreement } from "./agreement";
import { atNetworkScopeMap } from "./scope-map";
import { atNetworkStages, atNetworkSteps } from "./client-steps";
import { atNetworkTeamTasks } from "./team-tasks";

export const atNetwork = defineCustomProduct({
  id: "at-network",
  name: "AT Network (Rich and Martyn)",
  version: "2026-10-25.11",
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
    brandName: "AT Network",
    // Draft tagline (Claude, Jesse's OK to choose, 2026-10-25). Shown under the name on the welcome screen.
    tagline: "Your website and funnel, built in the open.",
    lockedLook: "groveaurora", // an existing look; a look of its own would need code
    // "Ask Jesse" help panel: with no reviewed pack it only takes requests, which
    // become tasks on the board (Jesse, 2026-10-21).
    // Messages: step threads with the team (phase 1 of docs/at-network-communications-plan.md).
    // Sign-offs: completing these writes an Approval record (typed name) to the step's thread.
    features: { assistant: true, comms: true, approvalSteps: ["atn-kickoff-summary", "atn-signoff-site", "atn-signoff-funnel", "atn-review-final"] },
    // Step 1: the agreement, accepted as a signed record (text OPEN: placeholder).
    agreement: atNetworkAgreement,
    // The Scope and Map on "Read your scope and map" (draft, 2026-10-25): two tracks, site map, Phase 2 list.
    journeyMap: { step: "atn-scope-map", content: atNetworkScopeMap },
  },
  draftCopy: atNetworkSteps.map((s) => s.step.id),
});
