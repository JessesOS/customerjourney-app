// Tiny ROR (Luisa): the client's side. 23 steps in five stages, from
// spec.md (Luisa's 22-item checklist, plus a bookmark step). Jesse OK'd the
// list on 2026-11-08.
//
// EVERY WORD HERE IS A DRAFT (Claude): all steps are in draftCopy.
// Rules from the spec: step 1 is the meeting with Jesse. Jesse drafts the
// child safe policy and the consent form; Luisa checks them. Stripe, Meta and
// Google she sets up herself: never ask for a password or a key.
// Brand: "ror", never "roar". No outcome promises.

import type { StagePatch } from "../custom";
import type { ClientStep, StageId } from "../types";

const FILES = { choose: "Click to choose your files", chooseMore: "+ Add more files", stayOpen: true } as const;
const NO_PASSWORDS = "Never send me a password, a key or a bank login. Not here, not on WhatsApp. You set this up yourself and keep the logins to yourself.";

const INTERVIEW_QUESTIONS = [
  "YOU AND WHY. 1. What happened in your own life that led you to counselling? 2. When did you first think, \"kids this little need this\"? Tell me about that moment. 3. What does ROR (Raw, Open, Ready) mean to you? 4. What do you wish you'd known when your boys were 4 to 6?",
  "THE PARENTS YOU'RE FOR. 5. Describe the parent who walks in your door. What's their week like? 6. What do parents say to you when they're at the end of their rope? Their actual words. 7. What have they usually tried already that hasn't worked? 8. What are parents scared of, or embarrassed about, when it comes to their child's big feelings? 9. What do they want to feel by the end of a term?",
  "THE KIDS. 10. Tell me about a \"spicy\" child, a \"sparkly\" child, an \"energy bunny\" and a quiet one. How does each one show big feelings? 11. What does a shy child need on their first day? 12. What's a moment with a child you'll never forget? (No names.)",
  "THE TOOLS AND THE CLASS. 13. Walk me through a class, from the moment they arrive to the moment they leave. 14. Pick 3 tools. For each one: what's it called, what's it for, and how would you explain it to a 4-year-old? 15. Why play, clay and paint, and not sitting down and talking? 16. Why two weeks per tool? Why a term at a time? 17. What goes in the take-home guide? What should a parent do with it?",
  "TRUST AND THE HARD QUESTIONS. 18. How is this different from therapy? When would you send a family somewhere else? 19. What would you say to a parent who thinks their child is \"too much\" for a group? 20. What can a parent honestly expect after one term? What won't change? 21. How do you keep kids safe and the room calm with 10 little ones?",
  "QUICK-FIRE. 22. Finish this: \"Tiny ROR is for the parent who…\" 23. Finish this: \"Let them ror means…\" 24. One thing a parent could try tonight with a big feeling. How would you teach it in 30 seconds? 25. Anything I haven't asked that parents should know?",
];

export const tinyRorStages: Partial<Record<StageId, StagePatch>> = {
  onboarding: {
    name: "This week",
    dayStart: 1,
    dayEnd: 7,
    blurb: "Meet me this week and record your interview. Those two get everything else moving.",
    statusNotes: [],
  },
  build: {
    name: "Must-haves before we launch",
    dayStart: 1,
    dayEnd: 14,
    blurb: "The details nothing can launch without: your venue, your checks and insurance, and the policies parents will ask about. I draft the child safe policy and the consent form. You check them.",
    statusNotes: [],
  },
  testing: {
    name: "The offer",
    dayStart: 3,
    dayEnd: 14,
    blurb: "How your classes work, what your tools are called, the prices, and a few local parents I can talk to.",
    statusNotes: [],
  },
  "go-live": {
    name: "Accounts to set up",
    dayStart: 7,
    dayEnd: 21,
    blurb: "Your domain, your pages and the accounts for payments and ads. You own every one of them. Never send me a password.",
    statusNotes: [],
  },
  "post-launch": {
    name: "Photos",
    dayStart: 14,
    dayEnd: 30,
    blurb: "Real families and real you, for the website and the ads. Every family signs the consent form first.",
    statusNotes: [],
  },
};

export const tinyRorSteps: { stage: StageId; step: ClientStep }[] = [
  // ── This week ──
  {
    stage: "onboarding",
    step: {
      // PLACEHOLDER link: Jesse's AT kickoff booking page (45 min) until he makes a
      // one-hour Tiny ROR page. Swap it before prod.
      id: "tror-book",
      bookingUrl: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1zFdYaXgf5lDqGZ8rLV9KPdB1nNec8ZbfcHcmXT7Bj51LstiAWeQvjG-26D1PxlPcvQ9-lxgdP",
      title: "Book a time with me this week",
      detail: "About an hour, to go through this whole list together. Pick any time this week that suits you.",
      steps: [
        "Pick a time on the booking page below. You get a calendar invite straight away.",
        "Bring anything you already have: your ABN, your Working With Children Check, your insurance.",
      ],
      notePrompt: "Anything you want to cover when we meet? (optional)",
      doneLabel: "I've booked it",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "tror-interview",
      title: "Record your interview",
      detail: "About 45 minutes. A voice memo is fine, a video is even better. Talk the way you'd talk to a parent. Stories are gold. Skip any question you don't want to answer. Your words become the website, the ads and the posts.",
      steps: INTERVIEW_QUESTIONS,
      hasUpload: true,
      uploadOptions: { accept: ".m4a,.mp3,.wav,.aac,.mp4,.mov,.zip", title: "Upload your recording", hint: "Files up to 25MB. A longer recording: put it in Google Drive or Dropbox and paste the link below.", ...FILES },
      notePrompt: "Or paste a link to your recording",
      notePlaceholder: "https://drive.google.com/...",
      doneLabel: "I've sent it",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "tror-bookmark",
      title: "Bookmark your portal",
      detail: "This portal is where your Tiny ROR to-do list lives. Bookmark it so you can always get back here.",
      showPortalLink: true,
      steps: [
        "Press Cmd + D on a Mac (Ctrl + D on Windows) while you're on this page.",
        "On your phone, copy your portal link above and save it somewhere handy.",
      ],
      doneLabel: "I've bookmarked it",
      clientOnly: true,
    },
  },

  // ── Must-haves before we launch ──
  {
    stage: "build",
    step: {
      id: "tror-venue",
      title: "Your venue",
      detail: "Where the Ballina classes and the tasters will run. Parents will want to know before they book.",
      notePrompt: "Venue name, address, parking and toilets",
      notePlaceholder: "Name, street address, where parents park, where the toilets are",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-class-time",
      title: "Class day, time and length",
      detail: "Which day and time the term classes run, and how long one class lasts.",
      notePrompt: "Day, time and how long a class runs",
      notePlaceholder: "e.g. Tuesdays, 3.30 pm, 60 minutes",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-wwcc",
      title: "Your Working With Children Check",
      detail: "Your WWCC number goes on the website. Parents look for it.",
      notePrompt: "Your WWCC number",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-insurance",
      title: "Public liability insurance",
      detail: "Insurance that covers group classes for children. Upload the certificate, or tell me where it's up to if it's still on its way.",
      hasUpload: true,
      uploadOptions: { accept: ".pdf,.png,.jpg,.jpeg,.heic", title: "Upload your certificate", hint: "A PDF or a photo of it.", ...FILES },
      notePrompt: "Insurer, or where it's up to (optional)",
      doneLabel: "Done",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-abn",
      title: "Your ABN and business name",
      detail: "Your ABN, and the name the business trades under. Is it ROR The Journey? You need the ABN for the domain name too.",
      notePrompt: "Your ABN and the business name",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-child-safe",
      title: "Check your child safe policy",
      detail: "I'll draft it and put it below. Read it. If it's right, press the button. If something needs to change, write it in the box.",
      hasEditableContent: true,
      pendingContentText: "Your child safe policy appears here once I've drafted it.",
      notePrompt: "Anything to change? (optional)",
      doneLabel: "Looks right",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-consent",
      title: "Check the photo and video consent form",
      detail: "The form every parent signs before their child is in a photo or a video. I'll draft it and put it below. Read it, and tell me anything to change.",
      hasEditableContent: true,
      pendingContentText: "Your consent form appears here once I've drafted it.",
      notePrompt: "Anything to change? (optional)",
      doneLabel: "Looks right",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-taster-dates",
      title: "Taster dates in the January holidays",
      detail: "About 5 dates for the $20 taster classes, in the January school holidays.",
      notePrompt: "Your taster dates and times",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-policies",
      title: "Refunds, missed classes and sick days",
      detail: "Your rules, in your words. I'll turn them into a short policy for the website and the booking page.",
      notePrompt: "What happens with refunds, missed classes and sick days",
      noteRequired: true,
      doneLabel: "Done",
    },
  },

  // ── The offer ──
  {
    stage: "testing",
    step: {
      id: "tror-parents-stay",
      title: "Do parents stay or drop off?",
      detail: "Do parents stay in the room during class, or drop off and come back?",
      notePrompt: "Stay, drop off, or a bit of both",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "testing",
    step: {
      id: "tror-tools",
      title: "Your tool names",
      detail: "The real names of your tools: at least the first 4, ideally all 16 for the year. A one-line note on what each is for helps too.",
      hasUpload: true,
      uploadOptions: { accept: ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.heic", title: "Or upload your Tool Library", hint: "A document, or photos of your notes.", ...FILES },
      notePrompt: "Your tool names",
      doneLabel: "Done",
    },
  },
  {
    stage: "testing",
    step: {
      id: "tror-prices",
      title: "Happy with these prices?",
      detail: "$40 for a single class. $280 for a term, or 4 payments of $70. A $20 taster that comes off the term.",
      notePrompt: "Anything you'd change? (optional)",
      doneLabel: "I'm happy with these",
    },
  },
  {
    stage: "testing",
    step: {
      id: "tror-parent-chats",
      title: "Local parents I can talk to",
      detail: "Names of 5 to 8 local parents with kids aged 4 to 6 who'd have a 15-minute chat with me. Ask them first. What they say shapes the website and the ads.",
      notePrompt: "Their names, and a mobile or email for each",
      noteRequired: true,
      doneLabel: "Done",
    },
  },

  // ── Accounts to set up ──
  {
    stage: "go-live",
    step: {
      id: "tror-domain",
      title: "Your domain name",
      detail: "I suggest tinyror.com.au. A .com.au needs your ABN. We'll buy it together when we meet, in your name.",
      notePrompt: "Another name you'd prefer? (optional)",
      doneLabel: "We've bought it",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "tror-socials",
      title: "Instagram and Facebook pages",
      detail: "Pages for Tiny ROR. If you have them, paste the links. If not, we set them up when we meet.",
      notePrompt: "Your Instagram and Facebook links",
      notePlaceholder: "https://instagram.com/...",
      doneLabel: "Done",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "tror-stripe",
      title: "Your own Stripe account",
      detail: "Stripe takes the parents' payments and pays them straight into your bank account. Set it up yourself at stripe.com, in the business name.",
      important: NO_PASSWORDS,
      doneLabel: "I've set it up",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "tror-meta",
      title: "Meta Business account",
      detail: "The account your Facebook and Instagram ads run from. Set it up at business.facebook.com, then add me as a partner, so I can run the ads without your login.",
      important: NO_PASSWORDS,
      notePrompt: "Your Business ID, once you have it (optional)",
      doneLabel: "I've added you",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "tror-google",
      title: "A Google account for Tiny ROR",
      detail: "For Google ads and your Google business listing. Make a new Google account just for Tiny ROR.",
      important: NO_PASSWORDS,
      notePrompt: "The account's email address",
      doneLabel: "I've set it up",
    },
  },

  // ── Photos ──
  {
    stage: "post-launch",
    step: {
      id: "tror-shoot-families",
      title: "Families for the photo shoot",
      detail: "2 or 3 families with kids aged 4 to 6 for a fun 1-hour play photo shoot in early December. Each family signs the consent form first.",
      notePrompt: "The families' names, and a mobile for each",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "post-launch",
    step: {
      id: "tror-photos-luisa",
      title: "Photos of you",
      detail: "A few good photos of you, ideally laughing. For the About section of the website.",
      hasUpload: true,
      uploadOptions: { accept: ".png,.jpg,.jpeg,.webp,.heic,.zip", title: "Upload your photos", hint: "As many as you like. A zip is fine.", ...FILES },
      doneLabel: "Done",
    },
  },
];
