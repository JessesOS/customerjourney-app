// The product registry: the one place the app asks "what does this client type
// get?" — its portal journey, days, labels, board tasks. Everything is read
// from the product files (products/), so a new product is one folder.
//
// SERVER AND SCRIPTS ONLY. It imports every product file, team tasks included
// (internal notes, staff names). Client components never import it, the shims
// or products/: they get plain data (PortalJourney, ChecklistStage) as props
// or from an API. npm run products:check ("code boundaries") enforces this.
//
// Import direction (no cycles): lib/journeyTypes.ts (types only) →
// lib/journeyBuild.ts (pure) → products/** (types only from lib) → this file
// → shims, server modules and routes. Relative imports, so scripts load it too.

import { buildStages } from "./journeyBuild";
import type { AskItem, ChecklistStage, ClientTypeOption, MilestoneTemplate, PortalJourney, StageGuide } from "./journeyTypes";
import { productList, type ClientType } from "../products/index";
import { allSteps, appliesToVariant, portalTemplate, stepVisibleFor, teamTasksFor } from "../products/helpers";
import type { Product, ProductVariant, StageId, TeamTask } from "../products/types";

export type { ClientType };

/** A client with no stored type gets this one (the column default in db/schema.ts is the same). Unknown stored types render on its product. */
export const DEFAULT_CLIENT_TYPE: ClientType = "meta-google";

/** Whether draft products count: true only where PRODUCT_DRAFTS=1 (staging). */
export type DraftOption = { drafts: boolean };

export type ResolvedVariant = { product: Product; variant: ProductVariant };

export type BoardSeed =
  | { ok: true; product: Product; variant: ProductVariant; tasks: TeamTask[] }
  | { ok: false; reason: string };

/** Media types for intro videos served from R2 (app/api/media/[name]/route.ts). */
const MEDIA_TYPES: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", m4a: "audio/mp4", mp3: "audio/mpeg" };

const STATUS_SUFFIX: Record<Product["status"], string> = { live: "", paused: " (paused)", draft: " (draft)" };

function own<T>(record: Partial<Record<string, T>> | undefined, key: string): T | undefined {
  return record && Object.hasOwn(record, key) ? record[key] : undefined;
}

/** A registry over these products. The app uses `registry` (every product file); checks build their own. */
export function createRegistry(products: readonly Product[]) {
  const variants: ResolvedVariant[] = products.flatMap((product) => product.variants.map((variant) => ({ product, variant })));
  const byType = new Map<string, ResolvedVariant>();
  for (const entry of variants) {
    const seen = byType.get(entry.variant.clientType);
    if (seen) throw new Error(`Client type "${entry.variant.clientType}" is defined twice (products/${seen.product.id} and products/${entry.product.id})`);
    byType.set(entry.variant.clientType, entry);
  }
  const fallback = byType.get(DEFAULT_CLIENT_TYPE);
  if (!fallback) throw new Error(`No product defines the default client type "${DEFAULT_CLIENT_TYPE}"`);

  /** The known product and variant, or (unknown stored type) the default product with a channel-less variant. */
  function resolve(clientType: string): ResolvedVariant {
    return byType.get(clientType) ?? { product: fallback!.product, variant: { id: clientType, clientType, label: clientType, channels: [], portal: {} } };
  }

  /** Every product variant, in product order then variant order. */
  function allVariants(): ResolvedVariant[] {
    return [...variants];
  }

  /** Any variant of any product, whatever its status. */
  function isClientType(value: unknown): value is ClientType {
    return typeof value === "string" && byType.has(value);
  }

  const counts = (status: Product["status"], o: DraftOption) => status === "live" || status === "paused" || (status === "draft" && o.drafts);

  /** Client types the admin API accepts: live and paused variants, plus drafts when `drafts`. */
  function acceptedClientTypes(o: DraftOption): string[] {
    return variants.filter(({ product }) => counts(product.status, o)).map(({ variant }) => variant.clientType);
  }

  function isAcceptedClientType(value: unknown, o: DraftOption): value is ClientType {
    return typeof value === "string" && acceptedClientTypes(o).includes(value);
  }

  /** The admin dropdown: offered live variants (and offered drafts when `drafts`), by pickerOrder. */
  function clientTypeOptions(o: DraftOption): ClientTypeOption[] {
    return variants
      .filter(({ product, variant }) => variant.offered !== false && (product.status === "live" || (product.status === "draft" && o.drafts)))
      .map((entry, index) => ({ entry, index }))
      .sort((a, b) => (a.entry.variant.pickerOrder ?? 100) - (b.entry.variant.pickerOrder ?? 100) || a.index - b.index)
      .map(({ entry }) => ({ value: entry.variant.clientType, label: adminLabelFor(entry.variant.clientType) }));
  }

  /** The variant's label (team board), or null for an unknown type. */
  function labelFor(clientType: string): string | null {
    return byType.get(clientType)?.variant.label ?? null;
  }

  /** The admin wording: adminLabel or label, with " (paused)" or " (draft)". Unknown: the default's. */
  function adminLabelFor(clientType: string): string {
    const entry = byType.get(clientType);
    if (!entry) return adminLabelFor(DEFAULT_CLIENT_TYPE);
    return `${entry.variant.adminLabel ?? entry.variant.label}${STATUS_SUFFIX[entry.product.status]}`;
  }

  /** True when the client of this type sees the step (not hidden, channel matches). */
  function milestoneVisibleForClientType(m: { hidden?: boolean; channels?: readonly string[] }, clientType: string): boolean {
    return !m.hidden && appliesToVariant(m, resolve(clientType).variant);
  }

  /** The product's full portal template (every step, hidden and other-channel included). */
  function portalTemplateFor(clientType: string) {
    return portalTemplate(resolve(clientType).product);
  }

  const journeys = new Map<string, PortalJourney>();

  /** Everything the client portal needs for this client type. Cached for known types. */
  function portalJourneyFor(clientType: string): PortalJourney {
    const cached = journeys.get(clientType);
    if (cached) return cached;
    const { product, variant } = resolve(clientType);
    if (product.totalDays === null) throw new Error(`products/${product.id} has no totalDays: a client type can't run on it`);
    if (!product.portal) throw new Error(`products/${product.id} has no portal settings: a client type can't run on it`);
    const v = variant.portal;
    const portal = product.portal;

    const stages = portalTemplate(product).map((stage) => ({
      ...stage,
      milestones: stage.milestones
        .filter((m) => stepVisibleFor(m, variant))
        .map(({ hidden: _h, channels: _c, ...m }) => (v.taskDetails && Object.hasOwn(v.taskDetails, m.id) ? { ...m, detail: v.taskDetails[m.id] } : m)),
    }));
    const visible = new Set(stages.flatMap((s) => s.milestones.map((m) => m.id)));
    const features = portal.features ?? {};
    const hiddenPlayground = v.hiddenTaskPlayground ?? [];

    const stageGuides: Record<string, StageGuide> = {};
    const askItems: Record<string, AskItem[]> = {};
    for (const stage of stages) {
      const script = portal.voiceGuide ? own(portal.voiceGuide.scripts, stage.id) : undefined;
      if (script && portal.voiceGuide && !(v.hiddenGuideStages ?? []).includes(stage.id as StageId)) {
        stageGuides[stage.id] = { script, audioSrc: `/portal/voice/${portal.voiceGuide.audioPrefix}-${stage.id}.m4a` };
      }
      const items = own(portal.askAi, stage.id);
      if (items && items.length) askItems[stage.id] = items;
    }

    const journey: PortalJourney = {
      totalDays: product.totalDays,
      wordmark: portal.wordmark,
      brandName: v.brandName,
      tagline: v.tagline,
      introVideo: v.introVideo,
      lockedLook: v.lockedLook,
      hidesIncentive: Boolean(v.hidesIncentive),
      stages,
      taskNotes: v.taskNotes ?? {},
      hiddenTaskVideos: v.hiddenTaskVideos ?? [],
      hiddenTaskBooking: v.hiddenTaskBooking ?? [],
      hiddenTaskImportant: v.hiddenTaskImportant ?? [],
      playgroundSteps: (features.playgroundSteps ?? []).filter((id) => visible.has(id) && !hiddenPlayground.includes(id)),
      landingPreviewSteps: (features.landingPreviewSteps ?? []).filter((id) => visible.has(id)),
      stageGuides,
      askItems,
      stringPlan: v.stringPlan ?? null,
    };
    if (byType.has(clientType)) journeys.set(clientType, journey);
    return journey;
  }

  function totalDaysFor(clientType: string): number {
    return portalJourneyFor(clientType).totalDays;
  }

  function lockedLookFor(clientType: string) {
    return portalJourneyFor(clientType).lockedLook;
  }

  /** The steps the client sees, counted (the admin's "x of N milestones"). */
  function totalMilestoneCountFor(clientType: string): number {
    return portalJourneyFor(clientType).stages.reduce((n, s) => n + s.milestones.length, 0);
  }

  /** The admin's task checklist: every step the client sees, by stage, with Team/Client. */
  function checklistStagesFor(clientType: string): ChecklistStage[] {
    return buildStages(portalJourneyFor(clientType).stages, new Set(), 1).map((s) => ({
      id: s.id,
      name: s.name,
      milestones: s.milestones.map((m) => ({ id: m.id, title: m.title, awaitingTeam: Boolean(m.awaitingTeam) })),
    }));
  }

  /** For the journey-status report: the steps the client sees (raw, no per-variant wording) and which never block. */
  function journeyStatusPlan(clientType: string): { visible: (MilestoneTemplate & { stageName: string })[]; nonBlocking: string[] } {
    const { product } = resolve(clientType);
    const visible = portalTemplateFor(clientType).flatMap((stage) =>
      stage.milestones.filter((m) => milestoneVisibleForClientType(m, clientType)).map((m) => ({ ...m, stageName: stage.name })),
    );
    const nonBlocking = new Set(product.portal?.features?.nonBlockingSteps ?? []);
    return { visible, nonBlocking: visible.filter((m) => nonBlocking.has(m.id)).map((m) => m.id) };
  }

  /** The step whose content is the receptionist's qualification script, or null. */
  function receptionistScriptStepFor(clientType: string): string | null {
    return resolve(clientType).product.portal?.features?.receptionistScriptStep ?? null;
  }

  /** The step a form submission ticks for this client: the first visible step with that formId, or null. */
  function formStepFor(clientType: string, formId: string): string | null {
    for (const stage of portalJourneyFor(clientType).stages) for (const m of stage.milestones) if (m.formId === formId) return m.id;
    return null;
  }

  /**
   * Every product's steps (any status, hidden included), clientOnly stripped,
   * first id wins. Safe because products:check fails when two products'
   * steps with one id disagree on hasUpload, hasEditableContent or formId.
   */
  function allPortalSteps(): MilestoneTemplate[] {
    const seen = new Set<string>();
    const out: MilestoneTemplate[] = [];
    for (const product of products) {
      for (const { clientOnly: _clientOnly, ...step } of allSteps(product)) {
        if (seen.has(step.id)) continue;
        seen.add(step.id);
        out.push(step);
      }
    }
    return out;
  }

  /** Ids of every step that takes a file upload. */
  function uploadStepIds(): string[] {
    return allPortalSteps().filter((m) => m.hasUpload).map((m) => m.id);
  }

  /** The R2 media the portal may serve: every variant's /api/media/ intro video. */
  function mediaAllowlist(): Record<string, { key: string; type: string }> {
    const out: Record<string, { key: string; type: string }> = {};
    for (const { variant } of variants) {
      const src = variant.portal.introVideo?.src;
      if (!src || !src.startsWith("/api/media/")) continue;
      const name = src.slice("/api/media/".length);
      const type = MEDIA_TYPES[name.split(".").pop()?.toLowerCase() ?? ""];
      if (type) out[name] = { key: `media/${name}`, type };
    }
    return out;
  }

  /** Every role a live product uses (the Team page's pickers). */
  function liveRoles(): string[] {
    return [...new Set(products.filter((p) => p.status === "live").flatMap((p) => p.roles))].sort();
  }

  /** Whether this client's board can start, and with which tasks. */
  function boardSeedFor(clientType: string, o: DraftOption): BoardSeed {
    const entry = byType.get(clientType);
    if (!entry) return { ok: false, reason: "This client's product has no team task list yet." };
    const { product, variant } = entry;
    if (!(product.status === "live" || (product.status === "draft" && o.drafts))) return { ok: false, reason: `${product.name} is ${product.status}.` };
    return { ok: true, product, variant, tasks: teamTasksFor(product, variant) };
  }

  return {
    resolve,
    allVariants,
    isClientType,
    acceptedClientTypes,
    isAcceptedClientType,
    clientTypeOptions,
    labelFor,
    adminLabelFor,
    totalDaysFor,
    lockedLookFor,
    milestoneVisibleForClientType,
    portalTemplateFor,
    portalJourneyFor,
    totalMilestoneCountFor,
    checklistStagesFor,
    journeyStatusPlan,
    receptionistScriptStepFor,
    formStepFor,
    allPortalSteps,
    uploadStepIds,
    mediaAllowlist,
    liveRoles,
    boardSeedFor,
  };
}

export type Registry = ReturnType<typeof createRegistry>;

/** The app's registry: every product file. */
export const registry: Registry = createRegistry(productList);

export const {
  resolve,
  allVariants,
  isClientType,
  acceptedClientTypes,
  isAcceptedClientType,
  clientTypeOptions,
  labelFor,
  adminLabelFor,
  totalDaysFor,
  lockedLookFor,
  milestoneVisibleForClientType,
  portalTemplateFor,
  portalJourneyFor,
  totalMilestoneCountFor,
  checklistStagesFor,
  journeyStatusPlan,
  receptionistScriptStepFor,
  formStepFor,
  allPortalSteps,
  uploadStepIds,
  mediaAllowlist,
  liveRoles,
  boardSeedFor,
} = registry;
