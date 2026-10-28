// The pure stage builder: a stage template plus a set of completed step ids
// gives the stage/step status tree the portal draws. No product knowledge, no
// imports beyond types, so it is safe in the browser, the Worker and scripts.

import type { AskItem, JourneyMilestone, JourneyStage, MilestoneTemplate, PortalJourney, StageGuide, StageStatus, StageTemplate } from "./journeyTypes";

export type BuildOptions = {
  /** Which steps the client sees. Default: every step in the template. */
  visible?: (m: MilestoneTemplate) => boolean;
  /** The step's description. Default: its own `detail`. */
  detail?: (m: MilestoneTemplate) => string;
};

/**
 * Builds the full stage/milestone status tree from a set of completed
 * milestone ids and the client's current day. A stage is "done" once every
 * visible milestone in it is completed; the first stage with any incomplete
 * milestone is "current"; everything after that is "locked".
 */
export function buildStages(
  template: StageTemplate[],
  completedIds: Set<string>,
  currentDay: number,
  options: BuildOptions = {},
): JourneyStage[] {
  const isVisible = options.visible ?? (() => true);
  const detailOf = options.detail ?? ((m: MilestoneTemplate) => m.detail);
  let currentAssigned = false;

  return template.map((stageTemplate) => {
    const visible = stageTemplate.milestones.filter((m) => isVisible(m));
    const allDone = visible.every((m) => completedIds.has(m.id));
    const isCurrent = !allDone && !currentAssigned;
    if (isCurrent) currentAssigned = true;

    const status: StageStatus = allDone ? "done" : isCurrent ? "current" : "locked";
    const firstOpenIndex = Math.max(
      0,
      visible.findIndex((m) => !completedIds.has(m.id)),
    );

    const milestones: JourneyMilestone[] = visible.map((m, i) => ({
      id: m.id,
      title: m.title,
      detail: detailOf(m),
      formId: m.formId,
      notePrompt: m.notePrompt,
      interview: m.interview,
      interviewAgentId: m.interviewAgentId,
      inviteEmail: m.inviteEmail,
      doneLabel: m.doneLabel,
      notePlaceholder: m.notePlaceholder,
      noteRequired: m.noteRequired,
      hasEditableContent: m.hasEditableContent,
      videoUrl: m.videoUrl,
      hasUpload: m.hasUpload,
      awaitingTeam: m.awaitingTeam,
      bookingUrl: m.bookingUrl,
      embedUrl: m.embedUrl,
      embedTitle: m.embedTitle,
      embedNote: m.embedNote,
      guideUrl: m.guideUrl,
      guideLabel: m.guideLabel,
      important: m.important,
      steps: m.steps,
      showPortalLink: m.showPortalLink,
      ...(m.imageUrl ? { imageUrl: m.imageUrl, imageAlt: m.imageAlt ?? "" } : {}),
      ...(m.uploadOptions ? { uploadOptions: m.uploadOptions } : {}),
      ...(m.pendingContentText ? { pendingContentText: m.pendingContentText } : {}),
      ...(m.optional ? { optional: true } : {}),
      ...(m.links?.length ? { links: m.links } : {}),
      ...(m.linksSource ? { linksSource: m.linksSource } : {}),
      ...(m.noteHint ? { noteHint: m.noteHint } : {}),
      status: completedIds.has(m.id) ? "done" : isCurrent && i === firstOpenIndex ? "current" : "upcoming",
    }));

    return {
      id: stageTemplate.id,
      name: stageTemplate.name,
      dayStart: stageTemplate.dayStart,
      dayEnd: stageTemplate.dayEnd,
      ongoing: stageTemplate.ongoing,
      blurb: stageTemplate.blurb,
      statusNotes: stageTemplate.statusNotes,
      status,
      milestones,
    };
  });
}

export function journeyProgressPercent(currentDay: number, totalDays: number): number {
  return Math.round((Math.min(currentDay, totalDays) / totalDays) * 100);
}

export function completedStageCount(stages: JourneyStage[]): number {
  return stages.filter((s) => s.status === "done").length;
}

// ── Portal decisions ─────────────────────────────────────────────────────
// Each helper replaces one inline expression in ClientPortalExperience.tsx,
// so the portal decides from its PortalJourney prop, never from a client type.

/** Skins whose header shows the wordmark capitalised ("Scale"); the others lowercase it ("scale"). */
const CAPITALISED_SKINS = new Set(["cobalt", "aurora", "calm", "grove", "groveaurora"]);

/** The name top left of the portal header. */
export function headerName(j: PortalJourney, designSkin: string): string {
  return j.brandName ?? (CAPITALISED_SKINS.has(designSkin) ? j.wordmark : j.wordmark.toLowerCase());
}

/** The name a home hub shows. The handoff hub lowercases the wordmark. */
export function hubBrand(j: PortalJourney, hub: "handoff" | "cobalt" | "aurora" | "grove"): string {
  return j.brandName ?? (hub === "handoff" ? j.wordmark.toLowerCase() : j.wordmark);
}

/** The browser tab's title. */
export function tabTitle(j: PortalJourney): string {
  return j.brandName ?? "Client Portal";
}

/** A variant's note at the top of a step, if any. */
export function taskNote(j: PortalJourney, stepId: string): string | undefined {
  return Object.hasOwn(j.taskNotes, stepId) ? j.taskNotes[stepId] : undefined;
}

/** The step's "Watch how it works" video shows. */
export function showsTaskVideo(j: PortalJourney, m: { id: string; videoUrl?: string }): boolean {
  return Boolean(m.videoUrl) && !j.hiddenTaskVideos.includes(m.id);
}

/** The step's "Important" box shows. */
export function showsTaskImportant(j: PortalJourney, m: { id: string; important?: string }): boolean {
  return Boolean(m.important) && !j.hiddenTaskImportant.includes(m.id);
}

/** The step's booking calendar shows. */
export function showsTaskBooking(j: PortalJourney, m: { id: string; bookingUrl?: string }): boolean {
  return Boolean(m.bookingUrl) && !j.hiddenTaskBooking.includes(m.id);
}

/** The step shows the live AI receptionist test. */
export function showsPlayground(j: PortalJourney, stepId: string): boolean {
  return j.playgroundSteps.includes(stepId);
}

/** The step shows the landing-page preview. */
export function showsLandingPreview(j: PortalJourney, stepId: string): boolean {
  return j.landingPreviewSteps.includes(stepId);
}

/** Interview audio is keyed by step id: public/portal/voice/interview-<stepId>-<n>.m4a.
    Changing an inherited interview therefore needs a new step id. */
export function interviewAudioBase(stepId: string): string {
  return `/portal/voice/interview-${stepId}`;
}

/** The stage's voice guide, if it has one. */
export function stageGuideOf(j: PortalJourney, stageId: string): StageGuide | undefined {
  return Object.hasOwn(j.stageGuides, stageId) ? j.stageGuides[stageId] : undefined;
}

/** The stage's Ask-AI questions (none: empty). */
export function askItemsOf(j: PortalJourney, stageId: string): AskItem[] {
  return (Object.hasOwn(j.askItems, stageId) ? j.askItems[stageId] : undefined) ?? [];
}

/** The stage id if approving `milestoneId` completes its whole stage (stages hold visible steps only). */
export function stageCompletedBy(stages: StageTemplate[], completedIds: Set<string>, milestoneId: string): string | null {
  const stage = stages.find((s) => s.milestones.some((mm) => mm.id === milestoneId));
  if (!stage) return null;
  const willAllBeDone = stage.milestones.every((mm) => mm.id === milestoneId || completedIds.has(mm.id));
  return willAllBeDone ? stage.id : null;
}
