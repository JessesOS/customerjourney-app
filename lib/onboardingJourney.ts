export type MilestoneStatus = "done" | "current" | "upcoming";

/** Which ad channel(s) a client is on. Stored per client; chosen in admin. */
export type ClientType = "meta" | "google" | "meta-google";
export type ClientChannel = "meta" | "google";

export const clientTypeLabels: Record<ClientType, string> = {
  meta: "Meta ads",
  google: "Google Ads",
  "meta-google": "Meta + Google Ads",
};

export type JourneyMilestone = {
  id: string;
  title: string;
  detail: string;
  status: MilestoneStatus;
  formId?: string;
  notePrompt?: string;
  /** Placeholder for the note field; and whether a note must be entered before
      the task can be approved (e.g. collecting a Customer ID). */
  notePlaceholder?: string;
  noteRequired?: boolean;
  hasEditableContent?: boolean;
  videoUrl?: string;
  hasUpload?: boolean;
  /** Team-side work in progress — the client sees a "With us" chip, no action. */
  awaitingTeam?: boolean;
  /** Scheduling link (Cal.com / Calendly). Renders a "Book your call" CTA. */
  bookingUrl?: string;
  /** Step-by-step guide link (e.g. Scribe). Renders a guide button on the task. */
  guideUrl?: string;
  guideLabel?: string;
  /** A highlighted warning/callout shown prominently on the task. */
  important?: string;
};

export type StageStatus = "done" | "current" | "locked";

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

type MilestoneTemplate = {
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
  /** Hidden from the client flow entirely (not rendered, not counted). Flip to
      re-enable a task without deleting it. */
  hidden?: boolean;
  /** Restrict a task to specific ad channels. Omit = shown to every client.
      ["meta"] = Meta clients (and Meta+Google); ["google"] = Google clients
      (and Meta+Google). */
  channels?: ClientChannel[];
};

/** True when a milestone should appear for a client of the given type.
    Applies both the hidden flag and the channel restriction. */
export function milestoneVisibleFor(
  m: { hidden?: boolean; channels?: ClientChannel[] },
  clientType: ClientType,
): boolean {
  if (m.hidden) return false;
  if (!m.channels || m.channels.length === 0) return true;
  if (clientType === "meta-google") return true;
  return m.channels.includes(clientType);
}

type StageTemplate = {
  id: string;
  name: string;
  dayStart: number;
  dayEnd: number;
  blurb?: string;
  milestones: MilestoneTemplate[];
  statusNotes: string[];
};

// Content only -- no completion state. Condensed from the real CSM task data
// (see docs/client-portal-task-condensation-report.md in respond-csm-dashboard).
// Meta-only variant.
export const journeyTemplate: StageTemplate[] = [
  {
    id: "onboarding",
    name: "Onboarding",
    dayStart: 1,
    dayEnd: 2,
    milestones: [
      { id: "ob-1", title: "Complete your onboarding form", detail: "Business info, proof of address, domain & website access, branding.", formId: "scale-onboarding-intake-v1" },
      { id: "ob-2", title: "Book your Welcome Call & portal walkthrough", detail: "A live 30-minute walkthrough of your portal, your milestones, and your messaging center. Pick a time that suits you below — we'll send a calendar invite with everything you need to join.", bookingUrl: "https://go.rt-d.com/jesse30" },
      { id: "ob-3", title: "Review & approve your AI receptionist's qualification questions", detail: "Our team has drafted the qualification questions your AI will ask incoming leads, based on how you'd train a new team member. Take a look below and approve, or leave a note if you'd like anything adjusted.", notePrompt: "Any adjustments or requests for these questions?", hasEditableContent: true },
      { id: "ob-4", title: "Download the mobile app", detail: "Get the LeadConnector app so you never miss a lead. Available for iOS and Android — search \"LeadConnector\" in your app store.", videoUrl: "/portal/download-app-walkthrough.mp4" },
      { id: "ob-5", title: "Review your SMS/Email message copy", detail: "Our team has drafted the SMS and email messages your AI will send on your behalf. Take a look below and approve, or leave a note if you'd like anything changed.", notePrompt: "Any changes you'd like to this messaging?", hasEditableContent: true },
      { id: "ob-6", title: "Connect your calendar", detail: "Connect your calendar so your AI can see your availability and book appointments straight into it. Follow the step-by-step guide below.", videoUrl: "/portal/connect-accounts-walkthrough.mp4", guideUrl: "https://scribehow.com/o/1Ys-2mLjQsuPVjJ-N76Ubg/viewer/Set_Up_Calendars_and_Availability_in_your_CRM__7GRN6aWmSHSHoV8rVvqyzw", guideLabel: "Step-by-step guide" },
      { id: "ob-6b", title: "Connect your social accounts", detail: "Connect your social accounts so your AI can respond to messages and comments across your channels. Follow the step-by-step guide below.", videoUrl: "/portal/connect-accounts-walkthrough.mp4", guideUrl: "https://scribehow.com/o/1Ys-2mLjQsuPVjJ-N76Ubg/viewer/Connecting_Facebook_in_your_CRM__W7guqe5_Sy6-nMadYtAPyw", guideLabel: "Step-by-step guide" },
      { id: "ob-6c", title: "Set up a payment mechanism", detail: "Go to Settings → Billing to connect your preferred payment mechanism for seamless transactions.", important: "Without this we can't send SMS or emails, which will stall your build progress." },
      { id: "ob-7", title: "Upload your past leads (CSV)", detail: "Helps train your AI on what a good lead looks like for you.", hasUpload: true },
      { id: "ob-8", title: "Grant access to your accounts", detail: "Google My Business, domain, and website builder access.", videoUrl: "/portal/grant-access-walkthrough.mp4" },
    ],
    statusNotes: [
      "Your project timeline: Days 2-13 Build, Day 14 AI Test, Day 30 Go-Live.",
      "Your subscription fees begin 14-30 days from purchase.",
    ],
  },
  {
    id: "build",
    name: "Build",
    dayStart: 2,
    dayEnd: 13,
    blurb: "We're building your campaigns, assets, and AI receptionist — a few approvals needed along the way.",
    milestones: [
      // -- Meta-channel tasks (shown to Meta and Meta+Google clients) --
      { id: "bd-1", title: "Review & approve your eBook lead magnet content", detail: "We've drafted your lead magnet — take a look at the doc below and approve it, or leave a note if you'd like any revisions, before we build the landing page.", notePrompt: "Any revisions or amendments you'd like?", hasEditableContent: true, channels: ["meta"] },
      { id: "bd-2", title: "Approve your Meta ad campaigns & creative assets", detail: "Your ad strategy doc and creatives are ready below for final sign-off. Take a look and approve, or leave a note if you'd like anything changed.", notePrompt: "Any changes you'd like to the strategy or creative?", hasEditableContent: true, channels: ["meta"] },
      { id: "bd-3", title: "Grant RT Digital partner access to your Meta Business Suite", detail: "Add us as a Partner in Meta Business Suite so we can launch your campaigns. Watch the walkthrough below, then use our Business ID and step-by-step guide.", videoUrl: "/portal/meta-partner-access-walkthrough.mp4", guideUrl: "https://scribehow.com/o/1Ys-2mLjQsuPVjJ-N76Ubg/viewer/How_to_Add_RT_Digital_as_a_Partner_on_Meta_Business_Suite__9EIRy1GpRLSzuofqDb0XYQ", guideLabel: "Step-by-step guide", hasEditableContent: true, channels: ["meta"] },
      // -- Google-channel tasks (shown to Google and Meta+Google clients) --
      // No creative/campaign approval on the Google side by design — Google runs
      // high-intent traffic to the GHL landing page, so the client approves the
      // landing page copy and grants Ads-account access. Add a Scribe guideUrl
      // to bd-g1 when one exists.
      // Flow: client shares their Google Ads Customer ID here → RT Digital sends
      // a link request from the manager account → Google emails the client →
      // client accepts. No passwords change hands.
      { id: "bd-g1", title: "Link your Google Ads account to RT Digital", detail: "We connect your Google Ads account to RT Digital's manager account so we can build and run your campaigns — no passwords needed. Share your Google Ads Customer ID below (you'll find it in the top-right corner of your Google Ads account) and we'll send the link request. Don't have a Google Ads account yet? Just tell us in the same box and we'll set one up with you.", notePrompt: "Your Google Ads Customer ID", notePlaceholder: "e.g. 123-456-7890 — from the top-right of your Google Ads account", noteRequired: true, important: "After we send the request, Google will email you to approve it. Keep an eye on your inbox and click Accept — we can't start building until the link is approved.", channels: ["google"] },
      { id: "bd-g2", title: "Review & approve your Google Ads landing page copy", detail: "We've drafted the landing page your Google ads will send visitors to. Read it through below and approve, or leave a note if you'd like anything changed before we build the page.", hasEditableContent: true, notePrompt: "Any changes you'd like to the landing page copy?", channels: ["google"] },
      // HIDDEN for now — the CSM records this walkthrough Loom only once the ad
      // campaigns are actually loaded and ready, which is often well after the
      // client reaches this point. An empty "watch a video" task confused
      // clients, so it's hidden until the flow is reworked. To re-enable, delete
      // `hidden: true` (and set videoUrl to the recorded Loom, or add a bookingUrl/note).
      // What the walkthrough should cover (from Regine's handover + Scale SOPs):
      //   1. The live campaigns in Ads Manager — approved creatives & copy.
      //   2. The lead form (native Meta form / GHL landing page) — exact fields.
      //   3. The CRM lead flow — form submit → TradeAI CRM → pipeline → auto SMS + email.
      //   Record a 3–4 min Loom and paste it into the client's messaging center; they watch, then tick it off.
      { id: "bd-4", title: "Watch your ad campaign walkthrough video", detail: "A short recorded walkthrough showing exactly what's going live and how leads will flow in.", videoUrl: "/portal/ad-campaign-walkthrough.mp4", hidden: true, channels: ["meta"] },
    ],
    statusNotes: [
      "Your AI receptionist is being configured — no action needed from you yet.",
      "Your CRM access is being set up — you'll get a login once it's ready.",
    ],
  },
  {
    id: "testing",
    name: "Testing",
    dayStart: 14,
    dayEnd: 14,
    blurb: "A live test of your AI receptionist before we go live.",
    milestones: [
      { id: "ts-1", title: "Confirm your app, calendar & social accounts are connected", detail: "A quick check that everything is linked correctly before the test." },
      { id: "ts-2", title: "Test your AI receptionist live", detail: "Try to stump it with different scenarios — this is how we make it better for you." },
      { id: "ts-3", title: "Your Go-Live Call is scheduled", detail: "We'll lock in your Day 30 walkthrough based on today's results." },
    ],
    statusNotes: ["We'll fine-tune your AI based on your test feedback — no action needed from you."],
  },
  {
    id: "go-live",
    name: "Go-Live",
    dayStart: 30,
    dayEnd: 30,
    blurb: "Your system goes live — we'll walk your team through everything.",
    milestones: [
      { id: "gl-1", title: "Attend your Go-Live walkthrough call", detail: "We'll get your team confident using the live system before we finish." },
      { id: "gl-2", title: "Learn your live system", detail: "Calls, texts, missed-call handling — all in one app." },
      { id: "gl-3", title: "See your AI in action", detail: "Live call summaries, coaching notes, and real lead handling, demoed live." },
      { id: "gl-4", title: "Set your team's usage standards", detail: "How your team should use the app day-to-day, so nothing falls through the cracks." },
      { id: "gl-5", title: "You're live — access your recording & support links", detail: "Everything you need in one message: call recording, user manual, and support contact." },
    ],
    statusNotes: ["Your subscription fees have now officially commenced."],
  },
  {
    id: "post-launch",
    name: "Post-Launch",
    dayStart: 31,
    dayEnd: 31,
    blurb: "Ongoing support once you're live.",
    milestones: [
      { id: "pl-1", title: "Your Week 1 check-in call", detail: "A quick check-in to make sure everything's running smoothly." },
      { id: "pl-2", title: "Your Week 2 check-in call", detail: "Another check-in before we move to monthly calls." },
      { id: "pl-3", title: "Send us a testimonial", detail: "We'd love to hear how it's going — this helps us and future clients like you." },
    ],
    statusNotes: ["Your account is actively monitored — performance reports available monthly."],
  },
];

export const behindTheScenesItems = [
  { label: "Your eBook lead magnet", detail: "drafted, landing page in production", state: "Live" as const },
  { label: "Meta ad campaigns", detail: "strategy & creative approved, launching once Partner access is granted", state: "Building" as const },
  { label: "Your AI receptionist", detail: "qualification questions & knowledgebase configuration", state: "Building" as const },
  { label: "CRM & pipeline access", detail: "your login is being provisioned", state: "Building" as const },
];

export const journeyTotalDays = 30;

/**
 * Demo/default completion state: matches what the portal has always shown
 * (Onboarding fully done, Build's first milestone done) so the standalone
 * demo route and a freshly-seeded real client look identical.
 */
export const defaultCompletedMilestoneIds: string[] = [
  ...journeyTemplate[0].milestones.map((m) => m.id),
  journeyTemplate[1].milestones[0].id,
];

export const defaultCurrentDay = 12;

/**
 * Builds the full stage/milestone status tree from a set of completed
 * milestone ids and the client's current day. A stage is "done" once every
 * milestone in it is completed; the first stage with any incomplete
 * milestone is "current"; everything after that is "locked".
 */
export function buildJourneyStages(
  completedIds: Set<string>,
  currentDay: number,
  clientType: ClientType = "meta-google",
): JourneyStage[] {
  let currentAssigned = false;

  return journeyTemplate.map((stageTemplate) => {
    // Hidden and off-channel milestones are dropped entirely — they don't render
    // and don't count toward the stage's task total or completion.
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

export function journeyProgressPercent(currentDay: number, totalDays: number = journeyTotalDays): number {
  return Math.round((Math.min(currentDay, totalDays) / totalDays) * 100);
}

export function completedStageCount(stages: JourneyStage[]): number {
  return stages.filter((s) => s.status === "done").length;
}
