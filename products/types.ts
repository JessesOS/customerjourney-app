// Product files: each product is defined once, holding the client steps (what
// the client sees in their portal) and the team tasks behind them (what the
// team does). Option D, Phase 1 (plan: ~/.claude/plans/temporal-waddling-wave.md).
//
// Plain data, no runtime imports: safe to load in the Worker, in scripts and in
// the browser. The readable sheets in docs/products/ are generated from these
// files (npm run products:render). Change a product by asking Claude.

import type { ClientChannel, ClientType, MilestoneTemplate } from "../lib/journeyEngine";

export type { ClientChannel, ClientType };

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
 * Per-variant portal tweaks. Each key mirrors one `product*` map in
 * lib/journeyEngine.ts (productLockedLook → lockedLook, and so on), copied
 * verbatim. The golden-overrides check keeps the two equal.
 */
export type PortalOverrides = {
  lockedLook?: "groveaurora";
  brandName?: string;
  hidesIncentive?: true;
  introVideo?: { src: string; poster: string; title: string };
  hiddenTaskVideos?: string[];
  taskNotes?: Record<string, string>;
  taskDetails?: Record<string, string>;
  hiddenTaskBooking?: string[];
  hiddenTaskPlayground?: string[];
  hiddenTaskImportant?: string[];
  tagline?: string;
};

export type ProductVariant = {
  /** Stored on a team board (team_boards.variant). Same as the client type. */
  id: string;
  /** The portal's client type (portal_clients.client_type). */
  clientType: ClientType;
  /** As shown in admin (clientTypeLabels in lib/journeyEngine.ts). */
  label: string;
  /** Ad channels. Steps and tasks restricted to other channels are left out. Omitted = no channel split. */
  channels?: ClientChannel[];
  portal: PortalOverrides;
};

/** live: new clients start on it. paused: kept for reference, never seeded. draft: being written. */
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

export type Product = {
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
  variants: ProductVariant[];
  source: ProductSource;
};
