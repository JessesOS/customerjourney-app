// defineCustomProduct: a custom product described as its differences from a
// base (Scale, Respond, any product file, or blank). It resolves, at import
// time, into a plain Product, so the loader, the portal, the board, the sheets,
// the version lock and every check treat it like any other product.
//
// It throws on any mistake, listing every one: a product file that throws
// stops the Worker, so never deploy without npm run products:check.
// How-to: docs/products/README.md, "Making a custom product".
//
// Imports only ./types and ./helpers (npm run products:check enforces it).

import { allSteps, appliesToVariant } from "./helpers";
import {
  STAGE_ORDER,
  type ClientStep,
  type CustomDerivation,
  type PortalOverrides,
  type Product,
  type ProductFeatures,
  type ProductPortal,
  type ProductStage,
  type ProductStatus,
  type ProductVariant,
  type StageChange,
  type StageId,
  type StageValue,
  type TeamTask,
  type VoiceGuide,
} from "./types";

type AskAi = NonNullable<ProductPortal["askAi"]>;
type StringPlan = NonNullable<PortalOverrides["stringPlan"]>;

/** Changes to a stage. A stage the base doesn't have needs name, dayStart and dayEnd. */
export type StagePatch = Partial<Pick<ProductStage, "name" | "dayStart" | "dayEnd" | "ongoing" | "blurb" | "statusNotes">>;

export type CustomProductSpec<C extends string> = {
  /** The folder name, products/<id>/. */
  id: string;
  /** The team's name for it (sheets, board). Never shown to the client: that is brandName or wordmark. */
  name: string;
  /** "YYYY-MM-DD.N". Bump it with every change. */
  version: string;
  status: ProductStatus;
  /** Stored on clients; kebab-case; never renamed or reused. */
  clientType: C;
  label: string;
  adminLabel?: string;
  /** Repo path of the Markdown spec, e.g. "products/<id>/spec.md". */
  spec: string;
  /** What it starts from. `version` pins the base: a base change fails until it is reviewed. */
  base: "blank" | { product: Product; version: string; variant?: string };
  /**
   * The base variant's portal tweaks (its name, look, intro video, step notes
   * and hidden parts, String Theory). Required when it has any:
   * "inherit" keeps them, cut to the steps and stages this product keeps, with
   * each `portal` key you set replacing the base variant's value for that key;
   * "none" leaves them out. (hidesIncentive doesn't count: the $200 popup
   * follows `portal.incentive`.)
   */
  variantPortal?: "inherit" | "none";
  /** Every NEW step/task id starts with it, e.g. "bssc-". */
  idPrefix: string;
  /** Default: the base's. Required for blank. */
  totalDays?: number;
  /** null = drop the stage (it must end up empty). */
  stages?: Partial<Record<StageId, StagePatch | null>>;
  steps?: {
    /**
     * Fields merged into an inherited step. Never `interview`, `hasUpload`,
     * `hasEditableContent` or `formId` (audio and server checks go by step id:
     * remove the step and add a new id), never `channels`.
     */
    change?: Record<string, Partial<Omit<ClientStep, "id">>>;
    /** New steps. No `channels`: a custom product has one client type. */
    add?: { stage: StageId; after?: string; step: ClientStep }[];
    remove?: string[];
  };
  /** No `channels` on changed or added tasks: a custom product has one client type. */
  teamTasks?: {
    change?: Record<string, Partial<Omit<TeamTask, "id">>>;
    add?: { after?: string; task: TeamTask }[];
    remove?: string[];
  };
  /** Blank: the list is required. Otherwise a list replaces the base's roles, or add/remove edits them. */
  roles?: string[] | { add?: string[]; remove?: string[] };
  portal?: {
    wordmark?: string;
    brandName?: string;
    tagline?: string;
    introVideo?: PortalOverrides["introVideo"];
    lockedLook?: PortalOverrides["lockedLook"];
    /** true = show the $200 "move fast" popup. Default: hidden. */
    incentive?: boolean;
    taskNotes?: Record<string, string>;
    taskDetails?: Record<string, string>;
    hiddenTaskVideos?: string[];
    hiddenTaskBooking?: string[];
    hiddenTaskImportant?: string[];
    hiddenTaskPlayground?: string[];
    hiddenGuideStages?: StageId[];
    stringPlan?: PortalOverrides["stringPlan"];
    /** "inherit" only with the base's timeline (its scripts quote its days). Absent = no voice guide. */
    voiceGuide?: "inherit" | VoiceGuide;
    /** "inherit" only with the base's timeline. Absent = no Ask-AI. */
    askAi?: "inherit" | AskAi;
    /** "inherit" = the base's, for the steps kept. Absent = none. */
    features?: "inherit" | ProductFeatures;
    /** A customer journey map on one of this product's steps. */
    journeyMap?: ProductPortal["journeyMap"];
  };
  /** Step ids whose client wording Claude drafted; must be empty when live. */
  draftCopy?: string[];
};

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const PREFIX = /^[a-z0-9]+-$/;
const VERSION = /^\d{4}-\d{2}-\d{2}\.\d+$/;

/** The variant-level portal settings a custom product may set (the rest of `portal` is product level or `incentive`). */
const OVERRIDE_KEYS = [
  "brandName",
  "tagline",
  "introVideo",
  "lockedLook",
  "taskNotes",
  "taskDetails",
  "hiddenTaskVideos",
  "hiddenTaskBooking",
  "hiddenTaskImportant",
  "hiddenTaskPlayground",
  "hiddenGuideStages",
  "stringPlan",
] as const;

/**
 * Step fields the server checks by step id against every product's steps
 * (lib/allJourneys.ts: the upload route, the admin forms list). An inherited
 * step must keep its base's value; products:check also checks every product.
 */
const SERVER_CHECKED = ["hasUpload", "hasEditableContent", "formId"] as const;

const orList = (items: string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`);

function describeTimeline(stages: ProductStage[], totalDays: number | null): string {
  const days = stages.map((s) => `${s.id} ${s.dayStart === s.dayEnd ? `day ${s.dayStart}` : `days ${s.dayStart}–${s.dayEnd}`}`);
  return `${totalDays ?? "no"} days to go-live; ${days.join(", ")}`;
}

type TweakKey = (typeof OVERRIDE_KEYS)[number];

/** The variant tweaks a portal sets (hidesIncentive not counted). */
function tweakKeys(portal: PortalOverrides): TweakKey[] {
  return OVERRIDE_KEYS.filter((key) => portal[key] !== undefined);
}

/** One base-variant tweak in a few words, for the derivation's `dropped`. */
function describeTweak(key: TweakKey, portal: PortalOverrides): string {
  const value = portal[key];
  if (typeof value === "string") return `${key} "${value}"`;
  if (Array.isArray(value)) return `${key} (${value.join(", ")})`;
  if (key === "introVideo") return `introVideo "${portal.introVideo?.title}"`;
  if (key === "stringPlan") return `stringPlan (${portal.stringPlan?.workstreams.length} strands)`;
  return `${key} on ${Object.keys(value ?? {}).join(", ")}`;
}

/**
 * A base-variant tweak cut to this product: step ids it no longer shows and
 * stages it no longer has are left out, and recorded in `dropped`. Returns
 * undefined when nothing is left.
 */
function keepTweak(key: TweakKey, portal: PortalOverrides, visible: Set<string>, portalStages: Set<string>, dropped: string[]): unknown {
  const gone = "(not a step this product shows)";
  const value = structuredClone(portal[key]);
  if (key === "taskNotes" || key === "taskDetails") {
    const kept: Record<string, string> = {};
    for (const [id, text] of Object.entries(value as Record<string, string>)) {
      if (visible.has(id)) kept[id] = text;
      else dropped.push(`${key} on ${id} ${gone}`);
    }
    return Object.keys(kept).length ? kept : undefined;
  }
  if (key === "hiddenTaskVideos" || key === "hiddenTaskBooking" || key === "hiddenTaskImportant" || key === "hiddenTaskPlayground") {
    const ids = value as string[];
    for (const id of ids.filter((x) => !visible.has(x))) dropped.push(`${key} ${id} ${gone}`);
    const kept = ids.filter((x) => visible.has(x));
    return kept.length ? kept : undefined;
  }
  if (key === "hiddenGuideStages") {
    const ids = value as StageId[];
    for (const id of ids.filter((x) => !portalStages.has(x))) dropped.push(`hiddenGuideStages ${id} (not a portal stage of this product)`);
    const kept = ids.filter((x) => portalStages.has(x));
    return kept.length ? kept : undefined;
  }
  if (key === "stringPlan") {
    const plan = value as StringPlan;
    const strands = plan.workstreams.map((w) => {
      for (const id of w.taskIds.filter((x) => !visible.has(x))) dropped.push(`stringPlan strand ${w.id}: ${id} ${gone}`);
      return { ...w, taskIds: w.taskIds.filter((x) => visible.has(x)) };
    });
    const emptied = strands.filter((w) => !w.taskIds.length).map((w) => w.id);
    for (const id of emptied) dropped.push(`stringPlan strand ${id} (none of its steps are left)`);
    const kept = strands
      .filter((w) => w.taskIds.length)
      .map(({ after, ...w }) => {
        const still = (after ?? []).filter((a) => !emptied.includes(a));
        return after === undefined ? w : still.length ? { ...w, after: still } : w;
      });
    return kept.length ? { ...plan, workstreams: kept } : undefined;
  }
  return value; // brandName, tagline, introVideo, lockedLook
}

/** A stage field as the derivation records it (null = not set). */
function stageValue(value: unknown): StageValue {
  if (value === undefined || value === null) return null;
  return Array.isArray(value) ? [...(value as string[])] : (value as StageValue);
}

/** Sets defined fields, deletes fields set to undefined. Returns the field names touched. */
function merge(target: Record<string, unknown>, patch: Record<string, unknown>): string[] {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete target[key];
    else target[key] = value;
  }
  return Object.keys(patch);
}

export function defineCustomProduct<const C extends string>(spec: CustomProductSpec<C>): Product<C> {
  const errors: string[] = [];
  const fail = (message: string) => { errors.push(message); };

  // 1. Formats.
  if (!KEBAB.test(spec.id)) fail(`id "${spec.id}" must be kebab-case, e.g. "bss-custom"`);
  if (!KEBAB.test(spec.clientType)) fail(`clientType "${spec.clientType}" must be kebab-case, e.g. "bss-custom"`);
  if (!PREFIX.test(spec.idPrefix)) fail(`idPrefix "${spec.idPrefix}" must be lowercase letters or digits ending in "-", e.g. "bssc-"`);
  if (!VERSION.test(spec.version)) fail(`version "${spec.version}" must be YYYY-MM-DD.N`);
  if (!spec.spec || !spec.spec.trim()) fail(`spec must name the Markdown spec, e.g. "products/${spec.id}/spec.md"`);
  if (!spec.name || !spec.name.trim()) fail("name is required");
  if (!spec.label || !spec.label.trim()) fail("label is required");

  // 2. Base: a deep copy (the base is never changed), cut to one variant's steps and tasks.
  let stages: ProductStage[] = [];
  let tasks: TeamTask[] = [];
  let roles: string[] = [];
  let basePortal: ProductPortal | undefined;
  let baseTotalDays: number | null = null;
  let baseStages: ProductStage[] = [];
  let baseName = "the blank base";
  let baseVariant: ProductVariant | null = null;
  let derivationBase: CustomDerivation["base"] = "blank";
  const base = spec.base;
  if (base !== "blank") {
    const bp = base.product;
    baseName = bp.name;
    derivationBase = { id: bp.id, name: bp.name, version: bp.version, ...(base.variant !== undefined ? { variant: base.variant } : {}) };
    if (bp.version !== base.version) fail(`${bp.name} moved from ${base.version} to ${bp.version}: review, then update base.version`);
    stages = structuredClone(bp.stages);
    tasks = structuredClone(bp.teamTasks);
    roles = structuredClone(bp.roles);
    basePortal = bp.portal ? structuredClone(bp.portal) : undefined;
    baseTotalDays = bp.totalDays;
    baseStages = bp.stages;
    const variantIds = bp.variants.map((v) => v.id);
    if (base.variant !== undefined) {
      const variant = bp.variants.find((v) => v.id === base.variant);
      if (!variant) {
        fail(`${bp.name} has no variant "${base.variant}": say which variant: ${orList(variantIds)}`);
      } else {
        baseVariant = variant;
        stages = stages.map((s) => ({ ...s, steps: s.steps.filter((st) => appliesToVariant(st, variant)) }));
        tasks = tasks.filter((t) => appliesToVariant(t, variant));
        for (const s of stages) for (const st of s.steps) delete st.channels;
        for (const t of tasks) delete t.channels;
      }
    } else if (allSteps(bp).some((st) => st.channels && st.channels.length)) {
      fail(`${bp.name} has channel-specific steps: say which variant: ${orList(variantIds)}`);
    } else {
      const tweaked = bp.variants.filter((v) => tweakKeys(v.portal).length);
      if (tweaked.length) fail(`${bp.name}'s ${orList(tweaked.map((v) => v.id))} variant has portal tweaks: say which variant (base.variant), then whether to keep its tweaks (variantPortal)`);
    }
  }
  const inheritedSteps = new Set(stages.flatMap((s) => s.steps.map((st) => st.id)));

  const findStep = (id: string) => {
    for (const s of stages) {
      const index = s.steps.findIndex((st) => st.id === id);
      if (index !== -1) return { stage: s, index, step: s.steps[index] };
    }
    return null;
  };
  const removedTasks: CustomDerivation["removedTasks"] = [];
  const changedSteps: CustomDerivation["changedSteps"] = [];
  const changedTasks: CustomDerivation["changedTasks"] = [];
  const addedSteps: string[] = [];
  const addedTasks: string[] = [];
  const removedSteps: string[] = [];
  const droppedDependencies: CustomDerivation["droppedDependencies"] = [];
  const droppedCompletions: CustomDerivation["droppedCompletions"] = [];
  const stageChanges: StageChange[] = [];

  // 3. Stage patches, each recorded field by field (old → new).
  const dropStages = new Set<string>();
  for (const [id, patch] of Object.entries(spec.stages ?? {}) as [string, StagePatch | null | undefined][]) {
    if (!(STAGE_ORDER as readonly string[]).includes(id)) { fail(`stages.${id}: not a stage (stages are ${STAGE_ORDER.join(", ")})`); continue; }
    if (patch === undefined) continue;
    const existing = stages.find((s) => s.id === id);
    if (patch === null) {
      if (!existing) fail(`stages.${id}: null drops a stage, but there is no ${id} stage`);
      else stageChanges.push({ id: id as StageId, change: "dropped", fields: [] });
      dropStages.add(id);
      continue;
    }
    if (existing) {
      const before = existing as unknown as Record<string, unknown>;
      const fields = Object.entries(patch)
        .map(([field, value]) => ({ field, from: stageValue(before[field]), to: stageValue(value) }))
        .filter((f) => JSON.stringify(f.from) !== JSON.stringify(f.to));
      merge(before, patch as Record<string, unknown>);
      if (fields.length) stageChanges.push({ id: id as StageId, change: "changed", fields });
      continue;
    }
    if (patch.name === undefined || patch.dayStart === undefined || patch.dayEnd === undefined) {
      fail(`stages.${id}: a stage ${baseName} doesn't have needs name, dayStart and dayEnd`);
      continue;
    }
    const stage: ProductStage = { id: id as StageId, name: patch.name, dayStart: patch.dayStart, dayEnd: patch.dayEnd, statusNotes: patch.statusNotes ?? [], steps: [] };
    if (patch.ongoing !== undefined) stage.ongoing = patch.ongoing;
    if (patch.blurb !== undefined) stage.blurb = patch.blurb;
    stageChanges.push({
      id: id as StageId,
      change: "added",
      fields: Object.entries(patch).filter(([, value]) => value !== undefined).map(([field, value]) => ({ field, from: null, to: stageValue(value) })),
    });
    stages.push(stage);
    stages.sort((a, b) => STAGE_ORDER.indexOf(a.id) - STAGE_ORDER.indexOf(b.id));
  }
  const totalDays = spec.totalDays ?? baseTotalDays;
  if (totalDays === null || totalDays === undefined) fail("totalDays is required (a blank product has no timeline to inherit)");

  // 4. steps.change
  for (const [id, fields] of Object.entries(spec.steps?.change ?? {})) {
    const found = findStep(id);
    if (!found) { fail(`steps.change: unknown step ${id}`); continue; }
    if ("interview" in fields && inheritedSteps.has(id)) {
      fail(`steps.change.${id}: can't change an inherited interview (audio is keyed by step id: remove it and add a new step)`);
      continue;
    }
    if ("channels" in fields) { fail(`steps.change.${id}: sets channels, but a custom product has one client type: channels don't apply`); continue; }
    // The server checks uploads, editable content and forms by step id against
    // the union of every product's steps (lib/allJourneys.ts, first id wins),
    // so an inherited id must keep its base's answer.
    const serverFields = SERVER_CHECKED.filter((key) => key in fields && fields[key] !== found.step[key]);
    if (serverFields.length && inheritedSteps.has(id)) {
      fail(`steps.change.${id}: can't change ${serverFields.join(", ")} on an inherited step (uploads, forms and editable content are checked against every product's steps: remove the step and add a new id)`);
      continue;
    }
    changedSteps.push({ id, fields: merge(found.step as unknown as Record<string, unknown>, fields as Record<string, unknown>) });
  }

  // 5. steps.add
  for (const { stage: stageId, after, step } of spec.steps?.add ?? []) {
    if (!step.id.startsWith(spec.idPrefix)) { fail(`steps.add: ${step.id} must start with the idPrefix "${spec.idPrefix}"`); continue; }
    if ("channels" in step) { fail(`steps.add: ${step.id} has channels, but a custom product has one client type: channels don't apply`); continue; }
    if (findStep(step.id)) { fail(`steps.add: ${step.id} already exists`); continue; }
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) { fail(`steps.add: ${step.id} goes in stage ${stageId}, which this product doesn't have`); continue; }
    const copy = structuredClone(step);
    if (after !== undefined) {
      const index = stage.steps.findIndex((st) => st.id === after);
      if (index === -1) { fail(`steps.add: ${step.id} goes after ${after}, which is not in stage ${stageId}`); continue; }
      stage.steps.splice(index + 1, 0, copy);
    } else {
      stage.steps.push(copy);
    }
    addedSteps.push(step.id);
  }

  // 6. teamTasks.change
  for (const [id, fields] of Object.entries(spec.teamTasks?.change ?? {})) {
    const task = tasks.find((t) => t.id === id);
    if (!task) { fail(`teamTasks.change: unknown task ${id}`); continue; }
    if ("channels" in fields) { fail(`teamTasks.change.${id}: sets channels, but a custom product has one client type: channels don't apply`); continue; }
    changedTasks.push({ id, fields: merge(task as unknown as Record<string, unknown>, fields as Record<string, unknown>) });
  }

  // 7. teamTasks.add
  for (const { after, task } of spec.teamTasks?.add ?? []) {
    if (!task.id.startsWith(spec.idPrefix)) { fail(`teamTasks.add: ${task.id} must start with the idPrefix "${spec.idPrefix}"`); continue; }
    if (tasks.some((t) => t.id === task.id)) { fail(`teamTasks.add: ${task.id} already exists`); continue; }
    if ("channels" in task) { fail(`teamTasks.add: ${task.id} has channels, but a custom product has one client type: channels don't apply`); continue; }
    const copy = structuredClone(task);
    let index: number;
    if (after !== undefined) {
      index = tasks.findIndex((t) => t.id === after);
      if (index === -1) { fail(`teamTasks.add: ${task.id} goes after ${after}, which doesn't exist`); continue; }
    } else {
      const sameStep = task.step ? tasks.map((t, i) => (t.step === task.step ? i : -1)).filter((i) => i !== -1) : [];
      const sameStage = tasks.map((t, i) => (t.stage === task.stage ? i : -1)).filter((i) => i !== -1);
      index = sameStep.length ? sameStep[sameStep.length - 1] : sameStage.length ? sameStage[sameStage.length - 1] : tasks.length - 1;
    }
    tasks.splice(index + 1, 0, copy);
    addedTasks.push(task.id);
  }

  // 8. steps.remove: the step, the tasks still behind it, and its place in completesWithSteps.
  for (const id of spec.steps?.remove ?? []) {
    const found = findStep(id);
    if (!found) { fail(`steps.remove: unknown step ${id}`); continue; }
    found.stage.steps.splice(found.index, 1);
    removedSteps.push(id);
    for (const t of tasks.filter((task) => task.step === id)) removedTasks.push({ id: t.id, reason: `behind removed step ${id}` });
    tasks = tasks.filter((t) => t.step !== id);
    for (const t of tasks) {
      if (!t.completesWithSteps?.includes(id)) continue;
      droppedCompletions.push({ task: t.id, step: id });
      t.completesWithSteps = t.completesWithSteps.filter((s) => s !== id);
      if (t.completesWithSteps.length === 0) delete t.completesWithSteps;
    }
  }

  // 9. teamTasks.remove
  for (const id of spec.teamTasks?.remove ?? []) {
    if (!tasks.some((t) => t.id === id)) { fail(`teamTasks.remove: unknown task ${id}`); continue; }
    tasks = tasks.filter((t) => t.id !== id);
    removedTasks.push({ id, reason: "removed by the spec" });
  }

  // 10. Prune dependencies on removed tasks.
  const taskIds = new Set(tasks.map((t) => t.id));
  for (const t of tasks) {
    for (const d of t.dependencies.filter((dep) => !taskIds.has(dep))) {
      if (removedTasks.some((r) => r.id === d)) droppedDependencies.push({ task: t.id, dependsOn: d });
    }
    t.dependencies = t.dependencies.filter((dep) => taskIds.has(dep) || !removedTasks.some((r) => r.id === dep));
  }

  // 11. Drop the null-patched stages; nothing may still sit in one.
  for (const id of dropStages) {
    const stage = stages.find((s) => s.id === id);
    if (stage && stage.steps.length) fail(`stages.${id} is dropped but still holds steps ${stage.steps.map((st) => st.id).join(", ")}`);
    const left = tasks.filter((t) => t.stage === id);
    if (left.length) fail(`stages.${id} is dropped but tasks ${left.map((t) => t.id).join(", ")} are still in it`);
  }
  stages = stages.filter((s) => !dropStages.has(s.id));

  // 12. Roles (recorded as added and removed).
  const rolesBefore = [...roles];
  if (spec.roles === undefined) {
    if (base === "blank") fail("roles is required for a blank product (a list of role names)");
  } else if (Array.isArray(spec.roles)) {
    roles = [...spec.roles];
  } else {
    if (base === "blank") fail("roles must be a list for a blank product");
    for (const r of spec.roles.remove ?? []) {
      if (!roles.includes(r)) fail(`roles.remove: ${baseName} has no role "${r}"`);
      roles = roles.filter((x) => x !== r);
    }
    for (const r of spec.roles.add ?? []) if (!roles.includes(r)) roles.push(r);
  }
  const roleChanges = { added: roles.filter((r) => !rolesBefore.includes(r)), removed: rolesBefore.filter((r) => !roles.includes(r)) };

  // 13. Portal settings.
  const p = spec.portal ?? {};
  const wordmark = p.wordmark ?? basePortal?.wordmark ?? p.brandName;
  if (!wordmark) fail("portal.wordmark (or portal.brandName) is required: the name the client sees");
  const timelineChanged = base === "blank" || describeTimeline(stages, totalDays ?? null) !== describeTimeline(baseStages, baseTotalDays);
  const portalStages = new Set<string>(stages.filter((s) => !s.teamOnly).map((s) => s.id));
  const inheritable = (key: "voiceGuide" | "askAi") => {
    if (base === "blank") { fail(`portal.${key} "inherit": a blank product has nothing to inherit`); return false; }
    if (!basePortal?.[key]) { fail(`portal.${key} "inherit": ${baseName} has no ${key}`); return false; }
    if (timelineChanged) {
      fail(`portal.${key} "inherit": ${baseName}'s scripts quote its days (${describeTimeline(baseStages, baseTotalDays)}), and this product's days differ (${describeTimeline(stages, totalDays ?? null)}). Write its own ${key}, or leave it out.`);
      return false;
    }
    return true;
  };
  let voiceGuide: VoiceGuide | undefined;
  if (p.voiceGuide === "inherit") voiceGuide = inheritable("voiceGuide") ? basePortal!.voiceGuide : undefined;
  else voiceGuide = p.voiceGuide ? structuredClone(p.voiceGuide) : undefined;
  if (voiceGuide) {
    voiceGuide = { ...voiceGuide, scripts: Object.fromEntries(Object.entries(voiceGuide.scripts).filter(([stage]) => portalStages.has(stage))) };
  }
  let askAi: AskAi | undefined;
  if (p.askAi === "inherit") askAi = inheritable("askAi") ? basePortal!.askAi : undefined;
  else askAi = p.askAi ? structuredClone(p.askAi) : undefined;
  if (askAi) askAi = Object.fromEntries(Object.entries(askAi).filter(([stage]) => portalStages.has(stage)));
  const stepIds = new Set(stages.flatMap((s) => s.steps.map((st) => st.id)));
  let features: ProductFeatures | undefined;
  if (p.features === "inherit") {
    const f = basePortal?.features;
    if (base === "blank" || !f) fail(`portal.features "inherit": ${baseName} has no features`);
    else {
      features = {};
      if (f.playgroundSteps) features.playgroundSteps = f.playgroundSteps.filter((id) => stepIds.has(id));
      if (f.receptionistScriptStep && stepIds.has(f.receptionistScriptStep)) features.receptionistScriptStep = f.receptionistScriptStep;
      if (f.landingPreviewSteps) features.landingPreviewSteps = f.landingPreviewSteps.filter((id) => stepIds.has(id));
      if (f.nonBlockingSteps) features.nonBlockingSteps = f.nonBlockingSteps.filter((id) => stepIds.has(id));
      if (f.assistant) features.assistant = true;
      if (f.comms) features.comms = true;
      if (f.appIcon) features.appIcon = f.appIcon;
    }
  } else {
    features = p.features ? structuredClone(p.features) : undefined;
  }
  const portal: ProductPortal = { wordmark: wordmark ?? "" };
  if (voiceGuide) portal.voiceGuide = voiceGuide;
  if (askAi) portal.askAi = askAi;
  if (features) portal.features = features;
  if (p.journeyMap) portal.journeyMap = structuredClone(p.journeyMap);

  // 14. The variant: one client type; the base variant's tweaks when the spec
  // says "inherit" (cut to the steps and stages kept), under this product's own
  // (a key it sets replaces the base variant's); the incentive hidden unless
  // asked for.
  const visibleIds = new Set(stages.flatMap((s) => s.steps).filter((st) => !st.hidden).map((st) => st.id));
  const baseTweaks = baseVariant ? tweakKeys(baseVariant.portal) : [];
  const own = OVERRIDE_KEYS.filter((key) => p[key] !== undefined);
  const variantPortal: CustomDerivation["variantPortal"] = { mode: null, base: [...baseTweaks], inherited: [], own: [...own], dropped: [] };
  const mode = spec.variantPortal;
  if (mode !== undefined && mode !== "inherit" && mode !== "none") fail(`variantPortal must be "inherit" or "none", not ${JSON.stringify(mode)}`);
  else if (mode !== undefined && !baseVariant) fail(`variantPortal: there is no base variant to take tweaks from (${base === "blank" ? "the base is blank" : "set base.variant"})`);
  else if (baseVariant && baseTweaks.length && mode === undefined) {
    fail(`variantPortal is required: ${baseName}'s ${baseVariant.id} variant has portal tweaks (${baseTweaks.join(", ")}). "inherit" keeps them for the steps and stages this product keeps, with portal on top; "none" leaves them out`);
  }
  const overrides: PortalOverrides = {};
  if (baseVariant && baseTweaks.length && (mode === "inherit" || mode === "none")) {
    variantPortal.mode = mode;
    for (const key of baseTweaks) {
      if (own.includes(key)) continue; // this product's own value replaces it
      if (mode === "none") { variantPortal.dropped.push(describeTweak(key, baseVariant.portal)); continue; }
      const kept = keepTweak(key, baseVariant.portal, visibleIds, portalStages, variantPortal.dropped);
      if (kept === undefined) continue;
      (overrides as Record<string, unknown>)[key] = kept;
      variantPortal.inherited.push(key);
    }
    // An inherited description replaces the step's own in the portal, so a changed detail would never show.
    for (const c of changedSteps) {
      if (c.fields.includes("detail") && overrides.taskDetails && Object.hasOwn(overrides.taskDetails, c.id)) {
        fail(`steps.change.${c.id} changes detail, but the inherited taskDetails for ${c.id} (${baseVariant.id}) replaces it in the portal: set portal.taskDetails instead`);
      }
    }
  }
  for (const key of own) (overrides as Record<string, unknown>)[key] = structuredClone(p[key]);
  if (p.incentive !== true) overrides.hidesIncentive = true;
  const variant: ProductVariant<C> = { id: spec.clientType, clientType: spec.clientType, label: spec.label, pickerOrder: 100, portal: overrides };
  if (spec.adminLabel !== undefined) variant.adminLabel = spec.adminLabel;

  // 16. Validate the result.
  const allStepList = stages.flatMap((s) => s.steps);
  const seenSteps = new Set<string>();
  for (const st of allStepList) {
    if (seenSteps.has(st.id)) fail(`step id ${st.id} is used twice`);
    seenSteps.add(st.id);
  }
  const seenTasks = new Set<string>();
  for (const t of tasks) {
    if (seenTasks.has(t.id)) fail(`task id ${t.id} is used twice`);
    seenTasks.add(t.id);
  }
  for (const s of stages) if (s.dayStart > s.dayEnd) fail(`stage ${s.id} ends (day ${s.dayEnd}) before it starts (day ${s.dayStart})`);
  for (const t of tasks) {
    if (!stages.some((s) => s.id === t.stage)) fail(`task ${t.id}: stage ${t.stage} is not a stage of this product`);
    if (t.step !== undefined && !seenSteps.has(t.step)) fail(`task ${t.id}: step ${t.step} doesn't exist`);
    for (const s of t.completesWithSteps ?? []) if (!seenSteps.has(s)) fail(`task ${t.id}: completesWithSteps names unknown step ${s}`);
    for (const d of t.dependencies) if (!seenTasks.has(d)) fail(`task ${t.id}: depends on unknown task ${d}`);
    if (!roles.includes(t.role)) fail(`task ${t.id}: role "${t.role}" is not one of the product's roles`);
  }
  for (const st of allStepList) {
    const hasTasks = tasks.some((t) => t.step === st.id || t.completesWithSteps?.includes(st.id));
    if (st.clientOnly && hasTasks) fail(`step ${st.id} is clientOnly but has team tasks`);
    else if (!st.hidden && !st.clientOnly && !hasTasks) fail(`step ${st.id} has no team task behind it: add one, or mark it clientOnly`);
  }
  const visibleSteps = new Set(allStepList.filter((st) => !st.hidden).map((st) => st.id));
  const mustBeVisible = (where: string, ids: Iterable<string>) => {
    for (const id of ids) if (!visibleSteps.has(id)) fail(`${where} names step ${id}, which ${seenSteps.has(id) ? "is hidden" : "doesn't exist"}`);
  };
  mustBeVisible("portal.hiddenTaskVideos", overrides.hiddenTaskVideos ?? []);
  mustBeVisible("portal.hiddenTaskBooking", overrides.hiddenTaskBooking ?? []);
  mustBeVisible("portal.hiddenTaskImportant", overrides.hiddenTaskImportant ?? []);
  mustBeVisible("portal.hiddenTaskPlayground", overrides.hiddenTaskPlayground ?? []);
  mustBeVisible("portal.taskNotes", Object.keys(overrides.taskNotes ?? {}));
  mustBeVisible("portal.taskDetails", Object.keys(overrides.taskDetails ?? {}));
  mustBeVisible("portal.stringPlan", (overrides.stringPlan?.workstreams ?? []).flatMap((w) => w.taskIds));
  if (features) {
    mustBeVisible("portal.features", [...(features.playgroundSteps ?? []), ...(features.landingPreviewSteps ?? []), ...(features.nonBlockingSteps ?? [])]);
    if (features.receptionistScriptStep) mustBeVisible("portal.features.receptionistScriptStep", [features.receptionistScriptStep]);
  }
  for (const stage of overrides.hiddenGuideStages ?? []) if (!portalStages.has(stage)) fail(`portal.hiddenGuideStages names ${stage}, which is not a portal stage`);
  if (p.journeyMap) mustBeVisible("portal.journeyMap", [p.journeyMap.step]);
  const draftCopy = [...(spec.draftCopy ?? [])];
  for (const id of draftCopy) if (!seenSteps.has(id)) fail(`draftCopy names unknown step ${id}`);
  if (spec.status === "live" && draftCopy.length) fail(`a live product can't have drafted wording: Jesse approves ${draftCopy.join(", ")} first, then empty draftCopy`);

  if (errors.length) throw new Error(`defineCustomProduct(${spec.id}):\n  - ${errors.join("\n  - ")}`);

  // 15. The product.
  const baseLabel = base === "blank" ? "" : `${base.product.name} ${base.product.version}${base.variant !== undefined ? ` (${base.variant})` : ""}`;
  return {
    id: spec.id,
    name: spec.name,
    version: spec.version,
    status: spec.status,
    totalDays: totalDays as number,
    roles,
    stages,
    teamTasks: tasks,
    variants: [variant],
    portal,
    source: {
      from: base === "blank" ? "Custom product (written from scratch)" : `Custom product based on ${baseLabel}`,
      commit: "-",
      files: [spec.spec],
      convertedOn: spec.version.slice(0, 10),
      report: spec.spec,
    },
    custom: {
      base: derivationBase,
      spec: spec.spec,
      idPrefix: spec.idPrefix,
      draftCopy,
      removedSteps,
      changedSteps,
      addedSteps,
      removedTasks,
      changedTasks,
      addedTasks,
      droppedDependencies,
      droppedCompletions: droppedCompletions.filter((d) => tasks.some((t) => t.id === d.task)),
      stageChanges: [...stageChanges].sort((a, b) => STAGE_ORDER.indexOf(a.id) - STAGE_ORDER.indexOf(b.id)),
      roleChanges,
      variantPortal,
      timelineChanged,
      inherited: { voiceGuide: p.voiceGuide === "inherit", askAi: p.askAi === "inherit", features: p.features === "inherit" },
    },
  };
}
