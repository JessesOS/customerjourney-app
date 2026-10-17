// Shared journey engine — the generic types + stage-builder used by every
// product (Scale, Respond, ...). Each product owns its own template file
// (lib/onboardingJourney.ts for Scale, lib/respondJourney.ts for Respond) and
// calls buildStagesFromTemplate() with its own data. The portal UI
// (ClientPortalExperience.tsx and friends) only ever touches JourneyStage /
// JourneyMilestone, so it never needs to know which product it's rendering.
//
// The types live in lib/journeyTypes.ts and the pure builder in
// lib/journeyBuild.ts (2026-10-17); both are re-exported here unchanged.

import type { ClientChannel, JourneyStage, StageTemplate } from "./journeyTypes";
import { buildStages } from "./journeyBuild";

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

/** Which product + ad channel(s) a client is on. Stored on the client record
    (portal_clients.client_type); chosen in admin. Scale clients pick a channel
    variant; Respond has no channels at all. */
// "bss": custom product for Bitcoin Success School (Fin Creighton), the first signed
// client, 2026-10-15. For now it runs the Scale journey exactly as a Meta-only
// client sees it; give it its own template when the custom work is defined.
// "bss-meta": BSS Meta ads only (Jesse, 2026-10-16). An exact copy of Scale — Meta
// ads only (same tasks, same ids), with the BSS Launchpad name and locked look.
// The custom 41-task "bss" journey is paused.
export type ClientType = "meta" | "google" | "meta-google" | "respond" | "bss" | "bss-meta";

/** Products whose portal look is fixed, whatever look the client record holds.
    BSS (Jesse, 2026-10-15): the Aurora welcome, then Grove Aurora with the
    journey rail. Grove Aurora opens on the Aurora welcome by itself. */
export const productLockedLook: Partial<Record<ClientType, "groveaurora">> = {
  bss: "groveaurora",
  "bss-meta": "groveaurora",
};

/** Products that carry their own name in the portal (welcome, header, browser
    tab) instead of the house product name. BSS: "BSS Launchpad" (Jesse, 2026-10-15). */
export const productBrandName: Partial<Record<ClientType, string>> = {
  bss: "BSS Launchpad",
  "bss-meta": "BSS Launchpad",
};

/** Products that never show the $200 "move fast" incentive popup. BSS: off
    (Jesse, 2026-10-15). Scale Meta-only: off (Jesse, 2026-10-16). */
export const productHidesIncentive: Partial<Record<ClientType, true>> = {
  bss: true,
  meta: true,
  "bss-meta": true,
};

/** A video that plays after the welcome's "Get started", before the journey
    page. BSS Meta ads only: Jesse's walkthrough (2026-10-16), served from R2. */
export const productIntroVideo: Partial<Record<ClientType, { src: string; poster: string; title: string }>> = {
  "bss-meta": {
    src: "/api/media/bss-launch-walkthrough.mp4",
    poster: "/portal/media/bss-launch-walkthrough-poster.jpg",
    title: "Welcome to BSS Launchpad",
  },
};

/** Tasks whose "Watch how it works" video is hidden for a product.
    BSS Meta ads only: the mobile-app, calendar and social walkthroughs (Jesse, 2026-10-16). */
export const productHiddenTaskVideos: Partial<Record<ClientType, string[]>> = {
  "bss-meta": ["ob-4", "ob-6", "ob-6b", "bd-3"],
};

/** A product-only note shown at the top of a task. BSS Meta ads only: CRM
    access isn't ready yet (Jesse, 2026-10-16). */
export const productTaskNotes: Partial<Record<ClientType, Record<string, string>>> = {
  "bss-meta": {
    "ob-2": "No need to book this one. We've already been working through this together, so you can tick it off.",
    "ob-crm": "CRM access is coming very soon.",
    "ob-6": "You can do this once your CRM access is ready. We'll let you know.",
    "ob-6b": "You can do this once your CRM access is ready. We'll let you know.",
    "ob-6c": "Not needed at this point. If you need a phone number, it's billed at cost, along with your SMS and call charges.",
    "ts-1": "Your CRM access is coming soon. You can check this once it's set up.",
    "ts-2": "This opens once your CRM is connected and live. We'll let you know when it's ready to test.",
    "ts-3": "Booking isn't open yet. We'll give you access and let you know when it's ready.",
  },
};

/** A product's own description for a task, replacing the template's. BSS Meta
    ads only: the two booking tasks no longer say "pick a time below", because
    their calendars are hidden (Jesse, 2026-10-16). */
export const productTaskDetails: Partial<Record<ClientType, Record<string, string>>> = {
  "bss-meta": {
    "ob-2": "A live 30-minute walkthrough of your portal, your milestones, and your messaging center.",
    "ts-3": "Once testing is done, we'll lock in your go-live walkthrough together.",
  },
};

/** Tasks whose booking calendar is hidden for a product. BSS Meta ads only:
    the welcome call is already done and the go-live calendar isn't set up yet
    (Jesse, 2026-10-16). */
export const productHiddenTaskBooking: Partial<Record<ClientType, string[]>> = {
  "bss-meta": ["ob-2", "ts-3"],
};

/** Tasks whose live AI receptionist test is hidden for a product. BSS Meta ads
    only: testing waits for the CRM connection (Jesse, 2026-10-16). */
export const productHiddenTaskPlayground: Partial<Record<ClientType, string[]>> = {
  "bss-meta": ["ts-2"],
};

/** Tasks whose "Important" box is hidden for a product, where it no longer
    applies. BSS Meta ads only: the payment warning (Jesse, 2026-10-16). */
export const productHiddenTaskImportant: Partial<Record<ClientType, string[]>> = {
  "bss-meta": ["ob-6c"],
};

/** A short line under a custom product's name on the welcome. */
export const productTagline: Partial<Record<ClientType, string>> = {
  bss: "Onboarding & delivery",
  "bss-meta": "Onboarding & delivery",
};

export const clientTypeLabels: Record<ClientType, string> = {
  meta: "Scale — Meta ads",
  google: "Scale — Google Ads",
  "meta-google": "Scale — Meta + Google Ads",
  respond: "CRM — Respond",
  bss: "BSS Fin Creighton",
  "bss-meta": "BSS Meta ads only",
};

/** True when a milestone should appear for a client of the given type.
    Applies both the hidden flag and the channel restriction. Channel
    restrictions only ever apply within Scale — a Respond client never has
    channels set on its milestones, so this always resolves to visible. */
export function milestoneVisibleFor(m: { hidden?: boolean; channels?: ClientChannel[] }, clientType: ClientType): boolean {
  if (m.hidden) return false;
  if (!m.channels || m.channels.length === 0) return true;
  if (clientType === "meta-google") return true;
  if (clientType === "meta" || clientType === "google") return m.channels.includes(clientType);
  if (clientType === "bss" || clientType === "bss-meta") return m.channels.includes("meta"); // Scale, Meta only
  return false;
}

/**
 * Builds the full stage/milestone status tree from a set of completed
 * milestone ids and the client's current day (lib/journeyBuild.ts), with this
 * client type's visibility and per-product step descriptions.
 */
export function buildStagesFromTemplate(
  template: StageTemplate[],
  completedIds: Set<string>,
  currentDay: number,
  clientType: ClientType,
): JourneyStage[] {
  return buildStages(template, completedIds, currentDay, {
    visible: (m) => milestoneVisibleFor(m, clientType),
    detail: (m) => productTaskDetails[clientType]?.[m.id] ?? m.detail,
  });
}
