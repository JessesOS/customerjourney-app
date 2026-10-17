// COMPAT SHIM (2026-10-17). The app reads products/ through lib/productRegistry.ts.
// Kept only because scripts/check-fin-journey.ts imports these names. Never
// import from app code. Never add journey data here.
//
// The Scale journey template, its days and the demo defaults, as check:fin
// reads them. The template is the Scale product file's (products/scale/), the
// default client type's product.

import {
  buildStagesFromTemplate,
  clientTypeLabels,
  completedStageCount,
  journeyProgressPercent,
  milestoneVisibleFor,
  type ClientChannel,
  type ClientType,
  type JourneyMilestone,
  type JourneyStage,
  type MilestoneStatus,
  type StageStatus,
  type StageTemplate,
} from "./journeyEngine";
import { DEFAULT_CLIENT_TYPE, portalTemplateFor, totalDaysFor } from "./productRegistry";

export {
  clientTypeLabels,
  completedStageCount,
  journeyProgressPercent,
  milestoneVisibleFor,
  type ClientChannel,
  type ClientType,
  type JourneyMilestone,
  type JourneyStage,
  type MilestoneStatus,
  type StageStatus,
};

export const journeyTemplate: StageTemplate[] = portalTemplateFor(DEFAULT_CLIENT_TYPE);

export const journeyTotalDays = totalDaysFor(DEFAULT_CLIENT_TYPE);

/**
 * Demo/default completion state (check:fin's "defaults" set): Onboarding fully
 * done, Build's first milestone done.
 */
export const defaultCompletedMilestoneIds: string[] = [
  ...journeyTemplate[0].milestones.map((m) => m.id),
  journeyTemplate[1].milestones[0].id,
];

export const defaultCurrentDay = 12;

export function buildJourneyStages(
  completedIds: Set<string>,
  currentDay: number,
  clientType: ClientType = DEFAULT_CLIENT_TYPE,
): JourneyStage[] {
  return buildStagesFromTemplate(journeyTemplate, completedIds, currentDay, clientType);
}
