// COMPAT SHIM (2026-10-17). The app reads products/ through lib/productRegistry.ts.
// Kept only because scripts/check-fin-journey.ts imports these names. Never
// import from app code. Never add journey data here.
//
// A stage's Ask-AI questions now live with their product (portal.askAi, e.g.
// products/scale/portal.ts); the portal reads them from its PortalJourney.

import { askItemsOf } from "./journeyBuild";
import type { AskItem } from "./journeyTypes";
import { portalJourneyFor } from "./productRegistry";

export type { AskItem };

export function askItemsFor(clientType: string, stageId: string): AskItem[] {
  return askItemsOf(portalJourneyFor(clientType), stageId);
}
