// The pure stage builder: a stage template plus a set of completed step ids
// gives the stage/step status tree the portal draws. No product knowledge, no
// imports beyond types, so it is safe in the browser, the Worker and scripts.

import type { JourneyMilestone, JourneyStage, MilestoneTemplate, StageStatus, StageTemplate } from "./journeyTypes";

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
