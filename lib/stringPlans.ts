// COMPAT SHIM (2026-10-17). The app reads products/ through lib/productRegistry.ts.
// Kept only because scripts/check-fin-journey.ts imports these names. Never
// import from app code. Never add journey data here.
//
// A String Theory plan now lives with its variant (portal.stringPlan:
// products/bss/portal.ts, products/scale/portal.ts).

import type { StringPlan } from "./journeyTypes";
import { portalJourneyFor } from "./productRegistry";

export type { StringPlan, StringWorkstream } from "./journeyTypes";

function planOf(clientType: string): StringPlan {
  const plan = portalJourneyFor(clientType).stringPlan;
  if (!plan) throw new Error(`${clientType} has no String Theory plan`);
  return plan;
}

export const bssStringPlan: StringPlan = planOf("bss");
export const scaleMetaStringPlan: StringPlan = planOf("bss-meta");
