// Product files: each product is defined once, holding the client steps (what
// the client sees in their portal), the team tasks behind them (what the team
// does) and the portal settings (wording, timeline, branding, voice guide,
// Ask-AI). Option D (plan: ~/.claude/plans/temporal-waddling-wave.md).
//
// Product files are server/script data. Never import products/ from a "use
// client" module: the portal gets plain data through lib/productRegistry.ts,
// so team tasks (internal notes, staff names) never reach a browser.
// products/** only imports TYPES from lib/** (npm run products:check enforces it).
// The readable sheets in docs/products/ are generated from these files
// (npm run products:render). Change a product by asking Claude; the how-to is
// docs/products/README.md.

import type { AskItem, ClientChannel, IntroVideo, MilestoneTemplate, PortalLook, StringPlan } from "../lib/journeyTypes";

export type { ClientChannel };

/** Stage ids, in journey order. "support" is team-only: it never reaches the portal. */
export const STAGE_ORDER = ["onboarding", "build", "testing", "go-live", "post-launch", "support"] as const;
export type StageId = (typeof STAGE_ORDER)[number];

/**
 * A client step: exactly today's portal task (`MilestoneTemplate` in
 * lib/journeyEngine.ts), plus one flag. Ids and wording match the portal.
 */
export type ClientStep = MilestoneTemplate & {
  /** The client does this step alone: no team task sits behind it. Never sent to the portal. */
  clientOnly?: boolean;
};

export type ProductStage = {
  id: StageId;
  name: string;
  dayStart: number;
  dayEnd: number;
  /** Open-ended (support after launch): shown without days in the portal. */
  ongoing?: boolean;
  blurb?: string;
  statusNotes: string[];
  /** Client steps, in portal order. Empty for a team-only stage. */
  steps: ClientStep[];
  /** Team work only: the stage never reaches the client's portal. */
  teamOnly?: boolean;
};

export type TaskPriority = "low" | "normal" | "high" | "critical";

/** A day range on the client's journey (day 1 = the day they start). */
export type DueDays = { start: number; end: number };

export type TeamTask = {
  /** Template id. Stable: never reuse or renumber (live boards are stamped with it). */
  id: string;
  title: string;
  /** Guidance for whoever does the task. Kept on purpose (CSM showed it on demo clients only). */
  notes: string;
  stage: StageId;
  /** Grouping on the board, e.g. "Welcome Onboarding Call". */
  category: string;
  /** The client step this task sits behind. Omitted = team-only work at stage level. */
  step?: string;
  /** The task counts as done once the client has finished all of these steps. */
  completesWithSteps?: string[];
  /** One of the product's roles. */
  role: string;
  priority: TaskPriority;
  /** The due window as the team says it: "Days 1-2", "Day 14", "As needed". */
  due: string;
  /** An explicit day range. When omitted, parseDueDays(due) is used. */
  dueDays?: DueDays;
  /** Ids of team tasks in this product that should be done first. */
  dependencies: string[];
  /** Ad channels this task applies to (Scale). Omitted = every variant. */
  channels?: ClientChannel[];
};

/**
 * Per-variant portal tweaks. Anything absent is off. The first eleven keys
 * were the `product*` maps in lib/journeyEngine.ts (productLockedLook →
 * lockedLook, and so on), copied verbatim; check:journeys freezes them.
 */
export type PortalOverrides = {
  /** The portal look, whatever look the client record holds. */
  lockedLook?: PortalLook;
  /** The name the client sees (welcome, header, browser tab) instead of the product's wordmark. */
  brandName?: string;
  /** Never show the $200 "move fast" popup. */
  hidesIncentive?: true;
  /** A video that plays after the welcome's "Get started". */
  introVideo?: IntroVideo;
  /** Steps whose "Watch how it works" video is hidden. */
  hiddenTaskVideos?: string[];
  /** A note shown at the top of a step, by step id. */
  taskNotes?: Record<string, string>;
  /** A step's own description, replacing the product's, by step id. */
  taskDetails?: Record<string, string>;
  /** Steps whose booking calendar is hidden. */
  hiddenTaskBooking?: string[];
  /** Steps whose live AI receptionist test is hidden. */
  hiddenTaskPlayground?: string[];
  /** Steps whose "Important" box is hidden. */
  hiddenTaskImportant?: string[];
  /** A short line under the name on the welcome. */
  tagline?: string;
  /** Stages whose voice guide this variant skips. */
  hiddenGuideStages?: StageId[];
  /** The String Theory plan (progress panel). Absent = no String Theory tab. */
  stringPlan?: StringPlan;
};

export type ProductVariant<C extends string = string> = {
  /** Stored on a team board (team_boards.variant). Same as the client type. */
  id: C;
  /** The portal's client type (portal_clients.client_type). Stable: never renamed or reused. */
  clientType: C;
  /** On the team board, and the variant's name everywhere else unless adminLabel is set. */
  label: string;
  /** The admin dropdown and client list wording, when it differs from label. */
  adminLabel?: string;
  /** Order in the admin dropdown, lower first. Default 100. */
  pickerOrder?: number;
  /** false: never offered for new clients, whatever the product's status. */
  offered?: boolean;
  /** Ad channels. Steps and tasks restricted to other channels are left out. Omitted = no channel split. */
  channels?: ClientChannel[];
  portal: PortalOverrides;
};

/** The voice guide: one narrated script per portal stage. Audio lives at public/portal/voice/<audioPrefix>-<stage>.m4a. */
export type VoiceGuide = { audioPrefix: string; scripts: Partial<Record<StageId, string>> };

/** Step-specific portal features. Each one is code that already exists; a product only switches it on for its steps. */
export type ProductFeatures = {
  /** Steps that show the live AI receptionist test. */
  playgroundSteps?: string[];
  /** The step whose content is the receptionist's qualification script. */
  receptionistScriptStep?: string;
  /** Steps that show the landing-page preview (/portal/<token>/landing). */
  landingPreviewSteps?: string[];
  /** Steps that never stop a client moving on (listed as "missing", not blocking, in journey status). */
  nonBlockingSteps?: string[];
  /** The "Ask Jesse" help panel: a sound-wave button that answers from the client's reviewed pack and takes support requests. */
  assistant?: boolean;
  /** Home-screen app icon: public/portal/icons/<name>-180.png, -192.png and -512.png. Saved to a phone's home screen, the portal opens full screen with this icon. */
  appIcon?: string;
};

/** Product-level portal settings. Anything absent is off. */
export type ProductPortal = {
  /** The house name the client sees when the variant has no brandName, e.g. "Scale" or "CRM". */
  wordmark: string;
  voiceGuide?: VoiceGuide;
  /** Example questions with scripted answers, per portal stage. */
  askAi?: Partial<Record<StageId, AskItem[]>>;
  features?: ProductFeatures;
};

/**
 * live: offered for new clients, and their boards start.
 * paused: existing clients keep it (their portal renders as before); never
 *   offered for new clients, never put on a board.
 * draft: offered and put on boards only where PRODUCT_DRAFTS=1 (staging).
 */
export type ProductStatus = "live" | "paused" | "draft";

export type ProductSource = {
  /** Where the team tasks came from. */
  from: string;
  /** The CSM commit the tasks were converted from. */
  commit: string;
  files: string[];
  document?: { title: string; url: string };
  convertedOn: string;
  /** The conversion report, listing every change and everything dropped. */
  report: string;
};

export type Product<C extends string = string> = {
  id: string;
  name: string;
  /** "YYYY-MM-DD.N". Bump it with every change (the version-lock check enforces it). */
  version: string;
  status: ProductStatus;
  /** Days to go-live as shown in the portal header. null = not set yet (draft). */
  totalDays: number | null;
  /** Team roles a task can be given to. */
  roles: string[];
  /** In journey order, team-only stages included. */
  stages: ProductStage[];
  teamTasks: TeamTask[];
  variants: ProductVariant<C>[];
  /** Portal settings. Required once the product has variants (products:check enforces it). */
  portal?: ProductPortal;
  source: ProductSource;
  /** Set by defineCustomProduct (products/custom.ts): what this product changed from its base. */
  custom?: CustomDerivation;
};

/**
 * How a custom product differs from its base, worked out by
 * defineCustomProduct. The sheet's "Differences" section is rendered from it.
 */
export type CustomDerivation = {
  base: { id: string; name: string; version: string; variant?: string } | "blank";
  /** Repo path of the Markdown spec Jesse wrote, e.g. "products/bss-custom/spec.md". */
  spec: string;
  /** Every new step and task id starts with it. */
  idPrefix: string;
  /** Step ids whose client wording Claude drafted (must be empty before going live). */
  draftCopy: string[];
  removedSteps: string[];
  changedSteps: { id: string; fields: string[] }[];
  addedSteps: string[];
  removedTasks: { id: string; reason: string }[];
  changedTasks: { id: string; fields: string[] }[];
  addedTasks: string[];
  droppedDependencies: { task: string; dependsOn: string }[];
  /** Kept tasks that no longer complete with a step the spec removed. */
  droppedCompletions: { task: string; step: string }[];
  /** Stages the spec added, changed or dropped, each changed field old → new (null = not set). */
  stageChanges: StageChange[];
  /** Roles the spec added and removed. */
  roleChanges: { added: string[]; removed: string[] };
  /** The base variant's portal tweaks (name, look, notes, hidden parts, String Theory) and what became of them. */
  variantPortal: VariantPortalDerivation;
  /** totalDays, the stage list or any stage's days differ from the base. */
  timelineChanged: boolean;
  /** Portal settings taken from the base as they are. */
  inherited: { voiceGuide: boolean; askAi: boolean; features: boolean };
};

/** A stage field's value in a StageChange. null = not set. */
export type StageValue = string | number | boolean | string[] | null;

export type StageChange = {
  id: StageId;
  change: "added" | "changed" | "dropped";
  /** Each field the spec set to a new value. Empty for a dropped stage. */
  fields: { field: string; from: StageValue; to: StageValue }[];
};

export type VariantPortalDerivation = {
  /** The spec's `variantPortal`. null: the base variant has no tweaks to keep (or the base is blank). */
  mode: "inherit" | "none" | null;
  /** The tweak keys the base variant has (hidesIncentive not counted: the popup follows portal.incentive). */
  base: string[];
  /** Keys taken from the base variant ("inherit"), cut to this product's steps and stages. */
  inherited: string[];
  /** Keys this product sets itself (portal.*). Each replaces the base variant's value, where it had one. */
  own: string[];
  /** What was left out, e.g. "taskNotes on ob-4 (not a step this product shows)". */
  dropped: string[];
};

/** The client types a product defines. */
export type ClientTypeOf<P> = P extends Product<infer C> ? C : never;
