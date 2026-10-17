/**
 * The props that make the portal show one client type, for the markup checks
 * (scripts/journeys/ssr.ts). The ONLY file that changes when the portal
 * component's API changes: ssr.ts and the frozen markup hashes stay put.
 *
 * Since 2026-10-17: ClientPortalExperience takes the client type's
 * PortalJourney (lib/productRegistry.ts), and the welcome screens take the
 * product's wordmark plus the variant's name, tagline and intro video.
 */
import { buildStages } from "../../lib/journeyBuild";
import { portalJourneyFor } from "../../lib/productRegistry";
import type { IntroVideo } from "./contract";

/** Merged over the base props of ClientPortalExperience. */
export function portalProps(clientType: string): Record<string, unknown> {
  return { journey: portalJourneyFor(clientType) };
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
  const journey = portalJourneyFor(clientType);
  return {
    brandProps: { wordmark: journey.wordmark, brandName: journey.brandName },
    tagline: journey.tagline,
    introVideo: journey.introVideo,
    stages: buildStages(journey.stages, new Set(), 1).map((s) => s.name),
  };
}
