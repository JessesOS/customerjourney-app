// BSS custom: Fin's side. The stages and the 21 client steps he sees in his
// portal, from section 4 of the spec ("What Fin needs to do": access,
// questions, assets, approvals, calls, tests) and the intake form in section 5.
//
// EVERY WORD HERE IS A DRAFT (Claude, 2026-10-17): all 21 steps are listed in
// draftCopy, so the product can't go live until Jesse approves the wording.
// Timings follow section 2 of the spec: week 1 starts on the day the client
// starts. Post-launch is ongoing: support runs to month 8.
// No kick-off call step for now (Jesse, 2026-10-18): its team task (bssc-a09)
// stays on the board, team-only.
// The portal opens one step at a time, so each stage's order puts what Fin can
// do straight away first (access, then the website draft that's ready now),
// and steps that wait on our work later. Steps that aren't approvals say what
// ticking them means (doneLabel); approvals keep "Approve & continue".

import type { StagePatch } from "../custom";
import type { ClientStep, StageId } from "../types";

const INVITE = "jesse@allconvos.ai";
const REVIEW_HUB = "https://bss-website-draft.vercel.app/review.html";
const NO_PASSWORDS = "Never send us a password, seed phrase or private key. An invite is all we need.";

export const bssCustomStages: Partial<Record<StageId, StagePatch>> = {
  onboarding: {
    name: "Onboard, map and evaluate",
    dayStart: 1,
    dayEnd: 14,
    blurb: "Weeks 1 and 2: give us access, answer a few questions and review your first website draft. Then we agree your customer journey before anything is built.",
    statusNotes: [],
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

/**
 * The questions step as a spoken interview: saved, not shown (Jesse,
 * 2026-10-18). Its clips are in public/portal/voice/interview-bssc-questions-<n>.m4a.
 */
export const bssCustomInterview: string[] = [
  "What's the best way and time to reach you? And does anyone else need to approve things?",
  "Who should get an alert when a new lead comes in, a hot lead turns up, or someone books a call?",
  "Which platform do you run your webinars on: Zoom Meetings, Zoom Webinars, or something else?",
  "How do you take payment after a sales call today?",
  "How does your partner and commission setup work at the moment?",
  "Should the new site have a Contact page? It wasn't in the agreement, so just tell us what you're thinking.",
  "Where are most of your contacts: Australia, the UK, the US, or a mix? And which social accounts should we connect?",
  "Where does your audience find you? Name every place you can think of.",
  "Who are your implementation coaches? Names are fine for now. We'll get their emails later.",
  "What are your goals for the next six months, in leads, calls and clients?",
  "How would you describe your tone of voice, in three words? And is there anything we should never say or promise?",
];

export const bssCustomSteps: { stage: StageId; step: ClientStep }[] = [
  // ── Onboard, map and evaluate (weeks 1-2) ──
  {
    stage: "onboarding",
    step: {
      // First (Jesse, 2026-10-18): bookmark the portal, then save it to the phone.
      id: "bssc-bookmark",
      title: "Bookmark your portal",
      detail: "This portal is where you'll find your next steps, your approvals and everything we need from you. Bookmark it so you can always get back here.",
      showPortalLink: true,
      steps: [
        "Press Cmd + D on a Mac (Ctrl + D on Windows) while you're on this page.",
        "Or copy your portal link above and save it somewhere handy.",
      ],
      doneLabel: "I've bookmarked it",
      clientOnly: true,
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "bssc-save-portal",
      title: "Save your portal to your phone",
      detail: "So you can get back here in one tap. Saved to your iPhone's home screen, it opens like an app.",
      steps: [
        "On your iPhone, open your portal link in Safari (even if you usually use Chrome).",
        "Tap the Share button: the square with an arrow pointing up, at the bottom of the screen.",
        "Scroll down, tap \"Add to Home Screen\", then tap \"Add\".",
        "From now on, open BSS Launchpad from your home screen.",
      ],
      imageUrl: "/portal/guides/bss-home-screen-app.png",
      imageAlt: "An iPhone home screen with the BSS Launchpad icon, and the portal open full screen like an app.",
      doneLabel: "I've saved it",
      clientOnly: true,
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "bssc-access-site",
      title: "Give Jesse access to your website and app",
      detail: "We build your new pages inside your existing site, so nothing you already have breaks. Invite Jesse to each of these.",
      important: NO_PASSWORDS,
      inviteEmail: INVITE,
      steps: [
        "Lovable (your website): add jesse@allconvos.ai to your project, or connect it to GitHub and add Jesse there.",
        "Supabase (your app's database): add Jesse as a team member, so we can see what your current system stores.",
      ],
      doneLabel: "I've sent the invites",
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
      doneLabel: "I've answered the questions",
      notePrompt: "Anything else you'd like changed?",
    },
  },
  {
    stage: "onboarding",
    step: {
      // Right after the review (Jesse, 2026-10-18): the review page takes typed
      // answers only, so the files it asks for are uploaded here, with the two
      // things it doesn't ask about.
      id: "bssc-assets",
      title: "Send the files for your website",
      detail: "Your review page asks for a few photos and files. Upload them here, along with two things it doesn't ask about. Answer the questions themselves on the review page.",
      hasUpload: true,
      steps: [
        "New testimonials, with each client's permission to use them (review question 4).",
        "Sean Clarke's original photo, and his logo if he has one (review question 12).",
        "Your privacy policy wording, if you're providing it (review question 25).",
        "For each other partner: name, photo or logo, and a welcome message.",
        "Your current email or text wording, and your booking link.",
      ],
      notePrompt: "Anything still to come?",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "bssc-questions",
      title: "Answer a few questions about how you work",
      detail: "One quick question at a time, and it saves as you go. Your answers shape your CRM, your text messages and your AI lead agent.",
      // The guided form. The voice interview is hidden for now (Jesse,
      // 2026-10-18): to offer "type or talk" again, add
      // `interview: bssCustomInterview` (and an ElevenLabs `interviewAgentId`
      // for a free-flowing conversation once Jesse has set up its prompt).
      formId: "bss-custom-intake-v1",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "bssc-access-tools",
      title: "Give Jesse access to your other tools",
      detail: "So we can check what's there and connect it all to your CRM. Invite Jesse to each one you use, and tell us below about anything you couldn't.",
      important: NO_PASSWORDS,
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
      doneLabel: "I've sent the invites",
      notePrompt: "Anything you couldn't invite us to?",
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
      id: "bssc-review-2",
      title: "Review your updated website",
      detail: "Your first changes are done. Check the updated review page and tell us what's left. We aim to finish in two rounds, with a third if you need it.",
      guideUrl: REVIEW_HUB,
      guideLabel: "Open the review page",
      doneLabel: "I've sent my feedback",
      notePrompt: "What's left to change?",
    },
  },
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
      id: "bssc-contacts",
      title: "Check your contacts before we import them",
      detail: "We gather your contacts from your current systems, remove duplicates and tag them by where they came from. Tell us which ones agreed to hear from you, then we check 20 records together.",
      doneLabel: "I've checked my contacts",
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
      id: "bssc-launch-day",
      title: "Agree your launch day",
      detail: "We launch your new website on your domain on a day that suits you. Your current site stays live until then.",
      doneLabel: "Send my preferred day",
      notePrompt: "Your preferred launch day",
      notePlaceholder: "e.g. a weekday morning",
    },
  },
  {
    stage: "testing",
    step: {
      id: "bssc-test-booking",
      title: "Book a test Clarity Call through your new site",
      detail: "Go through the booking quiz like a real lead and book a test call in Calendly. Check it lands in your CRM and you get the right emails.",
      doneLabel: "I've booked a test call",
      notePrompt: "Anything that didn't work as expected?",
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
      id: "bssc-live-check",
      title: "Click through your live site",
      detail: "On launch day, click through every page and book a test call. Tell us anything that looks wrong.",
      doneLabel: "I've checked the site",
      notePrompt: "Anything that looks wrong?",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "bssc-walkthrough",
      title: "Your launch walkthrough",
      detail: "A recorded session for you and your coaches: the inbox, pipeline, contact records, bookings and dashboard. A short written guide follows, including how to edit your website.",
      doneLabel: "Send my times",
      notePrompt: "Days and times that suit you",
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
      doneLabel: "I've done these",
      notePrompt: "Anything you'd like changed?",
    },
  },
  {
    stage: "post-launch",
    step: {
      id: "bssc-onboarding-map",
      title: "Agree your client onboarding map",
      detail: "What happens when someone pays: welcome, portal access, their coach and their first implementation call. Each step is marked \"automated\" or \"needs you\". We walk through it together, then you approve it here.",
      steps: ["Set up a test account for Jesse in your members' area, so we can link new clients straight to it."],
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
      doneLabel: "Got it",
      notePrompt: "Anything you'd like to cover?",
    },
  },
];
