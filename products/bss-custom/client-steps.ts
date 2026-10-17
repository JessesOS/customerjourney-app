// BSS custom: Fin's side. The stages and the 21 client steps he sees in his
// portal, from section 4 of the spec ("What Fin needs to do": access,
// questions, assets, approvals, calls, tests) and the intake form in section 5.
//
// EVERY WORD HERE IS A DRAFT (Claude, 2026-10-17): all 21 steps are listed in
// draftCopy, so the product can't go live until Jesse approves the wording.
// Timings follow section 2 of the spec: week 1 starts on the day the client
// starts. Post-launch is ongoing: support runs to month 8.

import type { StagePatch } from "../custom";
import type { ClientStep, StageId } from "../types";

const INVITE = "jesse@allconvos.ai";
const REVIEW_HUB = "https://bss-website-draft.vercel.app/review.html";

export const bssCustomStages: Partial<Record<StageId, StagePatch>> = {
  onboarding: {
    name: "Onboard, map and evaluate",
    dayStart: 1,
    dayEnd: 14,
    blurb: "Weeks 1 and 2: give us access, answer a few questions and review your first website draft. Then we agree your customer journey before anything is built.",
    statusNotes: ["We only ever ask for invites. Never send us a password, seed phrase or private key."],
  },
  build: {
    name: "Build",
    dayStart: 8,
    dayEnd: 28,
    blurb: "Weeks 2 to 4: your website is finished page by page, and your CRM is set up and loaded with your contacts.",
    statusNotes: [],
  },
  testing: {
    name: "Connect",
    dayStart: 29,
    dayEnd: 35,
    blurb: "Week 5: your forms, chat, phone, texting, social channels and Calendly are connected to your CRM and tested.",
    statusNotes: [],
  },
  "go-live": {
    name: "Automate and launch",
    dayStart: 36,
    dayEnd: 42,
    blurb: "Week 6: your new website launches on your domain. Your follow-up messages and AI lead agent switch on once you've approved them.",
    statusNotes: [],
  },
  "post-launch": {
    name: "Partners, webinar and support",
    dayStart: 43,
    dayEnd: 240,
    ongoing: true,
    blurb: "Weeks 7 to 10 add partner tracking, your weekly webinar and client onboarding. Then we review, tune and support you through month 8.",
    statusNotes: [],
  },
};

export const bssCustomSteps: { stage: StageId; step: ClientStep }[] = [
  // ── Onboard, map and evaluate (weeks 1-2) ──
  {
    stage: "onboarding",
    step: {
      id: "bssc-kickoff",
      title: "Your kick-off call",
      detail: "About 45 minutes with Jesse. We agree your goals, who approves what, and the best way to reach each other.",
      notePrompt: "Days and times that suit you",
      notePlaceholder: "e.g. Tuesday or Wednesday afternoon",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "bssc-access-site",
      title: "Give Jesse access to your website and app",
      detail: "We build your new pages inside your existing site, so nothing you already have breaks. Invite Jesse to each of these. Never send a password: an invite is all we need.",
      inviteEmail: INVITE,
      steps: [
        "Lovable (your website): add jesse@allconvos.ai to your project, or connect it to GitHub and add Jesse there.",
        "Supabase (your app's database): add Jesse as a team member, so we can see what your current system stores.",
        "Your existing client portal: invite Jesse as a test client, so new clients can be pointed to it.",
      ],
      notePrompt: "Anything you couldn't invite us to?",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "bssc-access-tools",
      title: "Give Jesse access to your other tools",
      detail: "So we can check what's there and connect it all to your CRM. Invite Jesse to each one you use. Never send a password.",
      inviteEmail: INVITE,
      steps: [
        "GoHighLevel: add Jesse as an admin user on your current sub-account.",
        "Calendly: invite Jesse as an admin, once your account is set up.",
        "Zoom (if you run webinars on it): add Jesse as an admin, or tell us your plan type.",
        "Payments (for example Stripe): give Jesse access, so a confirmed payment can start client onboarding.",
        "Meta (Instagram and Facebook): add Jesse to your Meta Business account.",
        "YouTube (optional): add Jesse as a channel manager.",
        "Porkbun and Cloudflare (your domain): add Jesse, or be ready to add a few records we send you.",
      ],
      notePrompt: "Anything you couldn't invite us to?",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "bssc-review-1",
      title: "Review your website draft",
      detail: "Every new page sits next to your current one, with 26 numbered questions. Your answers save as you type, and Jesse sees them straight away.",
      guideUrl: REVIEW_HUB,
      guideLabel: "Open the review page",
      notePrompt: "Anything else you'd like changed?",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "bssc-questions",
      title: "Answer a few questions about how you work",
      detail: "Short answers are fine. They shape your CRM, your text messages and your AI lead agent.",
      steps: [
        "Which platform do you run webinars on: Zoom Meetings or Zoom Webinars?",
        "How do you take payment after a sales call?",
        "How does your partner and commission setup work today?",
        "Which social accounts should we connect?",
        "Where are most of your contacts: Australia, the UK or the US? This decides how text messaging is registered.",
        "Who should get alerts for new leads, hot leads and bookings?",
        "Who are your implementation coaches (names and emails)?",
        "Which contacts have agreed to hear from you? Only they get the reactivation text.",
        "Should a Contact page be part of the site? It wasn't in the agreement, so Jesse will talk it through with you.",
        "The best way and times to reach you.",
        "Who else approves things, if anyone.",
        "Your goals for the next 6 months: leads, calls and clients.",
        "Anything you never want said or promised.",
        "Your tone of voice, in three words.",
        "Links to every place your audience finds you.",
      ],
      notePrompt: "Your answers",
      notePlaceholder: "Number them to match the questions",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "bssc-assets",
      title: "Send us your website content",
      detail: "Upload what you have below. For anything still to come, just tell us when to expect it.",
      hasUpload: true,
      steps: [
        "New testimonials, with each client's written permission to use them on your website.",
        "Confirm that \"Featured on\" is right for Bitcoin MENA and Bitcoin Magazine.",
        "Sean Clarke's original photo (and logo, if any), plus his OK on any wording change.",
        "For each other partner: name, photo or logo, and a welcome message.",
        "Your privacy policy wording, or your OK on a draft from us.",
        "Your existing email or text wording, and your booking link.",
      ],
      notePrompt: "Anything still to come?",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "bssc-journey-map",
      title: "Approve your customer journey and our findings",
      detail: "We map every step from first contact to paying client, and look at what you have today. We walk you through it on a call, then you approve it here. Nothing is built on it until you do.",
      hasEditableContent: true,
      steps: [
        "The customer journey map: first contact, follow-up, booking, sales call, new client and onboarding.",
        "Our findings and recommendation: what to keep, move or replace, and which GoHighLevel account to use.",
        "Your partner tracking plan: how partners are added, tracked and paid.",
      ],
      notePrompt: "Anything you'd like changed?",
    },
  },

  // ── Build (weeks 2-4) ──
  {
    stage: "build",
    step: {
      id: "bssc-crm-plan",
      title: "Approve your CRM plan",
      detail: "One page: your pipelines, the details we store on each contact, your tags and how leads are scored. Approve it, or tell us what to change.",
      hasEditableContent: true,
      notePrompt: "Anything you'd like changed?",
    },
  },
  {
    stage: "build",
    step: {
      id: "bssc-review-2",
      title: "Review your updated website",
      detail: "Your first changes are done. Check the updated review page and tell us what's left. We aim to finish in two rounds, with a third if you need it.",
      guideUrl: REVIEW_HUB,
      guideLabel: "Open the review page",
      notePrompt: "What's left to change?",
    },
  },
  {
    stage: "build",
    step: {
      id: "bssc-contacts",
      title: "Check your contacts before we import them",
      detail: "We gather your contacts from your current systems, remove duplicates and tag them by where they came from. Tell us which ones agreed to hear from you, then we check 20 records together.",
      notePrompt: "Which contacts agreed to hear from you?",
    },
  },
  {
    stage: "build",
    step: {
      id: "bssc-signoff",
      title: "Sign off each page for launch",
      detail: "A final preview of every page. Once you sign off, we rebuild the pages inside your Lovable site, ready for launch day.",
      notePrompt: "Any page you're not ready to sign off?",
    },
  },

  // ── Connect (week 5) ──
  {
    stage: "testing",
    step: {
      id: "bssc-test-booking",
      title: "Book a test Clarity Call through your new site",
      detail: "Go through the booking quiz like a real lead and book a test call in Calendly. Check it lands in your CRM and you get the right emails.",
      notePrompt: "Anything that didn't work as expected?",
    },
  },
  {
    stage: "testing",
    step: {
      id: "bssc-launch-day",
      title: "Agree your launch day",
      detail: "We launch your new website on your domain on a day that suits you. Your current site stays live until then.",
      notePrompt: "Your preferred launch day",
      notePlaceholder: "e.g. a weekday morning",
    },
  },

  // ── Automate and launch (week 6) ──
  {
    stage: "go-live",
    step: {
      id: "bssc-messages",
      title: "Approve your emails and texts",
      detail: "We write every message in your voice, using only claims you've approved. You approve each one here. We send a test to your inbox and phone, then switch it on.",
      hasEditableContent: true,
      notePrompt: "Any changes?",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "bssc-ai-agent",
      title: "Try your AI lead agent",
      detail: "Chat with it like a lead would. It only uses wording you've approved, never gives financial advice and never asks for seed phrases, keys or passwords. Send us real questions your audience asks, then approve it when you're happy.",
      notePrompt: "Real questions your audience asks",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "bssc-walkthrough",
      title: "Your launch walkthrough",
      detail: "A recorded session for you and your coaches: the inbox, pipeline, contact records, bookings and dashboard. A short written guide follows, including how to edit your website.",
      notePrompt: "Days and times that suit you",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "bssc-live-check",
      title: "Click through your live site",
      detail: "On launch day, click through every page and book a test call. Tell us anything that looks wrong.",
      notePrompt: "Anything that looks wrong?",
    },
  },

  // ── Partners, webinar and support (weeks 7-10, then to month 8) ──
  {
    stage: "post-launch",
    step: {
      id: "bssc-webinar",
      title: "Get your weekly webinar ready",
      detail: "Your webinar pages, reminders and follow-ups are set up to repeat each week.",
      steps: [
        "Send us a link to a short welcome video for the \"You're registered\" page.",
        "Tell us if you want replays, and for how long.",
        "Register for a test webinar and check the emails and texts you get.",
      ],
      notePrompt: "Anything you'd like changed?",
    },
  },
  {
    stage: "post-launch",
    step: {
      id: "bssc-onboarding-map",
      title: "Agree your client onboarding map",
      detail: "What happens when someone pays: welcome, portal access, their coach and their first implementation call. Each step is marked \"automated\" or \"needs you\". We walk through it together, then you approve it here.",
      hasEditableContent: true,
      notePrompt: "Anything you'd like changed?",
    },
  },
  {
    stage: "post-launch",
    step: {
      id: "bssc-reactivation",
      title: "Approve your reactivation text",
      detail: "Two short texts to past contacts who agreed to hear from you. You approve both messages and the list they go to.",
      hasEditableContent: true,
      notePrompt: "Any changes?",
    },
  },
  {
    stage: "post-launch",
    step: {
      id: "bssc-check-ins",
      title: "Monthly check-ins",
      detail: "Once a month through month 8 we look at your leads, bookings, sales and AI conversations together, and tune what isn't working.",
      notePrompt: "Anything you'd like to cover?",
    },
  },
];
