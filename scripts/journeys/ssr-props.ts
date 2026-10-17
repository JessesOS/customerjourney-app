/**
 * The props that make the portal show one client type, for the markup checks
 * (scripts/journeys/ssr.ts). The ONLY file that changes when the portal
 * component's API changes: ssr.ts and the frozen markup hashes stay put.
 *
 * Today (2026-10-17): ClientPortalExperience takes `clientType`, and the
 * welcome screens take `brand` ("scale" | "respond") plus the product maps.
 */
import { productBrandName, productIntroVideo, productTagline, type ClientType } from "../../lib/journeyEngine";
import { buildJourneyStages } from "../../lib/onboardingJourney";
import { buildRespondJourneyStages } from "../../lib/respondJourney";
import { buildBssJourneyStages } from "../../lib/bssJourney";
import type { IntroVideo } from "./contract";

/** Merged over the base props of ClientPortalExperience. */
export function portalProps(clientType: string): Record<string, unknown> {
  return { clientType };
}

export type WelcomeProps = {
  /** Spread into every welcome screen. */
  brandProps: Record<string, unknown>;
  tagline?: string;
  introVideo?: IntroVideo;
  /** The built stage names (WelcomeAurora). */
  stages: string[];
};

export function welcomeProps(clientType: string): WelcomeProps {
  const ct = clientType as ClientType;
  const none = new Set<string>();
  const stages = ct === "respond" ? buildRespondJourneyStages(none, 1) : ct === "bss" ? buildBssJourneyStages(none, 1) : buildJourneyStages(none, 1, ct);
  return {
    brandProps: { brand: ct === "respond" ? "respond" : "scale", brandName: productBrandName[ct] },
    tagline: productTagline[ct],
    introVideo: productIntroVideo[ct],
    stages: stages.map((s) => s.name),
  };
}
