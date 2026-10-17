// Scale portal settings: the voice guide, the Ask-AI answers, the step
// features and the String Theory plan for "BSS Meta ads only".
//
// Copied verbatim from lib/stageGuide.ts, lib/askAi.ts, lib/stringPlans.ts and
// app/api/admin/journey-status/route.ts on 2026-10-17. The portal reads them
// from here; npm run check:journeys freezes what clients see.

import type { AskItem, StringPlan } from "../../lib/journeyTypes";
import type { ProductFeatures, StageId, VoiceGuide } from "../types";

/**
 * Per-stage voice-guide scripts (Imprint-style breathing orb + narration).
 * The caption bubble shows this exact text while the audio plays, so script
 * and audio must be regenerated together (python3 scripts/generate-voice.py).
 * Audio: public/portal/voice/scale-<stage>.m4a.
 */
const scaleScripts: Partial<Record<StageId, string>> = {
  onboarding:
    "Welcome aboard — great to have you. This first stage is about getting the essentials from you: your business details, account access, and branding. Work through the tasks at your own pace, and we'll take it from there.",
  build:
    "This is where we get to work. Behind the scenes we're building your campaigns, your creative, and your AI receptionist. You'll see a few approvals land here — that's your chance to shape anything before it goes live.",
  testing:
    "Nearly there. This stage is one big dress rehearsal — you'll take a live test call from your AI receptionist and make sure everything feels right before launch.",
  "go-live":
    "It's launch day. Your campaigns switch on and real enquiries start flowing in. We'll walk your team through everything, and we're watching closely from our side.",
  "post-launch":
    "You're live — nice work getting here. From now on it's about performance: we review the numbers, tune what's working, and stay in your corner. Anything you need, we're one message away.",
};

export const scaleVoiceGuide: VoiceGuide = { audioPrefix: "scale", scripts: scaleScripts };

/**
 * "Ask AI" chips: example questions per stage, with scripted answers. Answers
 * stay process-oriented and promise nothing the journey doesn't already say.
 * Note: they quote Scale's days (30-day journey, build days 2–13, test day 14).
 */
export const scaleAskAi: Partial<Record<StageId, AskItem[]>> = {
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
      a: "Only the team working on your account. Your details go straight into building your campaigns and AI receptionist — nothing is shared outside your project.",
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

export const scaleFeatures: ProductFeatures = {
  // ts-2 "Test your AI receptionist live" shows the live AI receptionist test.
  playgroundSteps: ["ts-2"],
  // The receptionist test chats with the qualification script written on ob-3.
  receptionistScriptStep: "ob-3",
  // bd-g2 approves a REAL page: a live preview of /portal/<token>/landing.
  landingPreviewSteps: ["bd-g2"],
  /** Tasks that gate quality but should never stop a client moving on. */
  nonBlockingSteps: [
    "ob-6",    // connect calendar
    "ob-6b",   // connect social
    "ob-6c",   // payment mechanism
    "ob-crm",  // CRM login
    "ob-7",    // past leads CSV
    "bd-3",    // Meta partner access
    "bd-g1",   // Google Ads account link
  ],
};

// Scale — Meta ads only, used by "BSS Meta ads only" (Jesse, 2026-10-16). The
// strands group the Scale tasks; their days are the journey's own stage days
// (onboarding days 1–2, build 2–13, test day 14, go-live day 30, check-ins after).
// Google-only and hidden tasks simply don't appear (they aren't in the client's journey).
export const scaleMetaStringPlan: StringPlan = {
  weeks: 5,
  goLiveDay: 30,
  tailLabel: "→ ongoing",
  workstreams: [
    { id: "intake", name: "Interview & intake", dayStart: 1, dayEnd: 2, taskIds: ["ob-0", "ob-1", "ob-2"] },
    { id: "approvals", name: "Your approvals", dayStart: 1, dayEnd: 2, taskIds: ["ob-3", "ob-5"], after: ["intake"] },
    { id: "connect", name: "Apps & connections", dayStart: 1, dayEnd: 2, taskIds: ["ob-4", "ob-crm", "ob-6", "ob-6b", "ob-6c", "ob-7"], after: ["intake"] },
    { id: "campaigns", name: "Meta campaign build", dayStart: 2, dayEnd: 13, taskIds: ["bd-1", "bd-2", "bd-3"], after: ["approvals"] },
    { id: "testing", name: "Live test", dayStart: 14, dayEnd: 14, taskIds: ["ts-1", "ts-2", "ts-3"], after: ["campaigns", "connect"] },
    { id: "golive", name: "Go-live", dayStart: 30, dayEnd: 30, taskIds: ["gl-1", "gl-2", "gl-3", "gl-4", "gl-5"], after: ["testing"] },
    { id: "checkins", name: "Check-ins & support", dayStart: 31, dayEnd: 35, ongoing: true, taskIds: ["pl-1", "pl-2", "pl-3"], after: ["golive"] },
  ],
};
