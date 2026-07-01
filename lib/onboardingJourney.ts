export type MilestoneStatus = "done" | "current" | "upcoming";

export type JourneyMilestone = {
  id: string;
  title: string;
  detail: string;
  status: MilestoneStatus;
};

export type StageStatus = "done" | "current" | "locked";

export type JourneyStage = {
  id: string;
  name: string;
  dayStart: number;
  dayEnd: number;
  status: StageStatus;
  milestones: JourneyMilestone[];
  statusNotes: string[];
};

export const journeyStages: JourneyStage[] = [
  {
    id: "onboarding",
    name: "Onboarding",
    dayStart: 1,
    dayEnd: 2,
    status: "done",
    milestones: [
      { id: "ob-1", title: "Complete your onboarding form", detail: "Business info, proof of address, domain & website access, branding.", status: "done" },
      { id: "ob-2", title: "Attend your Welcome Call & portal walkthrough", detail: "Live walkthrough of your portal, milestones, and messaging center.", status: "done" },
      { id: "ob-3", title: "Review & approve your AI receptionist's questions", detail: "Confirm the qualification questions your AI will ask incoming leads.", status: "done" },
      { id: "ob-4", title: "Download the mobile app", detail: "Get the LeadConnector app so you never miss a lead.", status: "done" },
      { id: "ob-5", title: "Review your SMS/Email message copy", detail: "Approve the messaging your AI will send on your behalf.", status: "done" },
      { id: "ob-6", title: "Connect your calendar, social accounts & payment method", detail: "Needed so your AI can book appointments and take payments.", status: "done" },
      { id: "ob-7", title: "Upload your past leads (CSV)", detail: "Helps train your AI on what a good lead looks like for you.", status: "done" },
      { id: "ob-8", title: "Grant access to your accounts", detail: "Google My Business, domain, and website builder access.", status: "done" },
    ],
    statusNotes: ["Your subscription fees begin 14-30 days from purchase."],
  },
  {
    id: "build",
    name: "Build",
    dayStart: 2,
    dayEnd: 13,
    status: "current",
    milestones: [
      { id: "bd-1", title: "Review & approve your eBook lead magnet content", detail: "We've drafted your lead magnet — take a look and approve it.", status: "done" },
      { id: "bd-2", title: "Approve your Meta ad campaigns & creative assets", detail: "Your ad strategy and creatives are ready for sign-off.", status: "current" },
      { id: "bd-3", title: "Grant RT Digital partner access to your Meta Business Suite", detail: "Add us as a Partner so we can launch your campaigns.", status: "upcoming" },
      { id: "bd-4", title: "Watch your ad campaign walkthrough video", detail: "A short video showing exactly what's going live.", status: "upcoming" },
    ],
    statusNotes: ["Your AI receptionist is being configured.", "Your CRM access is being set up."],
  },
  {
    id: "testing",
    name: "Testing",
    dayStart: 14,
    dayEnd: 14,
    status: "locked",
    milestones: [
      { id: "ts-1", title: "Confirm your connections are working", detail: "Quick check that your app, calendar & social accounts are linked.", status: "upcoming" },
      { id: "ts-2", title: "Test your AI receptionist live", detail: "Try to stump it — this is how we make it better.", status: "upcoming" },
      { id: "ts-3", title: "Your Go-Live Call is scheduled", detail: "We'll lock in your Day 30 walkthrough.", status: "upcoming" },
    ],
    statusNotes: ["We'll fine-tune your AI based on your test feedback."],
  },
  {
    id: "go-live",
    name: "Go-Live",
    dayStart: 30,
    dayEnd: 30,
    status: "locked",
    milestones: [
      { id: "gl-1", title: "Attend your Go-Live walkthrough call", detail: "We'll get your team confident using the live system.", status: "upcoming" },
      { id: "gl-2", title: "Learn your live system", detail: "Calls, texts, missed-call handling — all in one app.", status: "upcoming" },
      { id: "gl-3", title: "See your AI in action", detail: "Live call summaries, coaching notes, and lead handling.", status: "upcoming" },
      { id: "gl-4", title: "Set your team's usage standards", detail: "How your team should use the app day-to-day.", status: "upcoming" },
      { id: "gl-5", title: "You're live — access your recording & support links", detail: "Everything you need, in one message.", status: "upcoming" },
    ],
    statusNotes: [],
  },
  {
    id: "post-launch",
    name: "Post-Launch",
    dayStart: 31,
    dayEnd: 30,
    status: "locked",
    milestones: [
      { id: "pl-1", title: "Your Week 1 & Week 2 check-in calls", detail: "We'll check in to make sure everything's running smoothly.", status: "upcoming" },
      { id: "pl-2", title: "Send us a testimonial", detail: "We'd love to hear how it's going.", status: "upcoming" },
    ],
    statusNotes: ["Your account is being actively monitored — performance reports available monthly."],
  },
];

export const journeyCurrentDay = 12;
export const journeyTotalDays = 30;

export function journeyProgressPercent(): number {
  return Math.round((journeyCurrentDay / journeyTotalDays) * 100);
}
