/**
 * Checks the product files (products/**). Five checks, all must pass:
 *
 *   1. Frozen journeys: every client type's portal, built from the product
 *      files, equals its frozen fixture (npm run check:journeys, which also
 *      cross-checks Fin's own check:fin baseline).
 *   2. Integrity: unique ids, every reference resolves, valid roles, every team
 *      task placed once, every visible client step has team tasks or is
 *      clientOnly, statuses and variants agree, portal settings and per-variant
 *      tweaks name real steps and stages, voice audio and media exist, forms
 *      exist, no RT Digital in client wording, every live or paused client type
 *      is frozen (scripts/fixtures/journeys/).
 *   3. Code boundaries: no "use client" module reaches products/, the registry,
 *      the compat shims or server-only code; no app code imports a shim; the
 *      shims hold no journey data; products/ imports only types from lib/
 *      (scripts/products/static-checks.ts).
 *   4. Version lock: a product edited without a version bump fails.
 *   5. Sheets and index: docs/products/<id>.md and products/index.ts match a
 *      fresh render.
 *
 *   npm run products:check
 *   npm run products:lock     record the current versions in products/versions.lock.json
 *                             (refuses a changed product whose version wasn't bumped)
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { onboardingFormById } from "../../lib/onboardingForm";
import { productList } from "../../products/index";
import { allSteps, dueDaysFor, productForClientType, teamTasksFor } from "../../products/load";
import { STAGE_ORDER, type ClientStep, type Product } from "../../products/types";
import { runJourneyChecks, type CheckCounts } from "../journeys/run";
import { indexCurrent, staleSheets } from "./render";
import { codeBoundaries } from "./static-checks";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const LOCK_PATH = join(ROOT, "products", "versions.lock.json");

const failures: string[] = [];
const notes: string[] = [];
function must(condition: unknown, message: string): void {
  if (!condition) failures.push(message);
}

// ── 1. Frozen journeys ────────────────────────────────────────────────────
function frozenJourneys(): string {
  const counts: CheckCounts = { renders: 0, markup: 0 };
  for (const f of runJourneyChecks(counts)) must(false, f);
  return `every client type matches scripts/fixtures/journeys/ (${counts.renders} renders, ${counts.markup} markup renders; bss-meta agrees with check:fin)`;
}

// ── 2. Integrity ──────────────────────────────────────────────────────────
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

    // Statuses: a live product has variants; a paused one never offers them.
    if (p.status === "live") must(p.variants.length > 0, `${P}: a live product needs at least one variant`);
    if (p.variants.length) {
      must(Boolean(p.portal?.wordmark), `${P}: a product with variants needs portal.wordmark (the name its clients see)`);
      must(p.totalDays !== null, `${P}: a product with variants needs totalDays`);
    }
    const portalStageIds = p.stages.filter((s) => !s.teamOnly).map((s) => s.id as string);

    // Product portal settings: voice guide, Ask-AI and features name real stages and steps.
    if (p.portal) {
      const guide = p.portal.voiceGuide;
      if (guide) {
        must(/^[a-z0-9-]+$/.test(guide.audioPrefix), `${P}: voiceGuide.audioPrefix "${guide.audioPrefix}" must be kebab-case`);
        for (const [stage, script] of Object.entries(guide.scripts)) {
          must(portalStageIds.includes(stage), `${P}: voice guide script for ${stage}, which is not a portal stage`);
          if (script) must(existsSync(join(ROOT, "public", "portal", "voice", `${guide.audioPrefix}-${stage}.m4a`)), `${P}: voice guide audio public/portal/voice/${guide.audioPrefix}-${stage}.m4a is missing`);
        }
      }
      for (const stage of Object.keys(p.portal.askAi ?? {})) must(portalStageIds.includes(stage), `${P}: Ask-AI items for ${stage}, which is not a portal stage`);
      const f = p.portal.features ?? {};
      const featureIds = [...(f.playgroundSteps ?? []), ...(f.landingPreviewSteps ?? []), ...(f.nonBlockingSteps ?? []), ...(f.receptionistScriptStep ? [f.receptionistScriptStep] : [])];
      for (const id of featureIds) must(stepStage.has(id), `${P}: portal.features names unknown step ${id}`);
    }

    // Client wording and assets.
    const RT = /rt[\s_-]?digital/i;
    const RT_URL = /rt-d\.com|rtdigital|rt_digital/i;
    const textOf = (step: ClientStep) => [step.title, step.detail, step.notePrompt, step.notePlaceholder, step.embedTitle, step.embedNote, step.guideLabel, step.important, step.inviteEmail, step.doneLabel, ...(step.steps ?? []), ...(step.interview ?? [])];
    const clientText: [string, string | undefined][] = [];
    for (const s of p.stages.filter((st) => !st.teamOnly)) {
      clientText.push([`stage ${s.id}`, s.name], [`stage ${s.id}`, s.blurb], ...s.statusNotes.map((n) => [`stage ${s.id}`, n] as [string, string]));
    }
    for (const step of steps) {
      for (const t of textOf(step)) clientText.push([step.id, t]);
      for (const url of [step.videoUrl, step.bookingUrl, step.embedUrl, step.guideUrl]) if (url && RT_URL.test(url)) notes.push(`${p.id}: ${step.id} links to an RT Digital address (${url})`);
      if (step.formId) must(Boolean(onboardingFormById(step.formId)), `${P}: ${step.id} uses form ${step.formId}, which lib/onboardingForm.ts does not define`);
      (step.interview ?? []).forEach((_, i) => {
        const file = `public/portal/voice/interview-${step.id}-${i + 1}.m4a`;
        if (!existsSync(join(ROOT, file))) notes.push(`${p.id}: ${file} is missing (the interview plays without audio): python3 scripts/generate-interview-voice.py`);
      });
    }
    if (p.portal) {
      clientText.push(["portal.wordmark", p.portal.wordmark]);
      for (const [stage, script] of Object.entries(p.portal.voiceGuide?.scripts ?? {})) clientText.push([`voice guide ${stage}`, script]);
      for (const [stage, items] of Object.entries(p.portal.askAi ?? {})) for (const item of items ?? []) clientText.push([`Ask-AI ${stage}`, item.q], [`Ask-AI ${stage}`, item.a]);
    }

    // Variants: each matches the portal's rules; every tweak names a real step or stage.
    for (const v of p.variants) {
      const V = `${P} variant ${v.id}`;
      must(v.id === v.clientType, `${V}: id should equal the client type`);
      must(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(v.clientType), `${V}: client type must be kebab-case`);
      must(!clientTypes.has(v.clientType), `${V}: client type ${v.clientType} is also in ${clientTypes.get(v.clientType)}`);
      clientTypes.set(v.clientType, p.id);
      if (p.status === "paused") must(v.offered !== true, `${V}: a paused product is never offered`);
      const o = v.portal;
      for (const key of ["hiddenTaskVideos", "hiddenTaskBooking", "hiddenTaskPlayground", "hiddenTaskImportant"] as const) {
        for (const id of o[key] ?? []) must(stepStage.has(id), `${V}: portal.${key} names unknown step ${id}`);
      }
      for (const key of ["taskNotes", "taskDetails"] as const) {
        for (const [id, text] of Object.entries(o[key] ?? {})) {
          must(stepStage.has(id), `${V}: portal.${key} names unknown step ${id}`);
          clientText.push([`${v.id} ${key} ${id}`, text]);
        }
      }
      for (const stage of o.hiddenGuideStages ?? []) must(portalStageIds.includes(stage), `${V}: portal.hiddenGuideStages names ${stage}, which is not a portal stage`);
      if (o.stringPlan) {
        const strands = o.stringPlan.workstreams.map((w) => w.id);
        must(new Set(strands).size === strands.length, `${V}: portal.stringPlan has duplicate strand ids`);
        for (const w of o.stringPlan.workstreams) {
          for (const id of w.taskIds) must(stepStage.has(id), `${V}: portal.stringPlan strand ${w.id} names unknown step ${id}`);
          for (const a of w.after ?? []) must(strands.includes(a), `${V}: portal.stringPlan strand ${w.id} comes after unknown strand ${a}`);
        }
      }
      if (o.introVideo) {
        const { src, poster } = o.introVideo;
        if (src.startsWith("/api/media/")) must(/\.(mp4|webm|m4a|mp3)$/i.test(src), `${V}: intro video ${src} must be .mp4, .webm, .m4a or .mp3`);
        if (poster.startsWith("/portal/")) must(existsSync(join(ROOT, "public", poster)), `${V}: intro video poster public${poster} is missing`);
        clientText.push([`${v.id} introVideo`, o.introVideo.title]);
      }
      clientText.push([`${v.id} brandName`, o.brandName], [`${v.id} tagline`, o.tagline]);
      if (p.status === "live" || p.status === "paused") {
        must(existsSync(join(ROOT, "scripts", "fixtures", "journeys", `${v.clientType}.json`)), `${V}: no frozen journey (scripts/fixtures/journeys/${v.clientType}.json): freeze it with npm run check:journeys -- --write ${v.clientType}`);
      }
      // A client of this variant gets every task's prerequisites too.
      const own = new Set(teamTasksFor(p, v).map((t) => t.id));
      for (const t of teamTasksFor(p, v)) for (const d of t.dependencies) must(own.has(d), `${V}: ${t.id} depends on ${d}, which this variant doesn't get`);
    }
    for (const [where, text] of clientText) if (text && RT.test(text)) must(false, `${P}: "RT Digital" in client wording (${where}): the client-facing brand is allconvos.ai`);
  }
  const bssProduct = productForClientType("bss");
  must(bssProduct?.id === "bss" && bssProduct.status === "paused", `"bss" must resolve to the paused bss product`);
  return `${productList.length} products, ${taskCount} team tasks, ${stepCount} client steps, ${clientTypes.size} variants; ${openWindows} tasks have open due windows ("As needed", "Ongoing"...)`;
}

// ── 4. Version lock ───────────────────────────────────────────────────────
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

// ── 3. Code boundaries ───────────────────────────────────────────────────────
function boundaries(): string {
  const { failures: found, summary } = codeBoundaries();
  for (const f of found) must(false, f);
  return summary;
}

// ── 5. Sheets and index ──────────────────────────────────────────────────────
function sheetsCurrent(): string {
  const stale = staleSheets();
  if (!indexCurrent()) stale.unshift("products/index.ts");
  must(stale.length === 0, `out of date: ${stale.join(", ")}: run npm run products:render`);
  return `products/index.ts and ${productList.length} sheets in docs/products/ match a fresh render`;
}

// ── Main ──────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  if (process.argv.includes("--write-lock")) {
    writeLock();
  } else {
    const checks: [string, () => string][] = [
      ["1 frozen journeys", frozenJourneys],
      ["2 integrity", integrity],
      ["3 code boundaries", boundaries],
      ["4 version lock", versionLock],
      ["5 sheets and index", sheetsCurrent],
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
