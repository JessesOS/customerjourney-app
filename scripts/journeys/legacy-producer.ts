/**
 * The LEGACY producer: today's code, transcribed. Each formula sits next to
 * the file:line it copies (as of 2026-10-17, commit 983ffb1). It wrote the
 * frozen fixtures (C1); the registry producer must reproduce them exactly.
 *
 * Imports only lib/* (never portalClientStore or teamStore, which pull @/db),
 * products/index and lib/onboardingForm. Deleted once the app reads products/.
 */
import * as engine from "../../lib/journeyEngine";
import { milestoneVisibleFor, type ClientType, type JourneyStage, type StageTemplate } from "../../lib/journeyEngine";
import { buildJourneyStages, journeyTemplate, journeyTotalDays } from "../../lib/onboardingJourney";
import { buildRespondJourneyStages, respondJourneyTemplate, respondJourneyTotalDays } from "../../lib/respondJourney";
import { bssJourneyTemplate, bssJourneyTotalDays, buildBssJourneyStages } from "../../lib/bssJourney";
import { allMilestoneTemplates } from "../../lib/allJourneys";
import { stageGuideFor } from "../../lib/stageGuide";
import { askItemsFor } from "../../lib/askAi";
import { bssStringPlan, scaleMetaStringPlan } from "../../lib/stringPlans";
import { mapProductToJourney } from "../../lib/productMapping";
import { onboardingFormById, type PortalFormDefinition } from "../../lib/onboardingForm";
import { productList } from "../../products/index";
import {
  completionSets,
  DAYS,
  GHL_SAMPLES,
  HEADER_SKINS,
  HUBS,
  ssrSets,
  type ChecklistStage,
  type GlobalContract,
  type JourneyContract,
  type Producer,
  type StepContract,
} from "./contract";

const {
  clientTypeLabels,
  productBrandName,
  productHiddenTaskBooking,
  productHiddenTaskImportant,
  productHiddenTaskPlayground,
  productHiddenTaskVideos,
  productHidesIncentive,
  productIntroVideo,
  productLockedLook,
  productTagline,
  productTaskNotes,
} = engine;

/** The template the portal uses (ClientPortalExperience.tsx:189). */
function T(ct: ClientType): StageTemplate[] {
  return ct === "respond" ? respondJourneyTemplate : ct === "bss" ? bssJourneyTemplate : journeyTemplate;
}

/** The stage builder the portal uses (ClientPortalExperience.tsx:192-200). */
function B(ct: ClientType): (completed: Set<string>, day: number) => JourneyStage[] {
  if (ct === "respond") return (c, d) => buildRespondJourneyStages(c, d);
  if (ct === "bss") return (c, d) => buildBssJourneyStages(c, d);
  return (c, d) => buildJourneyStages(c, d, ct);
}

/** NON_BLOCKING_TASK_IDS (app/api/admin/journey-status/route.ts:26-34), copied. */
const NON_BLOCKING_TASK_IDS = new Set(["ob-6", "ob-6b", "ob-6c", "ob-crm", "ob-7", "bd-3", "bd-g1"]);

/** AdminClientsPanel.tsx:44-50, copied. */
const adminClientTypeOptions = [
  { value: "meta-google", label: "Scale — Meta + Google Ads" },
  { value: "meta", label: "Scale — Meta ads only" },
  { value: "google", label: "Scale — Google Ads only" },
  { value: "respond", label: "CRM — Respond" },
  { value: "bss-meta", label: "BSS Meta ads only" },
];

/** AdminClientsPanel.tsx:64-68, copied. */
function adminClientTypeLabel(value?: string) {
  if (value === "bss") return "BSS Fin Creighton (paused)";
  return adminClientTypeOptions.find((o) => o.value === value)?.label ?? "Scale — Meta + Google Ads";
}

/** The form route's union map (app/api/portal/[token]/form/[formId]/route.ts:5-7). */
const milestoneIdByFormId = new Map(allMilestoneTemplates.filter((m) => m.formId).map((m) => [m.formId!, m.id]));

function contract(clientType: string): JourneyContract {
  const ct = clientType as ClientType; // may be "zz-unknown"
  const template = T(ct);
  const build = B(ct);
  const isRespond = ct === "respond"; // ClientPortalExperience.tsx:180
  const isBss = ct === "bss"; // ClientPortalExperience.tsx:188

  const visibleIds = template.flatMap((s) => s.milestones.filter((m) => milestoneVisibleFor(m, ct)).map((m) => m.id));

  const renders: Record<string, JourneyStage[]> = {};
  for (const [name, ids] of Object.entries(completionSets(visibleIds))) {
    for (const d of DAYS) renders[`${name}@day${d}`] = build(new Set(ids), d);
  }

  // ClientPortalExperience.tsx:405-412, transcribed.
  const stageCompletedByFor = (completedIds: Set<string>, milestoneId: string): string | null => {
    const stage = template.find((s) => s.milestones.some((mm) => mm.id === milestoneId));
    if (!stage) return null;
    const willAllBeDone = stage.milestones
      .filter((mm) => milestoneVisibleFor(mm, ct))
      .every((mm) => mm.id === milestoneId || completedIds.has(mm.id));
    return willAllBeDone ? stage.id : null;
  };
  const sets = ssrSets(visibleIds);
  const stageCompletedBy = {
    none: Object.fromEntries(visibleIds.map((id) => [id, stageCompletedByFor(new Set(sets.none), id)])),
    half: Object.fromEntries(visibleIds.map((id) => [id, stageCompletedByFor(new Set(sets.half), id)])),
  };

  const totalDays = isRespond ? respondJourneyTotalDays : isBss ? bssJourneyTotalDays : journeyTotalDays; // CPE:190
  // page.tsx:37 passes respond/bss days, else undefined → computeCurrentDay's default journeyTotalDays (portalClientStore.ts:614).
  const currentDayCap = ct === "respond" ? respondJourneyTotalDays : ct === "bss" ? bssJourneyTotalDays : journeyTotalDays;
  const adminDayTotal = ct === "respond" ? 10 : ct === "bss" ? 42 : 30; // AdminClientsPanel.tsx:624

  const brandName = productBrandName[ct]; // CPE:182
  const tabTitle = productBrandName[ct] ?? "Client Portal"; // page.tsx:20-21

  // CPE:728
  const headerName = Object.fromEntries(
    HEADER_SKINS.map((designSkin) => [
      designSkin,
      brandName ?? (designSkin === "cobalt" || designSkin === "aurora" || designSkin === "calm" || designSkin === "grove" || designSkin === "groveaurora" ? (isRespond ? "CRM" : "Scale") : isRespond ? "crm" : "scale"),
    ]),
  );
  // CPE:958 (handoff), 990 (cobalt), 1025 (aurora), 1061 (grove)
  const hubBrand = Object.fromEntries(
    HUBS.map((hub) => [hub, hub === "handoff" ? brandName ?? (isRespond ? "crm" : "scale") : brandName ?? (isRespond ? "CRM" : "Scale")]),
  );

  const built = build(new Set(), 1).flatMap((s) => s.milestones);
  const steps: Record<string, StepContract> = {};
  for (const m of built) {
    steps[m.id] = {
      detail: m.detail, // the builder's output (journeyEngine.ts:261)
      note: productTaskNotes[ct]?.[m.id] ?? null, // CPE:1273
      showsVideo: Boolean(m.videoUrl && !productHiddenTaskVideos[ct]?.includes(m.id)), // CPE:1280
      showsImportant: Boolean(m.important && !productHiddenTaskImportant[ct]?.includes(m.id)), // CPE:1345
      showsBooking: Boolean(m.bookingUrl && !productHiddenTaskBooking[ct]?.includes(m.id)), // CPE:1479
      showsPlayground: (m.id === "ts-2" || m.id === "rsp-048") && !productHiddenTaskPlayground[ct]?.includes(m.id), // CPE:1523 (portalToken set)
      showsLandingPreview: m.id === "bd-g2", // CPE:1529 (portalToken set)
      interviewAudioBase: m.interview ? `/portal/voice/interview-${m.id}` : null, // CPE:1567
    };
  }

  const stageIds = template.map((s) => s.id);
  const stageGuides = Object.fromEntries(stageIds.map((id) => [id, stageGuideFor(ct, id) ?? null]));
  const askItems = Object.fromEntries(stageIds.map((id) => [id, askItemsFor(ct, id)]));
  const stringPlan = ct === "bss" ? bssStringPlan : ct === "bss-meta" ? scaleMetaStringPlan : null; // CPE:1075

  // receptionist-chat/route.ts:28, reachable only from a step that shows the playground.
  const receptionistScriptStep = Object.values(steps).some((s) => s.showsPlayground) ? (ct === "respond" ? "rsp-018" : "ob-3") : null;

  // journey-status/route.ts:47-71
  const statusTemplate = isRespond ? respondJourneyTemplate : ct === "bss" ? bssJourneyTemplate : journeyTemplate;
  const statusVisible = statusTemplate.flatMap((stage) =>
    stage.milestones.filter((m) => !m.hidden && milestoneVisibleFor(m, ct)).map((m) => ({ ...m, stageName: stage.name })),
  );
  const journeyStatus = {
    visible: statusVisible.map((m) => ({ id: m.id, title: m.title, stageName: m.stageName })),
    nonBlocking: statusVisible.filter((m) => NON_BLOCKING_TASK_IDS.has(m.id)).map((m) => m.id),
    formStepId: statusVisible.find((m) => m.formId)?.id ?? null,
  };

  // portalClientStore.ts:18-28
  const totalMilestoneCount =
    ct === "respond"
      ? respondJourneyTemplate.reduce((sum, stage) => sum + stage.milestones.length, 0)
      : ct === "bss"
        ? bssJourneyTemplate.reduce((sum, stage) => sum + stage.milestones.filter((m) => !m.hidden).length, 0)
        : journeyTemplate.reduce((sum, stage) => sum + stage.milestones.filter((m) => milestoneVisibleFor(m, ct)).length, 0);

  // AdminTaskChecklist.tsx:15-20, none completed, day 1.
  const none = new Set<string>();
  const checklistStages = ct === "respond" ? buildRespondJourneyStages(none, 1) : ct === "bss" ? buildBssJourneyStages(none, 1) : buildJourneyStages(none, 1, ct);
  const adminChecklist: ChecklistStage[] = checklistStages.map((s) => ({
    id: s.id,
    name: s.name,
    milestones: s.milestones.map((m) => ({ id: m.id, title: m.title, awaitingTeam: Boolean(m.awaitingTeam) })),
  }));

  // form/[formId]/route.ts:5-7, for the formIds on this client's visible steps.
  const formSteps: Record<string, string | null> = {};
  for (const m of built) if (m.formId) formSteps[m.formId] = milestoneIdByFormId.get(m.formId) ?? null;

  return {
    clientType,
    journeyTemplate: template,
    visibleIds,
    renders,
    stageCompletedBy,
    totalDays,
    currentDayCap,
    adminDayTotal,
    tabTitle,
    lockedLook: productLockedLook[ct] ?? null, // page.tsx:69
    wordmark: isRespond ? "CRM" : "Scale", // CPE:626-639 (brand prop), 728
    brandName: brandName ?? null,
    tagline: productTagline[ct] ?? null, // CPE:183
    introVideo: productIntroVideo[ct] ?? null, // CPE:185
    hidesIncentive: Boolean(productHidesIncentive[ct]), // CPE:652
    headerName,
    hubBrand,
    steps,
    stageGuides,
    askItems,
    stringPlan,
    receptionistScriptStep,
    journeyStatus,
    totalMilestoneCount,
    adminChecklist,
    adminLabel: adminClientTypeLabel(clientType),
    label: clientTypeLabels[ct] ?? null,
    formSteps,
  };
}

/** productById, as products/index exported it on 2026-10-17 (used by teamStore.allRoles). */
function productById(id: string) {
  return productList.find((p) => p.id === id) ?? null;
}

function global(): GlobalContract {
  const forms: Record<string, PortalFormDefinition> = {};
  for (const m of allMilestoneTemplates) {
    if (!m.formId) continue;
    const form = onboardingFormById(m.formId);
    if (form) forms[m.formId] = form;
  }
  // teamStore.ts:535-539
  const roles = new Set<string>();
  for (const id of ["scale", "respond"]) productById(id)?.roles.forEach((r) => roles.add(r));

  return {
    acceptedClientTypes: ["meta", "google", "meta-google", "respond", "bss", "bss-meta"].sort(), // portal-clients/route.ts:6
    adminOptions: adminClientTypeOptions,
    defaultClientType: "meta-google",
    allStepIds: allMilestoneTemplates.map((m) => m.id), // lib/allJourneys.ts
    uploadStepIds: allMilestoneTemplates.filter((m) => m.hasUpload).map((m) => m.id).sort(), // upload/[milestoneId]/route.ts:5
    adminForms: {
      // portal-clients/[id]/forms/route.ts:5-7
      formIds: Array.from(new Set(allMilestoneTemplates.map((m) => m.formId).filter((id): id is string => Boolean(id)))),
      editableStepIds: allMilestoneTemplates.filter((m) => m.hasEditableContent).map((m) => m.id),
    },
    forms,
    ghl: Object.fromEntries(GHL_SAMPLES.map((name) => [name, mapProductToJourney(name)])),
    // media/[name]/route.ts:6-9
    media: { "bss-launch-walkthrough.mp4": { key: "media/bss-launch-walkthrough.mp4", type: "video/mp4" } },
    teamRoles: [...roles].sort(),
  };
}

export const legacyProducer: Producer = { name: "legacy", contract, global };
