// COMPAT SHIM (2026-10-17). The app reads products/ through lib/productRegistry.ts.
// Kept only because scripts/check-fin-journey.ts imports these names. Never
// import from app code. Never add journey data here.
//
// A stage's voice guide now lives with its product (portal.voiceGuide, e.g.
// products/scale/portal.ts); the portal reads it from its PortalJourney.

import { stageGuideOf } from "./journeyBuild";
import type { StageGuide } from "./journeyTypes";
import { portalJourneyFor } from "./productRegistry";

export type { StageGuide };

export function stageGuideFor(clientType: string, stageId: string): StageGuide | undefined {
  return stageGuideOf(portalJourneyFor(clientType), stageId);
}
