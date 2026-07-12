// Shared journey engine — the generic types + stage-builder used by every
// product (Scale, Respond, ...). Each product owns its own template file
// (lib/onboardingJourney.ts for Scale, lib/respondJourney.ts for Respond) and
// calls buildStagesFromTemplate() with its own data. The portal UI
// (ClientPortalExperience.tsx and friends) only ever touches JourneyStage /
// JourneyMilestone, so it never needs to know which product it's rendering.

export type MilestoneStatus = "done" | "current" | "upcoming";
export type StageStatus = "done" | "current" | "locked";

/** Which product + ad channel(s) a client is on. Stored on the client record
    (portal_clients.client_type); chosen in admin. Scale clients pick a channel
    variant; Respond has no channels at all. */
export type ClientType = "meta" | "google" | "meta-google" | "respond";
export type ClientChannel = "meta" | "google";

export const clientTypeLabels: Record<ClientType, string> = {
  meta: "Scale — Meta ads",
  google: "Scale — Google Ads",
  "meta-google": "Scale — Meta + Google Ads",
  respond: "Respond",
};

export type JourneyMilestone = {
  id: string;
  title: string;
  detail: string;
  status: MilestoneStatus;
  formId?: string;
  notePrompt?: string;
  notePlaceholder?: string;
  noteRequired?: boolean;
  hasEditableContent?: boolean;
  videoUrl?: string;
  hasUpload?: boolean;
  awaitingTeam?: boolean;
  bookingUrl?: string;
  guideUrl?: string;
  guideLabel?: string;
  important?: string;
  /** Shows a "copy your portal link" card instead of the usual content — for
      tasks that just ask the client to bookmark where they already are. */
  showPortalLink?: boolean;
};

export type JourneyStage = {
  id: string;
  name: string;
  dayStart: number;
  dayEnd: number;
  status: StageStatus;
  blurb?: string;
  milestones: JourneyMilestone[];
  statusNotes: string[];
};

export type MilestoneTemplate = {
  id: string;
  title: string;
  detail: string;
  formId?: string;
  notePrompt?: string;
  notePlaceholder?: string;
  noteRequired?: boolean;
  hasEditableContent?: boolean;
  videoUrl?: string;
  hasUpload?: boolean;
  awaitingTeam?: boolean;
  bookingUrl?: string;
  guideUrl?: string;
  guideLabel?: string;
  important?: string;
  showPortalLink?: boolean;
  /** Hidden from the client flow entirely (not rendered, not counted). Flip to
      re-enable a task without deleting it. */
  hidden?: boolean;
  /** Restrict a task to specific ad channels (Scale only). Omit = shown to
      every client of the product. ["meta"] = Meta clients (and Meta+Google);
      ["google"] = Google clients (and Meta+Google). Irrelevant for Respond. */
  channels?: ClientChannel[];
};

export type StageTemplate = {
  id: string;
  name: string;
  dayStart: number;
  dayEnd: number;
  blurb?: string;
  milestones: MilestoneTemplate[];
  statusNotes: string[];
};

/** True when a milestone should appear for a client of the given type.
    Applies both the hidden flag and the channel restriction. Channel
    restrictions only ever apply within Scale — a Respond client never has
    channels set on its milestones, so this always resolves to visible. */
export function milestoneVisibleFor(m: { hidden?: boolean; channels?: ClientChannel[] }, clientType: ClientType): boolean {
  if (m.hidden) return false;
  if (!m.channels || m.channels.length === 0) return true;
  if (clientType === "meta-google") return true;
  if (clientType === "meta" || clientType === "google") return m.channels.includes(clientType);
  return false;
}

/**
 * Builds the full stage/milestone status tree from a set of completed
 * milestone ids and the client's current day. A stage is "done" once every
 * visible milestone in it is completed; the first stage with any incomplete
 * milestone is "current"; everything after that is "locked".
 */
export function buildStagesFromTemplate(
  template: StageTemplate[],
  completedIds: Set<string>,
  currentDay: number,
  clientType: ClientType,
): JourneyStage[] {
  let currentAssigned = false;

  return template.map((stageTemplate) => {
    const visible = stageTemplate.milestones.filter((m) => milestoneVisibleFor(m, clientType));
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
      detail: m.detail,
      formId: m.formId,
      notePrompt: m.notePrompt,
      notePlaceholder: m.notePlaceholder,
      noteRequired: m.noteRequired,
      hasEditableContent: m.hasEditableContent,
      videoUrl: m.videoUrl,
      hasUpload: m.hasUpload,
      awaitingTeam: m.awaitingTeam,
      bookingUrl: m.bookingUrl,
      guideUrl: m.guideUrl,
      guideLabel: m.guideLabel,
      important: m.important,
      showPortalLink: m.showPortalLink,
      status: completedIds.has(m.id) ? "done" : isCurrent && i === firstOpenIndex ? "current" : "upcoming",
    }));

    return {
      id: stageTemplate.id,
      name: stageTemplate.name,
      dayStart: stageTemplate.dayStart,
      dayEnd: stageTemplate.dayEnd,
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
