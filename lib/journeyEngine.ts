// COMPAT SHIM (2026-10-17). The app reads products/ through lib/productRegistry.ts.
// Kept only because scripts/check-fin-journey.ts imports these names. Never
// import from app code. Never add journey data here.
//
// What check:fin reads here: the 12 per-client-type maps (product* and
// clientTypeLabels), built from every product variant's portal settings, and
// the stage builder with a client type's visibility and wording. No other
// exported object may have a name starting with "product" (check:fin collects
// them all; products:check enforces the list).

import type { ClientType } from "../products/index";
import type { PortalOverrides } from "../products/types";
import { buildStages } from "./journeyBuild";
import type { ClientChannel, JourneyStage, StageTemplate } from "./journeyTypes";
import { allVariants, milestoneVisibleForClientType } from "./productRegistry";

export type { ClientType } from "../products/index";
export type {
  ClientChannel,
  JourneyMilestone,
  JourneyStage,
  MilestoneStatus,
  MilestoneTemplate,
  StageStatus,
  StageTemplate,
} from "./journeyTypes";
export { completedStageCount, journeyProgressPercent } from "./journeyBuild";

/** client type → the variant's value for one portal setting (variants that set it only). */
function overrideMap<K extends keyof PortalOverrides>(key: K): Partial<Record<ClientType, NonNullable<PortalOverrides[K]>>> {
  return Object.fromEntries(
    allVariants()
      .filter(({ variant }) => variant.portal[key] !== undefined)
      .map(({ variant }) => [variant.clientType, variant.portal[key]]),
  ) as Partial<Record<ClientType, NonNullable<PortalOverrides[K]>>>;
}

export const productLockedLook = overrideMap("lockedLook");
export const productBrandName = overrideMap("brandName");
export const productHidesIncentive = overrideMap("hidesIncentive");
export const productIntroVideo = overrideMap("introVideo");
export const productHiddenTaskVideos = overrideMap("hiddenTaskVideos");
export const productTaskNotes = overrideMap("taskNotes");
export const productTaskDetails = overrideMap("taskDetails");
export const productHiddenTaskBooking = overrideMap("hiddenTaskBooking");
export const productHiddenTaskPlayground = overrideMap("hiddenTaskPlayground");
export const productHiddenTaskImportant = overrideMap("hiddenTaskImportant");
export const productTagline = overrideMap("tagline");

export const clientTypeLabels = Object.fromEntries(allVariants().map(({ variant }) => [variant.clientType, variant.label])) as Record<ClientType, string>;

/** True when a step appears for a client of this type (lib/productRegistry.ts). */
export function milestoneVisibleFor(m: { hidden?: boolean; channels?: ClientChannel[] }, clientType: ClientType): boolean {
  return milestoneVisibleForClientType(m, clientType);
}

/** The stage tree for a client type (lib/journeyBuild.ts), with its visibility and step wording. */
export function buildStagesFromTemplate(template: StageTemplate[], completedIds: Set<string>, currentDay: number, clientType: ClientType): JourneyStage[] {
  return buildStages(template, completedIds, currentDay, {
    visible: (m) => milestoneVisibleFor(m, clientType),
    detail: (m) => productTaskDetails[clientType]?.[m.id] ?? m.detail,
  });
}
