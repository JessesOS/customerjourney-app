// Respond (CRM) portal settings: the voice guide, the Ask-AI answers and the
// step features.
//
// Copied verbatim from lib/stageGuide.ts and lib/askAi.ts on 2026-10-17. The
// portal reads them from here; npm run check:journeys freezes what clients see.

import type { AskItem } from "../../lib/journeyTypes";
import type { ProductFeatures, StageId, VoiceGuide } from "../types";

/** Per-stage voice-guide scripts. Audio: public/portal/voice/respond-<stage>.m4a. */
const respondScripts: Partial<Record<StageId, string>> = {
  onboarding:
    "Welcome aboard — great to have you. This first stage is about the essentials: your business details and access, so we can set up your AI receptionist. Work through the tasks at your own pace.",
  testing:
    "We're setting up your AI receptionist and CRM behind the scenes. The main event here is a live test call — you'll hear it in action before a single customer does.",
  "go-live":
    "It's launch day. Your AI receptionist switches on and starts catching every call. We'll walk your team through everything.",
  "post-launch":
    "You're live — nice work getting here. From here we keep an eye on things, fine-tune, and stay in your corner. Anything you need, we're one message away.",
};

export const respondVoiceGuide: VoiceGuide = { audioPrefix: "respond", scripts: respondScripts };

/** "Ask AI" chips: example questions per stage, with scripted answers (they quote Respond's 10-day journey). */
export const respondAskAi: Partial<Record<StageId, AskItem[]>> = {
  onboarding: [
    {
      q: "How long does setup take?",
      a: "Respond runs on a 10-day journey. Onboarding is the first day or two — your business details and access — then we set up your AI receptionist behind the scenes.",
    },
    {
      q: "Who sees what I submit?",
      a: "Only the team working on your account. Your details go straight into setting up your AI receptionist — nothing is shared outside your project.",
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

export const respondFeatures: ProductFeatures = {
  // rsp-048 "Test your AI receptionist live" shows the live AI receptionist test.
  playgroundSteps: ["rsp-048"],
  // The receptionist test chats with the qualification script written on rsp-018.
  receptionistScriptStep: "rsp-018",
};
