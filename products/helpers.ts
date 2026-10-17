// Reading product files: pure functions over plain data. Imports only ./types
// (and types from lib), so lib/productRegistry.ts, products/custom.ts, the
// Worker, scripts and checks can all use them without pulling in every product.

import type { StageTemplate } from "../lib/journeyTypes";
import type { ClientStep, DueDays, Product, ProductStage, ProductVariant, TeamTask } from "./types";

/**
 * The portal's journey template (the StageTemplate[] shape): team-only stages
 * left out, `steps` called `milestones`, the clientOnly flag removed. The same
 * for every variant: lib/productRegistry.ts filters it per variant.
 */
export function portalTemplate(product: Product): StageTemplate[] {
  return product.stages
    .filter((stage) => !stage.teamOnly)
    .map(({ steps, teamOnly: _teamOnly, ...stage }) => ({
      ...stage,
      milestones: steps.map(({ clientOnly: _clientOnly, ...milestone }) => milestone),
    }));
}

/** True when a channel-restricted step or task applies to the variant. */
export function appliesToVariant(item: { channels?: readonly string[] }, variant: ProductVariant): boolean {
  if (!item.channels || item.channels.length === 0) return true;
  if (!variant.channels || variant.channels.length === 0) return false;
  return item.channels.some((c) => (variant.channels as readonly string[]).includes(c));
}

/** True when the client of this variant sees the step in their portal. */
export function stepVisibleFor(step: ClientStep, variant: ProductVariant): boolean {
  return !step.hidden && appliesToVariant(step, variant);
}

/** The team tasks a client of this variant gets, in file order. */
export function teamTasksFor(product: Product, variant: ProductVariant): TeamTask[] {
  return product.teamTasks.filter((task) => appliesToVariant(task, variant));
}

export type StepNode = {
  step: ClientStep;
  /** Tasks that sit behind this step (task.step === step.id), in file order. */
  tasks: TeamTask[];
  /** Tasks placed under another step that also complete with this one. */
  alsoCompletedBy: TeamTask[];
};

export type StageNode = {
  stage: ProductStage;
  steps: StepNode[];
  /** Team work at stage level, behind no particular step. */
  teamOnly: TeamTask[];
};

/**
 * Stage → client step → team tasks. With a variant, only what that client
 * sees and gets (visible steps, matching channels). Without one, everything,
 * hidden steps included (for the product sheets).
 */
export function stepTree(product: Product, variant?: ProductVariant): StageNode[] {
  const tasks = variant ? teamTasksFor(product, variant) : product.teamTasks;
  return product.stages.map((stage) => ({
    stage,
    steps: stage.steps
      .filter((step) => !variant || stepVisibleFor(step, variant))
      .map((step) => ({
        step,
        tasks: tasks.filter((t) => t.step === step.id),
        alsoCompletedBy: tasks.filter((t) => t.step !== step.id && t.completesWithSteps?.includes(step.id)),
      })),
    teamOnly: tasks.filter((t) => t.stage === stage.id && !t.step),
  }));
}

/**
 * Days on the client's journey from a due window. Day 1 is the day they start.
 *   "Day 14" → 14–14, "Days 1-2" → 1–2, "Week 6" → 36–42, "Weeks 2-4" → 8–28,
 *   "Months 2-8" → 31–240 (30-day months).
 * Open windows ("As needed", "Ongoing", "Pre-build", "Post Go-Live / Weekly") → null.
 */
export function parseDueDays(due: string): DueDays | null {
  const text = due.trim();
  const range = /^(Day|Week|Month)s?\s+(\d+)(?:\s*[-–]\s*(\d+))?$/i.exec(text);
  if (!range) return null;
  const unit = range[1].toLowerCase();
  const a = Number(range[2]);
  const b = range[3] === undefined ? a : Number(range[3]);
  if (b < a) return null;
  if (unit === "day") return { start: a, end: b };
  const size = unit === "week" ? 7 : 30;
  return { start: (a - 1) * size + 1, end: b * size };
}

/** A task's day range: its explicit dueDays, else parsed from its due window. */
export function dueDaysFor(task: TeamTask): DueDays | null {
  return task.dueDays ?? parseDueDays(task.due);
}

/** Every client step in the product, in journey order. */
export function allSteps(product: Product): ClientStep[] {
  return product.stages.flatMap((stage) => stage.steps);
}
