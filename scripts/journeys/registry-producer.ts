/**
 * The REGISTRY producer: the frozen-journey contract computed the way the app
 * computes it since the product-file switch, from lib/productRegistry.ts and
 * the portal decision helpers in lib/journeyBuild.ts. It must reproduce the
 * fixtures the legacy code wrote (C1), field for field.
 */
import {
  askItemsOf,
  buildStages,
  headerName,
  hubBrand,
  interviewAudioBase,
  showsLandingPreview,
  showsPlayground,
  showsTaskBooking,
  showsTaskImportant,
  showsTaskVideo,
  stageCompletedBy,
  stageGuideOf,
  tabTitle,
  taskNote,
} from "../../lib/journeyBuild";
import type { JourneyStage } from "../../lib/journeyTypes";
import { onboardingFormById, type PortalFormDefinition } from "../../lib/onboardingForm";
import { mapProductToJourney } from "../../lib/productMapping";
import { DEFAULT_CLIENT_TYPE, registry } from "../../lib/productRegistry";
import { completionSets, DAYS, GHL_SAMPLES, HEADER_SKINS, HUBS, ssrSets, type GlobalContract, type JourneyContract, type Producer, type StepContract } from "./contract";

function contract(ct: string): JourneyContract {
  const j = registry.portalJourneyFor(ct);
  const template = registry.portalTemplateFor(ct);
  const visibleIds = j.stages.flatMap((s) => s.milestones.map((m) => m.id));

  const renders: Record<string, JourneyStage[]> = {};
  for (const [name, ids] of Object.entries(completionSets(visibleIds))) {
    for (const d of DAYS) renders[`${name}@day${d}`] = buildStages(j.stages, new Set(ids), d);
  }

  const sets = ssrSets(visibleIds);
  const stageCompleted = {
    none: Object.fromEntries(visibleIds.map((id) => [id, stageCompletedBy(j.stages, new Set(sets.none), id)])),
    half: Object.fromEntries(visibleIds.map((id) => [id, stageCompletedBy(j.stages, new Set(sets.half), id)])),
  };

  const steps: Record<string, StepContract> = {};
  for (const m of j.stages.flatMap((s) => s.milestones)) {
    steps[m.id] = {
      detail: m.detail,
      note: taskNote(j, m.id) ?? null,
      showsVideo: showsTaskVideo(j, m),
      showsImportant: showsTaskImportant(j, m),
      showsBooking: showsTaskBooking(j, m),
      showsPlayground: showsPlayground(j, m.id),
      showsLandingPreview: showsLandingPreview(j, m.id),
      interviewAudioBase: m.interview ? interviewAudioBase(m.id) : null,
    };
  }

  const stageIds = template.map((s) => s.id);
  const plan = registry.journeyStatusPlan(ct);
  const formSteps: Record<string, string | null> = {};
  for (const m of j.stages.flatMap((s) => s.milestones)) if (m.formId) formSteps[m.formId] = registry.formStepFor(ct, m.formId);

  return {
    clientType: ct,
    journeyTemplate: template,
    visibleIds,
    renders,
    stageCompletedBy: stageCompleted,
    totalDays: j.totalDays,
    currentDayCap: j.totalDays,
    adminDayTotal: registry.totalDaysFor(ct),
    tabTitle: tabTitle(j),
    lockedLook: j.lockedLook ?? null,
    wordmark: j.wordmark,
    brandName: j.brandName ?? null,
    tagline: j.tagline ?? null,
    introVideo: j.introVideo ?? null,
    hidesIncentive: j.hidesIncentive,
    headerName: Object.fromEntries(HEADER_SKINS.map((skin) => [skin, headerName(j, skin)])),
    hubBrand: Object.fromEntries(HUBS.map((hub) => [hub, hubBrand(j, hub)])),
    steps,
    stageGuides: Object.fromEntries(stageIds.map((id) => [id, stageGuideOf(j, id) ?? null])),
    askItems: Object.fromEntries(stageIds.map((id) => [id, askItemsOf(j, id)])),
    stringPlan: j.stringPlan,
    receptionistScriptStep: j.playgroundSteps.length ? registry.receptionistScriptStepFor(ct) : null,
    journeyStatus: {
      visible: plan.visible.map((m) => ({ id: m.id, title: m.title, stageName: m.stageName })),
      nonBlocking: plan.nonBlocking,
      formStepId: plan.visible.find((m) => m.formId)?.id ?? null,
    },
    totalMilestoneCount: registry.totalMilestoneCountFor(ct),
    adminChecklist: registry.checklistStagesFor(ct),
    adminLabel: registry.adminLabelFor(ct),
    label: registry.labelFor(ct),
    formSteps,
  };
}

function global(): GlobalContract {
  const steps = registry.allPortalSteps();
  const formIds = Array.from(new Set(steps.map((m) => m.formId).filter((id): id is string => Boolean(id))));
  const forms: Record<string, PortalFormDefinition> = {};
  for (const id of formIds) {
    const form = onboardingFormById(id);
    if (form) forms[id] = form;
  }
  return {
    acceptedClientTypes: [...registry.acceptedClientTypes({ drafts: false })].sort(),
    adminOptions: registry.clientTypeOptions({ drafts: false }),
    defaultClientType: DEFAULT_CLIENT_TYPE,
    allStepIds: steps.map((m) => m.id),
    uploadStepIds: [...registry.uploadStepIds()].sort(),
    adminForms: { formIds, editableStepIds: steps.filter((m) => m.hasEditableContent).map((m) => m.id) },
    forms,
    ghl: Object.fromEntries(GHL_SAMPLES.map((name) => [name, mapProductToJourney(name)])),
    media: registry.mediaAllowlist(),
    teamRoles: registry.liveRoles(),
  };
}

export const registryProducer: Producer = { name: "registry", contract, global };
