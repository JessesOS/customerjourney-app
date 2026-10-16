/**
 * Checks the product files (products/**). Six checks, all must pass:
 *
 *   1. Golden template: for meta, google, meta-google, bss-meta and respond,
 *      portalTemplate() deep-equals today's code template (journeyTemplate /
 *      respondJourneyTemplate). Proves the client steps are verbatim.
 *   2. Golden render: buildStagesFromTemplate gives identical stages from the
 *      product file and from today's template, across the same completion sets
 *      and days as check:fin (none, all, defaults, first-N; days 1, 12, 30).
 *   3. Golden overrides: every product* map entry and label in lib/journeyEngine.ts
 *      equals the variant's portal overrides, both ways; totalDays matches.
 *   4. Integrity: unique ids, every reference resolves, valid roles, every team
 *      task placed once, every visible client step has team tasks or is
 *      clientOnly, variant channels agree with the portal's visibility rule.
 *   5. Version lock: a product edited without a version bump fails.
 *   6. Sheets current: docs/products/<id>.md match a fresh render.
 *
 *   npm run products:check
 *   npm run products:lock     record the current versions in products/versions.lock.json
 *                             (refuses a changed product whose version wasn't bumped)
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import * as engine from "../../lib/journeyEngine";
import { buildStagesFromTemplate, milestoneVisibleFor, type ClientType, type JourneyStage, type StageTemplate } from "../../lib/journeyEngine";
import { buildJourneyStages, defaultCompletedMilestoneIds, journeyTemplate, journeyTotalDays } from "../../lib/onboardingJourney";
import {
  buildRespondJourneyStages,
  respondDefaultCompletedMilestoneIds,
  respondJourneyTemplate,
  respondJourneyTotalDays,
} from "../../lib/respondJourney";
import { productList } from "../../products/index";
import {
  allSteps,
  dueDaysFor,
  PORTAL_OVERRIDE_MAPS,
  portalTemplate,
  productForClientType,
  stepVisibleFor,
  teamTasksFor,
  variantFor,
} from "../../products/load";
import { STAGE_ORDER, type PortalOverrides, type Product } from "../../products/types";
import { staleSheets } from "./render";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const LOCK_PATH = join(ROOT, "products", "versions.lock.json");
const DAYS = [1, 12, 30];

type Legacy = {
  template: StageTemplate[];
  totalDays: number;
  defaults: string[];
  build: (completed: Set<string>, day: number) => JourneyStage[];
};

/** Today's code, which the portal still reads. The product files must match it. */
const LEGACY: Partial<Record<ClientType, Legacy>> = {
  meta: { template: journeyTemplate, totalDays: journeyTotalDays, defaults: defaultCompletedMilestoneIds, build: (c, d) => buildJourneyStages(c, d, "meta") },
  google: { template: journeyTemplate, totalDays: journeyTotalDays, defaults: defaultCompletedMilestoneIds, build: (c, d) => buildJourneyStages(c, d, "google") },
  "meta-google": { template: journeyTemplate, totalDays: journeyTotalDays, defaults: defaultCompletedMilestoneIds, build: (c, d) => buildJourneyStages(c, d, "meta-google") },
  "bss-meta": { template: journeyTemplate, totalDays: journeyTotalDays, defaults: defaultCompletedMilestoneIds, build: (c, d) => buildJourneyStages(c, d, "bss-meta") },
  respond: { template: respondJourneyTemplate, totalDays: respondJourneyTotalDays, defaults: respondDefaultCompletedMilestoneIds, build: (c, d) => buildRespondJourneyStages(c, d) },
};
const CLIENT_TYPES = Object.keys(LEGACY) as ClientType[];

const failures: string[] = [];
const notes: string[] = [];
function must(condition: unknown, message: string): void {
  if (!condition) failures.push(message);
}

/** The first path where two values differ, for a readable failure. */
function firstDiff(a: unknown, b: unknown, path = ""): string | null {
  if (isDeepStrictEqual(a, b)) return null;
  if (a && b && typeof a === "object" && typeof b === "object") {
    const keys = [...new Set([...Object.keys(a as object), ...Object.keys(b as object)])];
    for (const k of keys) {
      const d = firstDiff((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}${Array.isArray(a) ? `[${k}]` : `.${k}`}`);
      if (d) return d;
    }
  }
  return `${path || "(root)"}: product ${JSON.stringify(a)?.slice(0, 120)} vs code ${JSON.stringify(b)?.slice(0, 120)}`;
}

function requireProduct(ct: ClientType): Product {
  const product = productForClientType(ct);
  if (!product) throw new Error(`no product for client type ${ct}`);
  return product;
}

// ── 1. Golden template ────────────────────────────────────────────────────
function goldenTemplate(): string {
  for (const ct of CLIENT_TYPES) {
    const product = requireProduct(ct);
    const diff = firstDiff(portalTemplate(product), LEGACY[ct]!.template);
    must(!diff, `${ct}: portalTemplate differs from the code template at ${diff}`);
  }
  const shape = (ct: ClientType) => {
    const t = portalTemplate(requireProduct(ct));
    return `${t.length} stages / ${t.reduce((n, s) => n + s.milestones.length, 0)} steps`;
  };
  return `${CLIENT_TYPES.join(", ")} (Scale ${shape("meta")}, Respond ${shape("respond")})`;
}

// ── 2. Golden render ──────────────────────────────────────────────────────
function goldenRender(): string {
  let renders = 0;
  for (const ct of CLIENT_TYPES) {
    const legacy = LEGACY[ct]!;
    const product = requireProduct(ct);
    const template = portalTemplate(product);
    const visibleIds = legacy.template.flatMap((s) => s.milestones.filter((m) => milestoneVisibleFor(m, ct)).map((m) => m.id));
    const sets: Record<string, string[]> = { none: [], all: visibleIds, defaults: legacy.defaults };
    visibleIds.forEach((_, i) => { sets[`first-${i + 1}`] = visibleIds.slice(0, i + 1); });
    for (const [name, ids] of Object.entries(sets)) {
      for (const day of DAYS) {
        const fromProduct = buildStagesFromTemplate(template, new Set(ids), day, ct);
        const fromCode = legacy.build(new Set(ids), day);
        const diff = firstDiff(fromProduct, fromCode);
        must(!diff, `${ct} ${name}@day${day}: render differs at ${diff}`);
        renders++;
      }
    }
  }
  return `${renders} renders equal across ${CLIENT_TYPES.length} client types (completion sets none/all/defaults/first-N × days ${DAYS.join(", ")})`;
}

// ── 3. Golden overrides ───────────────────────────────────────────────────
function goldenOverrides(): string {
  const engineMaps = Object.entries(engine).filter(
    ([name, value]) => (name.startsWith("product") || name === "clientTypeLabels") && value !== null && typeof value === "object",
  ) as [string, Partial<Record<ClientType, unknown>>][];
  const keyForMap = new Map(Object.entries(PORTAL_OVERRIDE_MAPS).map(([key, map]) => [map, key as keyof PortalOverrides]));
  for (const map of keyForMap.keys()) must(engineMaps.some(([name]) => name === map), `PORTAL_OVERRIDE_MAPS names ${map}, which lib/journeyEngine.ts no longer exports`);
  let compared = 0;
  for (const ct of CLIENT_TYPES) {
    const product = requireProduct(ct);
    const variant = variantFor(product, ct);
    for (const [name, map] of engineMaps) {
      const expected = map[ct];
      if (name === "clientTypeLabels") {
        must(variant.label === expected, `${ct}: label "${variant.label}" ≠ clientTypeLabels "${String(expected)}"`);
      } else {
        const key = keyForMap.get(name);
        if (!key) {
          must(false, `lib/journeyEngine.ts has a new map ${name}: add it to PortalOverrides and PORTAL_OVERRIDE_MAPS`);
          continue;
        }
        const diff = firstDiff(variant.portal[key], expected);
        must(!diff, `${ct}: portal.${key} ≠ ${name}: ${diff}`);
      }
      compared++;
    }
    must(product.totalDays === LEGACY[ct]!.totalDays, `${ct}: totalDays ${product.totalDays} ≠ code ${LEGACY[ct]!.totalDays}`);
  }
  return `${compared} map entries equal (${engineMaps.length} maps incl. clientTypeLabels × ${CLIENT_TYPES.length} client types); totalDays Scale ${journeyTotalDays}, Respond ${respondJourneyTotalDays}`;
}

// ── 4. Integrity ──────────────────────────────────────────────────────────
function integrity(): string {
  const VERSION = /^\d{4}-\d{2}-\d{2}\.\d+$/;
  const PRIORITIES = ["low", "normal", "high", "critical"];
  const productIds = new Set<string>();
  const clientTypes = new Map<string, string>();
  let taskCount = 0;
  let stepCount = 0;
  let openWindows = 0;

  for (const p of productList) {
    const P = `products/${p.id}`;
    must(!productIds.has(p.id), `${P}: duplicate product id`);
    productIds.add(p.id);
    must(VERSION.test(p.version), `${P}: version "${p.version}" is not YYYY-MM-DD.N`);
    must(["live", "paused", "draft"].includes(p.status), `${P}: bad status ${p.status}`);
    must(p.roles.length > 0 && new Set(p.roles).size === p.roles.length, `${P}: roles must be non-empty and unique`);
    must(!p.roles.includes("Unassigned"), `${P}: "Unassigned" is not a role`);

    // Stages: known ids, unique, in journey order; team-only stages hold no steps.
    const stageIds = p.stages.map((s) => s.id);
    must(new Set(stageIds).size === stageIds.length, `${P}: duplicate stage id`);
    for (const s of p.stages) {
      must((STAGE_ORDER as readonly string[]).includes(s.id), `${P}: unknown stage ${s.id}`);
      must(s.dayStart <= s.dayEnd, `${P}: stage ${s.id} ends before it starts`);
      if (s.teamOnly) must(s.steps.length === 0, `${P}: team-only stage ${s.id} has client steps`);
    }
    const order = stageIds.map((id) => STAGE_ORDER.indexOf(id));
    must(order.every((v, i) => i === 0 || v > order[i - 1]), `${P}: stages out of journey order`);

    // Client steps.
    const steps = allSteps(p);
    stepCount += steps.length;
    const stepStage = new Map<string, string>();
    for (const s of p.stages) for (const step of s.steps) {
      must(!stepStage.has(step.id), `${P}: duplicate client step ${step.id}`);
      stepStage.set(step.id, s.id);
    }

    // Team tasks.
    const taskIds = new Set<string>();
    for (const t of p.teamTasks) {
      const T = `${P} ${t.id}`;
      taskCount++;
      must(!taskIds.has(t.id), `${T}: duplicate team task id`);
      taskIds.add(t.id);
      must(t.title.trim() !== "", `${T}: empty title`);
      must(stageIds.includes(t.stage), `${T}: stage ${t.stage} is not a stage of this product`);
      if (t.step !== undefined) must(stepStage.has(t.step), `${T}: step ${t.step} does not exist`);
      for (const s of t.completesWithSteps ?? []) must(stepStage.has(s), `${T}: completesWithSteps names unknown step ${s}`);
      if (t.completesWithSteps) must(t.step !== undefined, `${T}: completesWithSteps needs a step`);
      // Respond's steps reuse CSM template ids: a task named like a step sits behind it.
      if (stepStage.has(t.id)) must(t.step === t.id, `${T}: shares its id with a client step but is not placed behind it`);
      must(p.roles.includes(t.role), `${T}: role "${t.role}" is not one of the product's roles`);
      must(PRIORITIES.includes(t.priority), `${T}: bad priority ${t.priority}`);
      must(t.due.trim() !== "", `${T}: empty due window`);
      if (t.dueDays) must(t.dueDays.start <= t.dueDays.end, `${T}: dueDays ends before it starts`);
      if (!dueDaysFor(t)) openWindows++;
      for (const c of t.channels ?? []) must(c === "meta" || c === "google", `${T}: unknown channel ${c}`);
      must(!t.dependencies.includes(t.id), `${T}: depends on itself`);
      must(new Set(t.dependencies).size === t.dependencies.length, `${T}: duplicate dependency`);
      if (t.step && stepStage.get(t.step) !== t.stage) notes.push(`${p.id}: ${t.id} (${t.stage}) sits behind ${t.step} (${stepStage.get(t.step)}), flagged in the conversion report`);
    }
    for (const t of p.teamTasks) for (const d of t.dependencies) must(taskIds.has(d), `${P} ${t.id}: depends on unknown task ${d}`);

    // No dependency cycles.
    const byId = new Map(p.teamTasks.map((t) => [t.id, t]));
    const state = new Map<string, 1 | 2>();
    const visit = (id: string, trail: string[]): void => {
      if (state.get(id) === 2) return;
      if (state.get(id) === 1) { must(false, `${P}: dependency cycle ${[...trail, id].join(" → ")}`); return; }
      state.set(id, 1);
      for (const d of byId.get(id)?.dependencies ?? []) if (byId.has(d)) visit(d, [...trail, id]);
      state.set(id, 2);
    };
    for (const t of p.teamTasks) visit(t.id, []);

    // Every visible client step has team work behind it, or is client-only (never both).
    for (const step of steps) {
      const hasTasks = p.teamTasks.some((t) => t.step === step.id || t.completesWithSteps?.includes(step.id));
      if (step.clientOnly) must(!hasTasks, `${P}: ${step.id} is clientOnly but has team tasks`);
      else if (!step.hidden) must(hasTasks, `${P}: visible step ${step.id} has no team task and is not clientOnly`);
    }

    // Variants: only live products have them; each matches the portal's rules.
    if (p.status !== "live") must(p.variants.length === 0, `${P}: a ${p.status} product must have no variants (no client type may start on it)`);
    else must(p.variants.length > 0, `${P}: a live product needs at least one variant`);
    for (const v of p.variants) {
      const V = `${P} variant ${v.id}`;
      must(v.id === v.clientType, `${V}: id should equal the client type`);
      must(!clientTypes.has(v.clientType), `${V}: client type ${v.clientType} is also in ${clientTypes.get(v.clientType)}`);
      clientTypes.set(v.clientType, p.id);
      for (const step of steps) {
        must(stepVisibleFor(step, v) === milestoneVisibleFor(step, v.clientType), `${V}: channels disagree with the portal on ${step.id}`);
      }
      for (const map of Object.values(v.portal)) {
        const ids = Array.isArray(map) ? map : map && typeof map === "object" && !("src" in map) ? Object.keys(map) : [];
        for (const id of ids) must(stepStage.has(id), `${V}: portal override names unknown step ${id}`);
      }
      // A client of this variant gets every task's prerequisites too.
      const own = new Set(teamTasksFor(p, v).map((t) => t.id));
      for (const t of teamTasksFor(p, v)) for (const d of t.dependencies) must(own.has(d), `${V}: ${t.id} depends on ${d}, which this variant doesn't get`);
    }
  }
  must(productForClientType("bss") === null, `productForClientType("bss") must be null (BSS is paused)`);
  return `${productList.length} products, ${taskCount} team tasks, ${stepCount} client steps, ${clientTypes.size} variants; ${openWindows} tasks have open due windows ("As needed", "Ongoing"...)`;
}

// ── 5. Version lock ───────────────────────────────────────────────────────
type Lock = Record<string, { version: string; sha256: string }>;

function canonical(value: unknown): unknown {
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

/** Hash of everything in a product except its version. */
export function contentHash(product: Product): string {
  const { version: _version, ...content } = product;
  return createHash("sha256").update(JSON.stringify(canonical(content))).digest("hex");
}

function readLock(): Lock {
  try {
    return JSON.parse(readFileSync(LOCK_PATH, "utf8")) as Lock;
  } catch {
    return {};
  }
}

function versionLock(): string {
  const lock = readLock();
  for (const p of productList) {
    const entry = lock[p.id];
    const hash = contentHash(p);
    if (!entry) { must(false, `products/${p.id} is not in products/versions.lock.json: run npm run products:lock`); continue; }
    if (entry.sha256 !== hash && entry.version === p.version) {
      must(false, `products/${p.id} changed without a version bump (still ${p.version}): bump version, then npm run products:lock`);
    } else {
      must(entry.version === p.version && entry.sha256 === hash, `products/versions.lock.json is out of date for ${p.id}: run npm run products:lock`);
    }
  }
  for (const id of Object.keys(lock)) must(productList.some((p) => p.id === id), `products/versions.lock.json lists unknown product ${id}`);
  return productList.map((p) => `${p.id} ${p.version}`).join(", ");
}

function versionAfter(a: string, b: string): boolean {
  const [da, na] = a.split(".");
  const [db, nb] = b.split(".");
  return da > db || (da === db && Number(na) > Number(nb));
}

function writeLock() {
  const lock = readLock();
  const next: Lock = {};
  for (const p of productList) {
    const entry = lock[p.id];
    const hash = contentHash(p);
    if (entry && entry.sha256 !== hash && !versionAfter(p.version, entry.version)) {
      console.error(`FAIL products/${p.id} changed but its version (${p.version}) is not after ${entry.version}. Bump it first.`);
      process.exit(1);
    }
    next[p.id] = { version: p.version, sha256: hash };
  }
  writeFileSync(LOCK_PATH, JSON.stringify(next, null, 2) + "\n");
  console.log(`Wrote products/versions.lock.json: ${productList.map((p) => `${p.id} ${p.version}`).join(", ")}`);
}

// ── 6. Sheets current ─────────────────────────────────────────────────────
function sheetsCurrent(): string {
  const stale = staleSheets();
  must(stale.length === 0, `sheets out of date: ${stale.join(", ")}: run npm run products:render`);
  return `${productList.length} sheets in docs/products/ match a fresh render`;
}

// ── Main ──────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  if (process.argv.includes("--write-lock")) {
    writeLock();
  } else {
    const checks: [string, () => string][] = [
      ["1 golden template", goldenTemplate],
      ["2 golden render", goldenRender],
      ["3 golden overrides", goldenOverrides],
      ["4 integrity", integrity],
      ["5 version lock", versionLock],
      ["6 sheets current", sheetsCurrent],
    ];
    let failed = 0;
    for (const [name, run] of checks) {
      const before = failures.length;
      let summary = "";
      try {
        summary = run();
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
      const mine = failures.slice(before);
      if (mine.length) {
        failed++;
        console.error(`FAIL ${name}`);
        for (const f of mine.slice(0, 20)) console.error(`  - ${f}`);
        if (mine.length > 20) console.error(`  … and ${mine.length - 20} more`);
      } else {
        console.log(`PASS ${name}: ${summary}`);
      }
    }
    for (const n of notes) console.log(`  note: ${n}`);
    if (failed) {
      console.error(`FAIL products:check (${failed} of ${checks.length} checks failed)`);
      process.exit(1);
    }
    console.log(`PASS products:check (${checks.length}/${checks.length})`);
  }
}
