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
  blurb?: string;
  milestones: JourneyMilestone[];
};

export const journeyStages: JourneyStage[] = [
  {
    id: "kickoff",
    name: "Kickoff & Access",
    dayStart: 1,
    dayEnd: 2,
    status: "done",
    milestones: [],
  },
  {
    id: "connect",
    name: "Connect Meta & CRM",
    dayStart: 3,
    dayEnd: 7,
    status: "done",
    milestones: [],
  },
  {
    id: "qualification",
    name: "Refine AI Qualification",
    dayStart: 8,
    dayEnd: 12,
    status: "current",
    blurb: "Dial in how Sophie qualifies your leads before they ever reach your team.",
    milestones: [
      {
        id: "m1",
        title: "Review Sophie's intro script",
        detail: "This is the first thing Sophie says when a new lead replies. Make sure it sounds like you.",
        status: "done",
      },
      {
        id: "m2",
        title: "Approve your 6 pre-qualification questions",
        detail:
          "These are the questions Sophie asks — one at a time — to qualify a lead before it ever reaches you.",
        status: "current",
      },
      {
        id: "m3",
        title: "Record a 2-min Loom on your ideal customer",
        detail: "A quick, casual video so Sophie learns exactly who you want to win.",
        status: "upcoming",
      },
    ],
  },
  {
    id: "launch",
    name: "Launch Campaigns",
    dayStart: 13,
    dayEnd: 16,
    status: "locked",
    milestones: [],
  },
  {
    id: "nurture",
    name: "Nurture & Cadence Setup",
    dayStart: 17,
    dayEnd: 20,
    status: "locked",
    milestones: [],
  },
  {
    id: "booking",
    name: "Booking & Calendar Sync",
    dayStart: 21,
    dayEnd: 24,
    status: "locked",
    milestones: [],
  },
  {
    id: "handoff",
    name: "Team Handoff Training",
    dayStart: 25,
    dayEnd: 28,
    status: "locked",
    milestones: [],
  },
  {
    id: "go-live",
    name: "Go Live & Optimize",
    dayStart: 29,
    dayEnd: 30,
    status: "locked",
    milestones: [],
  },
];

export const qualificationQuestions = [
  "What's the project you're looking to get done?",
  "Whereabouts are you based?",
  "What's your rough budget range?",
  "When are you hoping to get started?",
  "Is this for your home or a business?",
  "Have you got other quotes yet?",
];

export const behindTheScenesItems = [
  { label: "Meta ad campaigns", detail: "benchmark + consult-offer angles", state: "Live" as const },
  { label: "TradeAI CRM & pipeline", detail: "instant lead routing & tagging", state: "Live" as const },
  { label: "Sophie · your AI agent", detail: "qualification & nurture", state: "Building" as const },
  { label: "Nurture cadences", detail: "SMS + email follow-up", state: "Building" as const },
  { label: "Booking & calendar sync", detail: "direct appointment booking", state: "Queued" as const },
];

export const journeyCurrentDay = 12;
export const journeyTotalDays = 30;

export function journeyProgressPercent(): number {
  return Math.round((journeyCurrentDay / journeyTotalDays) * 100);
}

export function completedStageCount(): number {
  return journeyStages.filter((s) => s.status === "done").length;
}
