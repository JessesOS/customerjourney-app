import type { ClientType } from "@/lib/journeyEngine";

/**
 * "Ask AI" chips — Imprint-style example questions per stage, with scripted
 * answers. This is the placeholder generation of the assistant: real questions
 * clients actually ask, answered in an AI-chat-shaped bubble, so the UI shell
 * is already the one a live assistant plugs into later. Answers stay
 * process-oriented — they point at the portal, the tasks, and the team, and
 * promise nothing the journey templates don't already say.
 */
export type AskItem = { q: string; a: string };

const scaleAsk: Record<string, AskItem[]> = {
  onboarding: [
    {
      q: "How long does onboarding take?",
      a: "Onboarding is the first couple of days of your 30-day journey — mostly telling us about your business, plus a few access tasks. Knock them out in one sitting if you like; the moment they're done, our build starts.",
    },
    {
      q: "What if I can't find a login?",
      a: "No stress — complete what you can and leave a note on the task about the one that's stuck. Your account manager will help you track it down, and it won't hold up the rest of the build.",
    },
    {
      q: "Who sees what I submit?",
      a: "Only the RT Digital team working on your account. Your details go straight into building your campaigns and AI receptionist — nothing is shared outside your project.",
    },
  ],
  build: [
    {
      q: "When do my ads go live?",
      a: "Ads switch on at Go-Live, around day 30 of your journey. Build runs days 2–13 — you'll approve your campaigns and creative here first, so nothing goes live without your sign-off.",
    },
    {
      q: "What exactly am I approving?",
      a: "Your ad strategy, your creative assets, and how your AI receptionist speaks. Each approval task shows you the work below it — have a look, and approve or leave a note for changes.",
    },
    {
      q: "Can I ask for changes?",
      a: "Absolutely. Every approval task has a notes box — tell us what you'd like different and we'll revise before anything ships. It's your brand; we want it right.",
    },
  ],
  testing: [
    {
      q: "What happens in the test call?",
      a: "Around day 14 you'll call your own number and talk to your AI receptionist exactly as a customer would. You'll hear how it answers, books, and handles questions — before any real customer does.",
    },
    {
      q: "What if the AI gets something wrong?",
      a: "That's what the test is for. Note anything that sounds off — wording, pricing, how it handles a question — and we'll tune it before Go-Live.",
    },
  ],
  "go-live": [
    {
      q: "How do I know it's working?",
      a: "Your team gets a walkthrough as we switch on, and you'll see enquiries land in your CRM in real time. We're watching closely from our side through launch week.",
    },
    {
      q: "When will I see leads?",
      a: "Campaigns start delivering as soon as they're live, and lead flow typically builds over the first weeks as the ads optimise. Post-Launch is where we review the numbers together.",
    },
  ],
  "post-launch": [
    {
      q: "How do I read my results?",
      a: "We review performance with you — what's coming in, what it's costing, what we're tuning next. You don't need to decode dashboards alone; that's our job.",
    },
    {
      q: "How do I get help fast?",
      a: "Your dedicated Slack channel is the quickest line to the team, and your account manager is across everything. This portal always shows where things stand.",
    },
  ],
};

const respondAsk: Record<string, AskItem[]> = {
  onboarding: [
    {
      q: "How long does setup take?",
      a: "Respond runs on a 10-day journey. Onboarding is the first day or two — your business details and access — then we set up your AI receptionist behind the scenes.",
    },
    {
      q: "Who sees what I submit?",
      a: "Only the RT Digital team working on your account. Your details go straight into setting up your AI receptionist — nothing is shared outside your project.",
    },
  ],
  testing: [
    {
      q: "What happens in the test call?",
      a: "You'll call your own number and talk to your AI receptionist exactly as a customer would — how it answers, what it says, how it captures the enquiry — before any real customer hears it.",
    },
    {
      q: "What if the AI gets something wrong?",
      a: "That's what the test is for. Note anything that sounds off and we'll tune it before your system goes live.",
    },
  ],
  "go-live": [
    {
      q: "How do I know it's working?",
      a: "Your team gets a walkthrough as we switch on, and you'll see every caught call and enquiry in your CRM. We're watching closely from our side through launch.",
    },
    {
      q: "Does it answer every call?",
      a: "That's the point — your AI receptionist picks up when you can't, captures the job details, and nothing slips through to voicemail.",
    },
  ],
  "post-launch": [
    {
      q: "How do I get help fast?",
      a: "Your dedicated Slack channel is the quickest line to the team, and your account manager is across everything. This portal always shows where things stand.",
    },
  ],
};

export function askItemsFor(clientType: ClientType, stageId: string): AskItem[] {
  return (clientType === "respond" ? respondAsk : scaleAsk)[stageId] ?? [];
}
