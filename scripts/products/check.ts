/**
 * Checks the product files (products/**). Six checks, all must pass:
 *
 *   1. Frozen journeys: every client type's portal, built from the product
 *      files, equals its frozen fixture (npm run check:journeys, which also
 *      cross-checks Fin's own check:fin baseline).
 *   2. Integrity: unique ids, every reference resolves, valid roles, every team
 *      task placed once, every visible client step has team tasks or is
 *      clientOnly, statuses and variants agree, portal settings and per-variant
 *      tweaks name real steps and stages, voice audio and media exist, forms
 *      exist, no RT Digital in client wording, every live or paused client type
 *      is frozen (scripts/fixtures/journeys/), and each custom product's spec
 *      file exists and a live one has no drafted wording. Across products: a
 *      step id in two products agrees on hasUpload, hasEditableContent and
 *      formId, and a custom product's added ids and idPrefix clash with no
 *      other product's ids (the server checks ids against every product).
 *   3. Custom-product proof: an in-memory custom product (Scale Meta, changed;
 *      never written to disk) resolves, registers, renders in the portal, seeds
 *      a board and gets a sheet and an index line, without touching Scale; a
 *      draft is offered and seeded only with PRODUCT_DRAFTS; mistakes throw
 *      and clashes fail, one proof case per rule.
 *   4. Code boundaries: no "use client" module reaches products/, the registry,
 *      the compat shims or server-only code; no app code imports a shim; the
 *      shims hold no journey data; products/ imports only types from lib/
 *      (scripts/products/static-checks.ts).
 *   5. Version lock: a product edited without a version bump fails.
 *   6. Sheets and index: docs/products/<id>.md and products/index.ts match a
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
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ClientPortalExperience } from "../../app/components/portal/ClientPortalExperience";
import { buildStages } from "../../lib/journeyBuild";
import { onboardingFormById } from "../../lib/onboardingForm";
import { createRegistry } from "../../lib/productRegistry";
import { defineCustomProduct, type CustomProductSpec } from "../../products/custom";
import { bss, productList, scale } from "../../products/index";
import { allSteps, appliesToVariant, dueDaysFor, productForClientType, stepVisibleFor, teamTasksFor } from "../../products/load";
import { STAGE_ORDER, type ClientStep, type Product } from "../../products/types";
import { runJourneyChecks, type CheckCounts } from "../journeys/run";
import { copyLintNotes, indexCurrent, renderProductIndex, renderSheet, scanProductIds, staleSheets } from "./render";
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
  // Custom products: the spec Jesse wrote is in the repo; a live one has no drafted wording.
  for (const p of productList as readonly Product[]) {
    if (!p.custom) continue;
    const P = `products/${p.id}`;
    must(existsSync(join(ROOT, p.custom.spec)), `${P}: its spec ${p.custom.spec} is missing (save Jesse's spec there)`);
    if (p.status === "live") must(p.custom.draftCopy.length === 0, `${P}: a live product can't have drafted wording (${p.custom.draftCopy.join(", ")})`);
    for (const n of copyLintNotes(p, productList)) notes.push(`${p.id}: ${n.replace(/`/g, "")}`);
  }
  for (const f of crossProductIdFailures(productList)) must(false, f);
  const bssProduct = productForClientType("bss");
  must(bssProduct?.id === "bss" && bssProduct.status === "paused", `"bss" must resolve to the paused bss product`);
  return `${productList.length} products, ${taskCount} team tasks, ${stepCount} client steps, ${clientTypes.size} variants; ${openWindows} tasks have open due windows ("As needed", "Ongoing"...)`;
}

/** Step fields the server checks by step id against every product's steps (lib/allJourneys.ts, first id wins). */
const SERVER_CHECKED = ["hasUpload", "hasEditableContent", "formId"] as const;

/** True when `product` is a custom product built, directly or through others, on `ancestor`. */
function builtOn(product: Product, ancestor: Product, products: readonly Product[]): boolean {
  const seen = new Set<string>();
  let current: Product | undefined = product;
  while (current?.custom && current.custom.base !== "blank" && !seen.has(current.id)) {
    seen.add(current.id);
    const baseId: string = current.custom.base.id;
    if (baseId === ancestor.id) return true;
    current = products.find((p) => p.id === baseId);
  }
  return false;
}

/**
 * Ids across products. The upload route, the admin forms list and the other
 * id checks use the union of every product's steps, first id wins
 * (lib/allJourneys.ts), so:
 *   - the same step id in two products must agree on hasUpload,
 *     hasEditableContent and formId;
 *   - a custom product's added step and task ids are its own: no other product
 *     has them (products built on it inherit them, which is fine);
 *   - no other product has a step or task id that starts with a custom
 *     product's idPrefix.
 * Returns the failures (empty = fine).
 */
export function crossProductIdFailures(products: readonly Product[]): string[] {
  const out: string[] = [];
  const stepsById = new Map<string, { product: string; step: ClientStep }[]>();
  for (const p of products) for (const step of allSteps(p)) stepsById.set(step.id, [...(stepsById.get(step.id) ?? []), { product: p.id, step }]);
  for (const [id, entries] of stepsById) {
    if (entries.length < 2) continue;
    for (const key of SERVER_CHECKED) {
      if (new Set(entries.map((e) => JSON.stringify(e.step[key] ?? null))).size < 2) continue;
      const values = entries.map((e) => `products/${e.product} ${e.step[key] === undefined ? "unset" : JSON.stringify(e.step[key])}`).join(", ");
      out.push(`step ${id} disagrees on ${key} across products (${values}): the server checks ${key} against every product's steps, first id wins (lib/allJourneys.ts). Remove the step and add a new id`);
    }
  }
  for (const p of products) {
    const custom = p.custom;
    if (!custom) continue;
    const others = products.filter((o) => o !== p && o.id !== p.id && !builtOn(o, p, products));
    for (const id of custom.addedSteps) {
      const owners = others.filter((o) => allSteps(o).some((s) => s.id === id)).map((o) => `products/${o.id}`);
      if (owners.length) out.push(`products/${p.id}: added step ${id} is also a step of ${owners.join(", ")}: give it a new id`);
    }
    for (const id of custom.addedTasks) {
      const owners = others.filter((o) => o.teamTasks.some((t) => t.id === id)).map((o) => `products/${o.id}`);
      if (owners.length) out.push(`products/${p.id}: added task ${id} is also a task of ${owners.join(", ")}: give it a new id`);
    }
    for (const o of others) {
      const ids = [...new Set([...allSteps(o).map((s) => s.id), ...o.teamTasks.map((t) => t.id)])].filter((id) => id.startsWith(custom.idPrefix));
      if (ids.length) out.push(`products/${p.id}: idPrefix "${custom.idPrefix}" starts ids of products/${o.id} (${ids.slice(0, 3).join(", ")}${ids.length > 3 ? ", …" : ""}): pick a prefix no other product uses`);
    }
  }
  return out;
}

// ── 3. Custom-product proof ───────────────────────────────────────────────
// A custom product built in memory (never written to disk, never in
// productList) goes through everything a real one would.

/** The message defineCustomProduct throws for this spec, or null when it resolves. */
function thrown(spec: CustomProductSpec<string>): string | null {
  try {
    defineCustomProduct(spec);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function customProof(): string {
  const before = contentHash(scale);
  const spec: CustomProductSpec<"zz-proof"> = {
    id: "zz-proof", name: "Proof only", version: "2026-10-17.1", status: "live",
    clientType: "zz-proof", label: "Proof — custom", spec: "scripts/products/check.ts",
    base: { product: scale, version: scale.version, variant: "meta" }, idPrefix: "zzp-", totalDays: 21,
    stages: {
      testing: { dayStart: 14, dayEnd: 14 }, "go-live": { dayStart: 21, dayEnd: 21 }, "post-launch": { dayStart: 22, dayEnd: 22 },
      onboarding: { statusNotes: ["Proof timeline."] },
    },
    steps: {
      remove: ["ob-4"], change: { "ob-2": { title: "Proof welcome call" } },
      add: [{ stage: "build", after: "bd-2", step: { id: "zzp-1", title: "Approve your offer", detail: "Proof step." } }],
    },
    teamTasks: {
      add: [{ task: { id: "zzp-t1", title: "Draft the offer", notes: "", stage: "build", category: "Offer",
        step: "zzp-1", role: "Scale CSM", priority: "normal", due: "Days 8-10", dependencies: [] } }],
    },
    portal: { brandName: "Proof Portal" },
  };
  const proof = defineCustomProduct(spec);
  const reg = createRegistry([...productList, proof]);
  const P = "custom proof";

  // Scale itself is untouched.
  must(contentHash(scale) === before, `${P}: defineCustomProduct changed Scale (its content hash moved)`);

  // Registered and offered like any live product.
  must(reg.isClientType("zz-proof"), `${P}: zz-proof is not a client type of the registry`);
  must(reg.acceptedClientTypes({ drafts: false }).includes("zz-proof"), `${P}: zz-proof is not accepted`);
  const option = reg.clientTypeOptions({ drafts: false }).find((o) => o.value === "zz-proof");
  must(option?.label === "Proof — custom", `${P}: zz-proof is not offered as "Proof — custom" (got ${JSON.stringify(option)})`);

  // The portal journey.
  const j = reg.portalJourneyFor("zz-proof");
  const ids = j.stages.flatMap((s) => s.milestones.map((m) => m.id));
  must(j.totalDays === 21, `${P}: totalDays is ${j.totalDays}, not 21`);
  must(j.brandName === "Proof Portal", `${P}: brandName is ${j.brandName}, not "Proof Portal"`);
  must(j.wordmark === "Scale", `${P}: wordmark is ${j.wordmark}, not "Scale"`);
  must(!ids.includes("ob-4"), `${P}: removed step ob-4 is still in the portal`);
  const build = j.stages.find((s) => s.id === "build")?.milestones.map((m) => m.id) ?? [];
  must(build.indexOf("zzp-1") !== -1 && build.indexOf("zzp-1") === build.indexOf("bd-2") + 1, `${P}: zzp-1 is not right after bd-2 (build: ${build.join(", ")})`);
  const ob2 = j.stages.flatMap((s) => s.milestones).find((m) => m.id === "ob-2");
  must(ob2?.title === "Proof welcome call", `${P}: ob-2 is not retitled (got "${ob2?.title}")`);
  const googleOnly = allSteps(scale).filter((st) => st.channels && st.channels.length && !st.channels.includes("meta")).map((st) => st.id);
  must(googleOnly.length > 0 && googleOnly.every((id) => !ids.includes(id)), `${P}: Google-only steps reached the portal (${googleOnly.filter((id) => ids.includes(id)).join(", ")})`);
  must(Object.keys(j.stageGuides).length === 0, `${P}: stageGuides is not empty`);
  must(Object.keys(j.askItems).length === 0, `${P}: askItems is not empty`);
  must(j.hidesIncentive === true, `${P}: the incentive popup is not hidden by default`);
  must(j.playgroundSteps.length === 0, `${P}: playgroundSteps is not empty`);
  must(j.landingPreviewSteps.length === 0, `${P}: landingPreviewSteps is not empty`);
  must(j.stringPlan === null, `${P}: stringPlan is not null`);
  must(buildStages(j.stages, new Set(), 1)[0]?.status === "current", `${P}: the first stage is not current on day 1`);

  // The portal renders it (server markup).
  const html = renderToStaticMarkup(createElement(ClientPortalExperience as unknown as ComponentType<Record<string, unknown>>, {
    name: "Probe", currentDay: 1, calendarDay: 1, initialCompletedMilestoneIds: [], themeVariant: "handoff", portalToken: "probe-token", journey: j,
  }));
  must(html.includes("Proof Portal"), `${P}: the portal markup doesn't show "Proof Portal"`);
  must(html.includes("Day 1 / 21"), `${P}: the portal markup doesn't show "Day 1 / 21"`);

  // The board.
  const seed = reg.boardSeedFor("zz-proof", { drafts: false });
  if (!seed.ok) must(false, `${P}: the board doesn't start (${seed.reason})`);
  else {
    const taskIds = seed.tasks.map((t) => t.id);
    must(taskIds.includes("zzp-t1"), `${P}: the board has no zzp-t1`);
    const behindOb4 = proof.custom?.removedTasks.filter((t) => t.reason === "behind removed step ob-4").map((t) => t.id) ?? [];
    const expectedBehind = scale.teamTasks.filter((t) => t.step === "ob-4").map((t) => t.id);
    must(expectedBehind.length > 0 && expectedBehind.every((id) => behindOb4.includes(id)), `${P}: removedTasks doesn't list the tasks behind ob-4 (${expectedBehind.join(", ")})`);
    must(behindOb4.every((id) => !taskIds.includes(id)), `${P}: the board still has tasks behind ob-4`);
    const googleTasks = scale.teamTasks.filter((t) => t.channels && t.channels.length && !t.channels.includes("meta")).map((t) => t.id);
    must(googleTasks.length > 0 && googleTasks.every((id) => !taskIds.includes(id)), `${P}: the board has Google-only tasks`);
  }

  // Counts, the step union, the sheet and the index.
  const visibleCount = allSteps(proof).filter((st) => stepVisibleFor(st, proof.variants[0])).length;
  must(reg.totalMilestoneCountFor("zz-proof") === visibleCount, `${P}: totalMilestoneCountFor is ${reg.totalMilestoneCountFor("zz-proof")}, not the ${visibleCount} visible steps`);
  must(reg.allPortalSteps().some((m) => m.id === "zzp-1"), `${P}: allPortalSteps has no zzp-1`);
  must(renderSheet(proof, productList).includes("Differences from Scale"), `${P}: the sheet has no "Differences from Scale" section`);
  const index = renderProductIndex([...scanProductIds(), "zz-proof"]);
  must(index.includes(`import { zzProof } from "./zz-proof";`) && index.includes("zzProof]"), `${P}: the generated index doesn't import and list zzProof`);

  // A draft: offered and seeded only with PRODUCT_DRAFTS.
  const draftReg = createRegistry([...productList, defineCustomProduct({ ...spec, status: "draft" })]);
  must(!draftReg.clientTypeOptions({ drafts: false }).some((o) => o.value === "zz-proof"), `${P}: a draft is offered without PRODUCT_DRAFTS`);
  must(draftReg.clientTypeOptions({ drafts: true }).some((o) => o.value === "zz-proof"), `${P}: a draft is not offered with PRODUCT_DRAFTS`);
  must(!draftReg.boardSeedFor("zz-proof", { drafts: false }).ok, `${P}: a draft's board starts without PRODUCT_DRAFTS`);
  must(draftReg.boardSeedFor("zz-proof", { drafts: true }).ok, `${P}: a draft's board doesn't start with PRODUCT_DRAFTS`);

  // Mistakes throw.
  const inherit = thrown({ ...spec, portal: { ...spec.portal, voiceGuide: "inherit" } });
  must(inherit !== null && /quote its days/.test(inherit) && inherit.includes("30 days to go-live") && inherit.includes("21 days to go-live"),
    `${P}: voiceGuide "inherit" with a new timeline must throw naming the days (got ${JSON.stringify(inherit)})`);
  const interview = thrown({ ...spec, steps: { ...spec.steps, change: { ...spec.steps?.change, "ob-0": { interview: ["A new question?"] } } } });
  must(interview !== null && interview.includes("ob-0") && /interview/.test(interview), `${P}: changing ob-0's interview must throw (got ${JSON.stringify(interview)})`);
  const unknown = thrown({ ...spec, steps: { ...spec.steps, remove: ["ob-4", "zz-nope"] } });
  must(unknown !== null && unknown.includes("zz-nope"), `${P}: an unknown id in steps.remove must throw (got ${JSON.stringify(unknown)})`);
  let mistakes = 3;

  // A. The server checks uploads, forms and editable content by step id against
  // every product's steps: an inherited step can't change them.
  const metaVariant = scale.variants.find((v) => v.id === "meta")!;
  const metaSteps = allSteps(scale).filter((st) => appliesToVariant(st, metaVariant));
  const serverCases: [string | undefined, Partial<ClientStep>][] = [
    [metaSteps.find((st) => st.hasUpload)?.id, { hasUpload: false }],
    [metaSteps.find((st) => st.formId)?.id, { formId: "respond-onboarding-intake-v1" }],
    [metaSteps.find((st) => st.hasEditableContent)?.id, { hasEditableContent: false }],
  ];
  for (const [id, change] of serverCases) {
    if (!id) { must(false, `${P}: Scale Meta has no step with ${Object.keys(change)[0]} to prove with`); continue; }
    const message = thrown({ ...spec, steps: { ...spec.steps, change: { ...spec.steps?.change, [id]: change } } });
    must(message !== null && message.includes(`steps.change.${id}`) && message.includes(Object.keys(change)[0]) && message.includes("checked against every product's steps: remove the step and add a new id"),
      `${P}: changing ${Object.keys(change)[0]} on inherited ${id} must throw (got ${JSON.stringify(message)})`);
    mistakes++;
  }
  // A, integrity: zz-proof's own ids clash with nothing; a "bss-" prefix with a reused BSS id does; so does a reused step id that disagrees on hasUpload.
  must(crossProductIdFailures([...productList, proof]).length === 0, `${P}: products:check finds id clashes in zz-proof: ${crossProductIdFailures([...productList, proof]).join("; ")}`);
  const bssStep = allSteps(bss)[0].id;
  const clash = defineCustomProduct({
    ...spec, id: "zz-clash", clientType: "zz-clash", idPrefix: "bss-",
    steps: { add: [{ stage: "build", step: { id: bssStep, title: "Clash", detail: "Proof step." } }] },
    teamTasks: { add: [{ task: { ...spec.teamTasks!.add![0].task, id: bss.teamTasks[0].id, step: bssStep } }] },
  });
  const clashes = crossProductIdFailures([...productList, clash]);
  must(clashes.some((f) => f.includes(`added step ${bssStep} is also a step of products/bss`)), `${P}: an added step id that products/bss has must fail products:check (got ${JSON.stringify(clashes)})`);
  must(clashes.some((f) => f.includes(`added task ${bss.teamTasks[0].id} is also a task of products/bss`)), `${P}: an added task id that products/bss has must fail products:check (got ${JSON.stringify(clashes)})`);
  must(clashes.some((f) => f.includes(`idPrefix "bss-" starts ids of products/bss`)), `${P}: idPrefix "bss-" must fail products:check (got ${JSON.stringify(clashes)})`);
  const uploadStep = metaSteps.find((st) => st.hasUpload)!;
  const handWritten: Product = {
    id: "zz-hand", name: "Proof only", version: "2026-10-17.1", status: "draft", totalDays: null, roles: ["Proof"],
    stages: [{ id: "onboarding", name: "Onboarding", dayStart: 1, dayEnd: 1, statusNotes: [], steps: [{ ...structuredClone(uploadStep), hasUpload: false }] }],
    teamTasks: [], variants: [], source: scale.source,
  };
  const disagree = crossProductIdFailures([...productList, handWritten]);
  must(disagree.some((f) => f.includes(`step ${uploadStep.id} disagrees on hasUpload`) && f.includes("products/zz-hand")), `${P}: a step id reused with another hasUpload must fail products:check (got ${JSON.stringify(disagree)})`);

  // F. Channels: a custom product has one client type.
  const addChannels = thrown({ ...spec, steps: { ...spec.steps, add: [{ stage: "build", after: "bd-2", step: { id: "zzp-1", title: "Approve your offer", detail: "Proof step.", channels: ["meta"] } }] } });
  must(addChannels !== null && addChannels.includes("steps.add: zzp-1 has channels") && addChannels.includes("channels don't apply"), `${P}: channels on an added step must throw (got ${JSON.stringify(addChannels)})`);
  const changeChannels = thrown({ ...spec, teamTasks: { ...spec.teamTasks, change: { [proof.teamTasks[0].id]: { channels: ["google"] } } } });
  must(changeChannels !== null && changeChannels.includes(`teamTasks.change.${proof.teamTasks[0].id}: sets channels`) && changeChannels.includes("channels don't apply"), `${P}: channels on a changed task must throw (got ${JSON.stringify(changeChannels)})`);
  mistakes += 2;

  return `zz-proof (Scale Meta, ${visibleCount} steps, ${proof.teamTasks.length} tasks, 21 days) registers, renders, seeds and gets a sheet; Scale unchanged; draft gated by PRODUCT_DRAFTS; ${mistakes} mistakes throw; id clashes across products fail`;
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

// ── 4. Code boundaries ───────────────────────────────────────────────────────
function boundaries(): string {
  const { failures: found, summary } = codeBoundaries();
  for (const f of found) must(false, f);
  return summary;
}

// ── 6. Sheets and index ──────────────────────────────────────────────────────
function sheetsCurrent(): string {
  const stale = staleSheets(productList);
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
      ["3 custom-product proof", customProof],
      ["4 code boundaries", boundaries],
      ["5 version lock", versionLock],
      ["6 sheets and index", sheetsCurrent],
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
