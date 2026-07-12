import { buildStagesFromTemplate, type ClientType, type JourneyStage, type StageTemplate } from "./journeyEngine";

// Respond's client-facing tasking — pulled from the 12 portalVisible: true
// tasks in respond-csm-dashboard (lib/respondTasks.ts, templateIds rsp-NNN),
// via GET /api/tasks?environment=demo&product=respond on that app. Respond is
// a single product with no ad-channel branching (no Meta/Google split) and a
// shorter, ~10-day one-shot timeline rather than Scale's 30 days.
export const respondJourneyTemplate: StageTemplate[] = [
  {
    id: "onboarding",
    name: "Onboarding",
    dayStart: 1,
    dayEnd: 2,
    milestones: [
      { id: "rsp-012", title: "Complete your onboarding form", detail: "Log in to your portal and submit the onboarding form before your Welcome Call.", formId: "respond-onboarding-intake-v1" },
      { id: "rsp-014", title: "Attend your Welcome Call & portal walkthrough", detail: "We'll walk you through your portal, your project milestones, and the messaging center on the call. Pick a time that suits you below — we'll send a calendar invite with everything you need to join.", bookingUrl: "https://go.rt-d.com/jesse30" },
      { id: "rsp-015", title: "Bookmark your portal link", detail: "Save your portal link so you can get back to it anytime — this is the one place to track your progress and message our team.", showPortalLink: true },
      { id: "rsp-017", title: "Upload your client database (CSV)", detail: "Prepare a CSV of your past customers and leads — we'll walk you through the upload.", hasUpload: true },
      { id: "rsp-018", title: "Review & approve your AI qualification questions", detail: "We'll go through your AI receptionist's qualifying questions together on the Welcome Call." },
    ],
    statusNotes: [],
  },
  {
    id: "testing",
    name: "Testing",
    dayStart: 3,
    dayEnd: 8,
    blurb: "We're setting up your AI receptionist and CRM behind the scenes — a live test call before we go live.",
    milestones: [
      { id: "rsp-048", title: "Test your AI receptionist live", detail: "On the AI Test Call we'll have you chat and speak with your AI to make sure it's ready to go." },
      { id: "rsp-049", title: "Download the LeadConnector app", detail: "Search \"LeadConnector\" in the App Store or Google Play and install it before your Go-Live call.", videoUrl: "/portal/download-app-walkthrough.mp4" },
    ],
    statusNotes: [
      "Your AI receptionist is being configured — no action needed from you yet.",
      "Your CRM and pipeline access is being set up — you'll get a login once it's ready.",
    ],
  },
  {
    id: "go-live",
    name: "Go-Live",
    dayStart: 10,
    dayEnd: 10,
    blurb: "Your system goes live — we'll walk your team through everything.",
    milestones: [
      { id: "rsp-059", title: "Your Go-Live walkthrough", detail: "On the Go-Live call we'll show you how to handle calls, contacts, AI summaries, and notifications." },
      { id: "rsp-062", title: "Approve updating your website & Google Business Profile", detail: "We'll switch your website and Google listing to your new AI phone number — we just need your go-ahead.", notePrompt: "Anything to flag before we make the switch?" },
      { id: "rsp-064", title: "You're live! Access your recording & support links", detail: "Your system is live. Check your portal messages for your call recording, user manual, and support resources." },
    ],
    statusNotes: ["Your subscription fees have now officially commenced."],
  },
  {
    id: "post-launch",
    name: "Post-Launch",
    dayStart: 11,
    dayEnd: 11,
    blurb: "Ongoing support once you're live.",
    milestones: [
      { id: "rsp-072", title: "Share your experience — send us a testimonial", detail: "We'd love to hear how it's going. A short video or written testimonial means the world to us!", notePrompt: "Paste your testimonial here, or a link to your video" },
      { id: "rsp-073", title: "Your check-in calls", detail: "We'll schedule regular check-ins to review performance and answer questions — we'll confirm times in your portal (weekly, then monthly)." },
    ],
    statusNotes: ["Your account is actively monitored — performance reports available monthly."],
  },
];

export const respondJourneyTotalDays = 10;

export const respondDefaultCompletedMilestoneIds: string[] = [];
export const respondDefaultCurrentDay = 1;

export function buildRespondJourneyStages(completedIds: Set<string>, currentDay: number): JourneyStage[] {
  return buildStagesFromTemplate(respondJourneyTemplate, completedIds, currentDay, "respond" as ClientType);
}
