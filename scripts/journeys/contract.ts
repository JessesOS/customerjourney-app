/**
 * Frozen journeys: the contract. What the portal is built from and shows, for
 * one client type, as plain data. A "producer" computes it from code; the
 * fixtures in scripts/fixtures/journeys/ hold the frozen copy.
 *
 * Fixtures store OUTPUTS (templates, renders, decisions, hashes of
 * server-rendered markup), never the code that made them. So they keep
 * proving "nothing changed" while the code underneath is replaced.
 *
 * Added 2026-10-17 (Option D, Phase 3). See scripts/check-journeys.ts.
 */
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type { AskItem } from "../../lib/askAi";
import type { JourneyStage, StageTemplate } from "../../lib/journeyEngine";
import type { PortalFormDefinition } from "../../lib/onboardingForm";
import type { MappedProduct } from "../../lib/productMapping";
import type { StageGuide } from "../../lib/stageGuide";
import type { StringPlan } from "../../lib/stringPlans";

/** Every client type frozen, plus one unknown stored type (it renders as Scale with channel steps hidden). */
export const CLIENT_TYPES = ["meta", "google", "meta-google", "bss-meta", "respond", "bss", "bss-custom", "at-network", "zz-unknown"] as const;
export const DAYS = [1, 12, 30] as const;
export const SSR_DAYS = [1, 30] as const;
/** Every portal look (PORTAL_THEME_VARIANTS in lib/portalClientStore.ts). */
export const SSR_THEMES = ["grove", "groveaurora", "handoff", "cobalt", "aurora", "calm", "warm", "cool", "neutral"] as const;
/** Every design skin the portal header can take (CPE `designSkin`). */
export const HEADER_SKINS = ["current", "handoff", "cobalt", "aurora", "calm", "grove", "groveaurora"] as const;
/** Every hub that shows the product name. */
export const HUBS = ["handoff", "cobalt", "aurora", "grove"] as const;
/** GHL product names, as sold (lib/productMapping.ts). */
export const GHL_SAMPLES = [
  "Respond - VIP [ Trial & Sub ]",
  "USD Scale - SETUP 2x Split Payments",
  "Scale",
  "respond",
  "Responder",
  "Convert",
  "AISS Monthly",
  "Website build add-on",
] as const;

export type IntroVideo = { src: string; poster: string; title: string };
export type ClientTypeOption = { value: string; label: string };
export type ChecklistStage = { id: string; name: string; milestones: { id: string; title: string; awaitingTeam: boolean }[] };

export type StepContract = {
  detail: string;
  note: string | null;
  showsVideo: boolean;
  showsImportant: boolean;
  showsBooking: boolean;
  showsPlayground: boolean;
  showsLandingPreview: boolean;
  interviewAudioBase: string | null;
};

export type JourneyContract = {
  clientType: string;
  journeyTemplate: StageTemplate[];
  visibleIds: string[];
  /** `${set}@day${d}` → the built stages. Stored in fixtures as hashes. */
  renders: Record<string, JourneyStage[]>;
  stageCompletedBy: Record<"none" | "half", Record<string, string | null>>;
  totalDays: number;
  currentDayCap: number;
  adminDayTotal: number;
  tabTitle: string;
  lockedLook: string | null;
  wordmark: string;
  brandName: string | null;
  tagline: string | null;
  introVideo: IntroVideo | null;
  hidesIncentive: boolean;
  headerName: Record<string, string>;
  hubBrand: Record<string, string>;
  steps: Record<string, StepContract>;
  stageGuides: Record<string, StageGuide | null>;
  askItems: Record<string, AskItem[]>;
  stringPlan: StringPlan | null;
  /** null unless some visible step shows the playground. */
  receptionistScriptStep: string | null;
  journeyStatus: { visible: { id: string; title: string; stageName: string }[]; nonBlocking: string[]; formStepId: string | null };
  totalMilestoneCount: number;
  adminChecklist: ChecklistStage[];
  adminLabel: string;
  label: string | null;
  formSteps: Record<string, string | null>;
};

export type GlobalContract = {
  acceptedClientTypes: string[];
  adminOptions: ClientTypeOption[];
  defaultClientType: string;
  allStepIds: string[];
  uploadStepIds: string[];
  adminForms: { formIds: string[]; editableStepIds: string[] };
  forms: Record<string, PortalFormDefinition>;
  ghl: Record<string, MappedProduct | null>;
  media: Record<string, { key: string; type: string }>;
  teamRoles: string[];
};

/** Computes the contract from code. One per implementation (legacy lib/*, product registry). */
export type Producer = {
  name: string;
  contract(clientType: string): JourneyContract;
  global(): GlobalContract;
};

/** Stable JSON: object keys sorted, undefined dropped, so key order never causes a false diff. */
export function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .filter((k) => (value as Record<string, unknown>)[k] !== undefined)
        .sort()
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

/** sha256 hex of the canonical JSON. */
export function hashOf(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

/** The value as it reads back from a fixture file (canonical, undefined dropped). */
export function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(canonical(value))) as T;
}

/** The first path where two values differ, for a readable failure. (Copied from products/check.ts.) */
export function firstDiff(a: unknown, b: unknown, path = ""): string | null {
  if (isDeepStrictEqual(a, b)) return null;
  if (a && b && typeof a === "object" && typeof b === "object") {
    const keys = [...new Set([...Object.keys(a as object), ...Object.keys(b as object)])];
    for (const k of keys) {
      const d = firstDiff((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}${Array.isArray(a) ? `[${k}]` : `.${k}`}`);
      if (d) return d;
    }
  }
  return `${path || "(root)"}: now ${JSON.stringify(a)?.slice(0, 120)} vs frozen ${JSON.stringify(b)?.slice(0, 120)}`;
}

/** Completion sets for the renders: none, all, alternate (0,2,4…), last, first-1…first-N. */
export function completionSets(visibleIds: string[]): Record<string, string[]> {
  const sets: Record<string, string[]> = {
    none: [],
    all: [...visibleIds],
    alternate: visibleIds.filter((_, i) => i % 2 === 0),
    last: visibleIds.length ? [visibleIds[visibleIds.length - 1]] : [],
  };
  visibleIds.forEach((_, i) => { sets[`first-${i + 1}`] = visibleIds.slice(0, i + 1); });
  return sets;
}

/** Completion sets for the server-rendered markup: none, half (first ceil(n/2)), all. */
export function ssrSets(visibleIds: string[]): Record<"none" | "half" | "all", string[]> {
  return { none: [], half: visibleIds.slice(0, Math.ceil(visibleIds.length / 2)), all: [...visibleIds] };
}
