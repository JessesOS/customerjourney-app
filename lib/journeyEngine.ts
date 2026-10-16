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
// "bss": custom product for Bitcoin Success School (Fin Creighton), the first signed
// client, 2026-10-15. For now it runs the Scale journey exactly as a Meta-only
// client sees it; give it its own template when the custom work is defined.
export type ClientType = "meta" | "google" | "meta-google" | "respond" | "bss";
export type ClientChannel = "meta" | "google";

/** Products whose portal look is fixed, whatever look the client record holds.
    BSS (Jesse, 2026-10-15): the Aurora welcome, then Grove Aurora with the
    journey rail. Grove Aurora opens on the Aurora welcome by itself. */
export const productLockedLook: Partial<Record<ClientType, "groveaurora">> = {
  bss: "groveaurora",
};

/** Products that carry their own name in the portal (welcome, header, browser
    tab) instead of the house product name. BSS: "BSS Launchpad" (Jesse, 2026-10-15). */
export const productBrandName: Partial<Record<ClientType, string>> = {
  bss: "BSS Launchpad",
};

/** Products that never show the $200 "move fast" incentive popup. BSS: off
    (Jesse, 2026-10-15). Scale Meta-only: off (Jesse, 2026-10-16). */
export const productHidesIncentive: Partial<Record<ClientType, true>> = {
  bss: true,
  meta: true,
};

/** A short line under a custom product's name on the welcome. */
export const productTagline: Partial<Record<ClientType, string>> = {
  bss: "Onboarding & delivery",
};

export const clientTypeLabels: Record<ClientType, string> = {
  meta: "Scale — Meta ads",
  google: "Scale — Google Ads",
  "meta-google": "Scale — Meta + Google Ads",
  respond: "CRM",
  bss: "BSS Fin Creighton",
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
  /** Generic embedded page (e.g. a testimonial form) with its own heading/note. */
  embedUrl?: string;
  embedTitle?: string;
  embedNote?: string;
  guideUrl?: string;
  guideLabel?: string;
  important?: string;
  /** Numbered action steps shown in a card, e.g. "1. Check your inbox, 2. Go
      to the login page, 3. Log in." */
  steps?: string[];
  /** Shows a "copy your portal link" card instead of the usual content — for
      tasks that just ask the client to bookmark where they already are. */
  showPortalLink?: boolean;
  /** Voice interview: questions asked one at a time; the answers are saved
      as the task's note. */
  interview?: string[];
  /** An email the client invites to their accounts, shown with a copy button. */
  inviteEmail?: string;
  /** The finish button's wording, in place of "Approve & continue". */
  doneLabel?: string;
  /** Hosted voice agent that runs the interview as a live call; the
      `interview` questions remain as the typed fallback. */
  interviewAgentId?: string;
};

export type JourneyStage = {
  id: string;
  name: string;
  dayStart: number;
  dayEnd: number;
  ongoing?: boolean;
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
  embedUrl?: string;
  embedTitle?: string;
  embedNote?: string;
  guideUrl?: string;
  guideLabel?: string;
  important?: string;
  steps?: string[];
  showPortalLink?: boolean;
  interview?: string[];
  interviewAgentId?: string;
  inviteEmail?: string;
  doneLabel?: string;
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
  /** An open-ended stage (support after launch): shown without days, and
      outside the day count in the portal header. */
  ongoing?: boolean;
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
  if (clientType === "bss") return m.channels.includes("meta"); // based on Scale, Meta only
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
