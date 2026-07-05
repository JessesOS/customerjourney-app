export type MilestoneStatus = "done" | "current" | "upcoming";

export type JourneyMilestone = {
  id: string;
  title: string;
  detail: string;
  status: MilestoneStatus;
  formId?: string;
  notePrompt?: string;
  hasEditableContent?: boolean;
  videoUrl?: string;
  hasUpload?: boolean;
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
  hasEditableContent?: boolean;
  videoUrl?: string;
  hasUpload?: boolean;
};

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
      { id: "ob-2", title: "Attend your Welcome Call & portal walkthrough", detail: "A live walkthrough of your portal, milestones, and messaging center. We'll reach out shortly to lock in a time — keep an eye on your calendar invite or portal messages for the details." },
      { id: "ob-3", title: "Review & approve your AI receptionist's qualification questions", detail: "Our team has drafted the qualification questions your AI will ask incoming leads, based on how you'd train a new team member. Take a look below and approve, or leave a note if you'd like anything adjusted.", notePrompt: "Any adjustments or requests for these questions?", hasEditableContent: true },
      { id: "ob-4", title: "Download the mobile app", detail: "Get the LeadConnector app so you never miss a lead. Available for iOS and Android — search \"LeadConnector\" in your app store.", videoUrl: "/portal/download-app-walkthrough.mp4" },
      { id: "ob-5", title: "Review your SMS/Email message copy", detail: "Our team has drafted the SMS and email messages your AI will send on your behalf. Take a look below and approve, or leave a note if you'd like anything changed.", notePrompt: "Any changes you'd like to this messaging?", hasEditableContent: true },
      { id: "ob-6", title: "Connect your calendar, social accounts & payment method", detail: "Needed so your AI can book appointments and take payments.", videoUrl: "/portal/connect-accounts-walkthrough.mp4" },
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
    blurb: "We're building your eBook, ad campaigns, and AI receptionist — a few approvals needed along the way.",
    milestones: [
      { id: "bd-1", title: "Review & approve your eBook lead magnet content", detail: "We've drafted your lead magnet — take a look and approve it before we build the landing page." },
      { id: "bd-2", title: "Approve your Meta ad campaigns & creative assets", detail: "Your ad strategy doc and creatives are ready for final sign-off." },
      { id: "bd-3", title: "Grant RT Digital partner access to your Meta Business Suite", detail: "Add us as a Partner in Meta Business Suite so we can launch your campaigns. We'll send you the Business ID and a step-by-step guide." },
      { id: "bd-4", title: "Watch your ad campaign walkthrough video", detail: "A short recorded walkthrough showing exactly what's going live and how leads will flow in." },
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
      { id: "pl-1", title: "Your Week 1 & Week 2 check-in calls", detail: "We'll check in to make sure everything's running smoothly, then move to monthly check-ins." },
      { id: "pl-2", title: "Send us a testimonial", detail: "We'd love to hear how it's going — this helps us and future clients like you." },
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
export function buildJourneyStages(completedIds: Set<string>, currentDay: number): JourneyStage[] {
  let currentAssigned = false;

  return journeyTemplate.map((stageTemplate) => {
    const allDone = stageTemplate.milestones.every((m) => completedIds.has(m.id));
    const isCurrent = !allDone && !currentAssigned;
    if (isCurrent) currentAssigned = true;

    const status: StageStatus = allDone ? "done" : isCurrent ? "current" : "locked";
    const firstOpenIndex = Math.max(
      0,
      stageTemplate.milestones.findIndex((m) => !completedIds.has(m.id)),
    );

    const milestones: JourneyMilestone[] = stageTemplate.milestones.map((m, i) => ({
      id: m.id,
      title: m.title,
      detail: m.detail,
      formId: m.formId,
      notePrompt: m.notePrompt,
      hasEditableContent: m.hasEditableContent,
      videoUrl: m.videoUrl,
      hasUpload: m.hasUpload,
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
