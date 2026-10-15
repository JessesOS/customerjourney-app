// Cross-product helpers for API routes that validate a milestone/form id
// without needing to know which product (Scale vs Respond) it belongs to.
// Milestone ids are unique across products (ob-/bd-/ts-/gl-/pl- for Scale,
// rsp- for Respond), so routes can simply validate against the union.
import { journeyTemplate } from "./onboardingJourney";
import { respondJourneyTemplate } from "./respondJourney";
import { bssJourneyTemplate } from "./bssJourney";
import type { MilestoneTemplate } from "./journeyEngine";

export const allMilestoneTemplates: MilestoneTemplate[] = [
  ...journeyTemplate.flatMap((stage) => stage.milestones),
  ...respondJourneyTemplate.flatMap((stage) => stage.milestones),
  ...bssJourneyTemplate.flatMap((stage) => stage.milestones),
];
