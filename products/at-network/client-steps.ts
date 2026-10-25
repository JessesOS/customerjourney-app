// AT Network: the client's side. Restructured 2026-10-25 (Jesse's OK) around
// the kickoff: sign, pay, read the scope and map, book the call, approve the
// written summary, then build. Five stages: Sign and start, What we need from
// you, Website build, Funnel and ads, Final review and handover.
//
// EVERY WORD HERE IS A DRAFT (Claude): all steps are in draftCopy.
// OPEN in the spec, so PLACEHOLDERS here: total days, each stage's day window,
// every due date, the brand tagline, the kickoff booking link. No prices.
// Step 1 is the signed acceptance of the agreement (./agreement.ts). The Scope
// and Map comes right after it, so it can be read before paying (Claude's call,
// Jesse OK 2026-10-25). Payments
// are Stripe invoices; the portal shows the step and Jesse marks it paid.
// Reviews follow the agreement's rule: one consolidated list per round, two
// rounds per piece. Each review step says which round it is.

import type { StagePatch } from "../custom";
import type { ClientStep, StageId } from "../types";

const PAY_NOTE = "Pay by card or bank transfer from the invoice. Jesse ticks this once your payment shows. Nothing else is needed from you after you've paid.";
const ONE_LIST = "Send one list with everything you, Martyn and Ben would change. That counts as one round.";
const FILES = { choose: "Click to choose your files", chooseMore: "+ Add more files", stayOpen: true } as const;

export const atNetworkStages: Partial<Record<StageId, StagePatch>> = {
  onboarding: {
    name: "Sign and start",
    dayStart: 1,
    dayEnd: 7,
    blurb: "Accept the agreement, pay the first instalment, read your scope and map, pay the first instalment, then book the kickoff call. After it, you approve a short written summary. That's the brief we build to.",
    statusNotes: [],
  },
  build: {
    name: "What we need from you",
    dayStart: 3,
    dayEnd: 10,
    blurb: "The content and details only you can give us. Each one has a due day. If one is late, the timeline pauses until it arrives.",
    statusNotes: [],
  },
  testing: {
    name: "Website build",
    dayStart: 8,
    dayEnd: 26,
    blurb: "We build your site. You see everything on a review link as it is built: two rounds of changes, then your sign-off.",
    statusNotes: [],
  },
  "go-live": {
    name: "Funnel and ads",
    dayStart: 20,
    dayEnd: 33,
    blurb: "Your landing pages, the three video ads, two statics and the LinkedIn banner. Two rounds, then sign-off.",
    statusNotes: [],
  },
  "post-launch": {
    name: "Final review and handover",
    dayStart: 34,
    dayEnd: 42,
    blurb: "One last look at everything, the final instalment, then we hand over your finished site files and help you go live on your domain.",
    statusNotes: [],
  },
};

export const atNetworkSteps: { stage: StageId; step: ClientStep }[] = [
  // ── Sign and start ──
  {
    stage: "onboarding",
    step: {
      // The legal acceptance (Jesse, 2026-10-21: the portal is the signature).
      // The agreement and its form come from portal.agreement (./agreement.ts).
      // Most clients sign before they get their link (Jesse, 2026-10-25): the
      // team records the acceptance in admin and this step arrives done, with
      // the agreement still readable. A client who hasn't signed sees the form.
      id: "atn-agreement",
      title: "Your signed agreement",
      detail: "Our agreement with you, kept here to read any time. If you haven't accepted it yet, read all of it and accept it below. Your acceptance is your signature.",
    },
  },
  {
    stage: "onboarding",
    step: {
      // The Scope and Map (./scope-map.ts): the two tracks, the site map, what's
      // in, what's out, and the Phase 2 list. Stays readable after it's ticked.
      id: "atn-scope-map",
      title: "Read your scope and map",
      detail: "Everything Phase 1 covers, on one page: the website build, the funnel test, the site map, and the Phase 2 list for anything parked. Read it before the kickoff call and add a note wherever you have a question. We'll walk through it together on the call.",
      doneLabel: "I've read it",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "atn-pay-1",
      title: "Pay the first instalment",
      detail: "Your invoice is in your email. Work starts once it is paid. " + PAY_NOTE,
      doneLabel: "I've paid",
    },
  },
  {
    stage: "onboarding",
    step: {
      // Google Calendar booking page on jesse@allconvos.ai (made 2026-10-25).
      id: "atn-book-kickoff",
      bookingUrl: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1zFdYaXgf5lDqGZ8rLV9KPdB1nNec8ZbfcHcmXT7Bj51LstiAWeQvjG-26D1PxlPcvQ9-lxgdP",
      title: "Book the kickoff call",
      detail: "One call, 45 minutes, once the first instalment has landed. We look inside your platform together, lock the homepage brief, and confirm who signs things off.",
      steps: [
        "Pick a time on the booking page below. You get a calendar invite with the Google Meet link straight away.",
        "Have your platform login handy so we can look inside it together.",
      ],
      notePrompt: "Anything you want covered on the call? (optional)",
      doneLabel: "I've booked it",
    },
  },
  {
    stage: "onboarding",
    step: {
      // After the call: Jesse pastes the "locked on" summary here (editable
      // content), the approver types their name, and that's the brief.
      id: "atn-kickoff-summary",
      title: "Approve the kickoff summary",
      detail: "After the call we write up what we decided, in plain words, below. Read it. If it's right, type your full name and approve it. That summary is the brief we build to. Anything not in it is a change request.",
      hasEditableContent: true,
      pendingContentText: "Your summary appears here after the call.",
      notePrompt: "Type your full name to approve",
      notePlaceholder: "Your full name",
      noteRequired: true,
      doneLabel: "Approved",
    },
  },

  // ── What we need from you ──
  {
    stage: "build",
    step: {
      // Martyn already sent the StarMap (a Claude artifact, 24 Oct). This is a
      // confirmation, not a request (Jesse, 2026-10-25). OPEN: the artifact link
      // goes in guideUrl once Jesse sends it.
      id: "atn-starmap",
      title: "Confirm your StarMap questions and report",
      detail: "Martyn: this is what we'll build the StarMap page from. Open what you sent us and check the questions and the report are final. Anything to change goes in the box. Otherwise type Final.",
      guideLabel: "Open the StarMap you sent",
      hasUpload: true,
      uploadOptions: { accept: ".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg,.zip", title: "Newer version?", hint: "Only if something has changed since you sent it.", ...FILES },
      notePrompt: "Anything to change, or type Final",
      notePlaceholder: "Final",
      doneLabel: "Confirm",
    },
  },
  {
    stage: "build",
    step: {
      id: "atn-package-breakdown",
      title: "Send the product package breakdown",
      detail: "Rich: share your product package breakdown as a Google Doc. Set sharing so anyone with the link can view, then paste the link.",
      steps: ["Open your Google Doc and press Share.", "Under General access, choose \"Anyone with the link\".", "Copy the link and paste it below."],
      notePrompt: "Link to the package breakdown",
      notePlaceholder: "https://docs.google.com/...",
      noteRequired: true,
      doneLabel: "I've sent the link",
    },
  },
  {
    stage: "build",
    step: {
      id: "atn-level-docs",
      title: "Send the Google Doc for each membership level",
      detail: "Ben: one Google Doc per level (Initiations, Tribe, Academy, Mentor7) and one for the Benevolent Executive. These become the five offer pages. Set sharing so anyone with the link can view, then paste the links.",
      notePrompt: "Links, one per line",
      notePlaceholder: "Initiations: https://docs.google.com/...\nTribe: ...",
      noteRequired: true,
      doneLabel: "I've sent the links",
    },
  },
  {
    stage: "build",
    step: {
      id: "atn-photos-rich",
      title: "Send photos of Rich",
      detail: "Rich: upload the photos we should use. Clear, high-quality shots are best. Photos of Martyn and your final eBook are already with us.",
      hasUpload: true,
      uploadOptions: { accept: ".png,.jpg,.jpeg,.webp,.heic,.zip", title: "Upload photos of Rich", hint: "Add as many as you like, one at a time or several at once. A zip is fine.", ...FILES },
      doneLabel: "Next",
    },
  },
  {
    stage: "build",
    step: {
      id: "atn-academy",
      title: "Send the Academy course details",
      detail: "Rich: what the Academy course includes, so we describe it correctly on your site. Your Foundations outline goes here too.",
      notePrompt: "Academy course details",
      notePlaceholder: "Name, what it covers, who it's for, how it runs. A link to a document is fine.",
      noteRequired: true,
      doneLabel: "I've sent the details",
    },
  },
  {
    stage: "build",
    step: {
      id: "atn-workbook",
      title: "Send the interactive workbook",
      detail: "Rich: upload the workbook, or paste a link to it. We use it as it is. Branding it is on the Phase 2 list.",
      hasUpload: true,
      uploadOptions: { accept: ".pdf,.doc,.docx,.zip", title: "Upload the workbook", hint: "A PDF or document, or paste a link below.", ...FILES },
      notePrompt: "Or paste a link",
      notePlaceholder: "https://...",
      doneLabel: "I've sent it",
    },
  },
  {
    stage: "build",
    step: {
      id: "atn-ghl-contact",
      title: "Name your GHL contact person",
      detail: "Who should we work with on your GoHighLevel account? One person is best.",
      notePrompt: "Their name and email",
      notePlaceholder: "Name, email",
      noteRequired: true,
      doneLabel: "I've named them",
    },
  },
  {
    stage: "build",
    step: {
      id: "atn-scripts",
      title: "Write first-draft scripts for your sales videos",
      detail: "Your team writes a first draft for the sales video on each landing page. Rough is fine: you get one round of edits from us. Paste them in the box, or upload a document.",
      hasUpload: true,
      uploadOptions: { accept: ".pdf,.doc,.docx,.txt,.rtf,.zip", title: "Upload your script drafts", hint: "One document per landing page, or one for all of them.", ...FILES },
      notePrompt: "Or paste your drafts here",
      notePlaceholder: "Landing page A, B and C: one script each.",
      doneLabel: "I've sent the drafts",
    },
  },
  {
    stage: "build",
    step: {
      id: "atn-videographer",
      title: "Confirm your videographer's availability",
      detail: "Tell us the dates your videographer can film, so we can plan the shoot. Filming is your team's.",
      notePrompt: "Dates and times that work",
      notePlaceholder: "Dates, times, location, and the videographer's name.",
      noteRequired: true,
      doneLabel: "I've sent the dates",
    },
  },

  // ── Website build ──
  {
    stage: "testing",
    step: {
      id: "atn-review-site",
      hasEditableContent: true,
      pendingContentText: "Your review link appears here when it's ready. We'll email you.",
      title: "Review your site: round 1 of 2",
      detail: "Open the review link and look at every page, on your phone as well as your computer. " + ONE_LIST + " Or approve it as it is.",
      notePrompt: "Your consolidated list for round 1, or \"Approved\"",
      notePlaceholder: "Everything you'd change, in one list. Or type Approved.",
      noteRequired: true,
      doneLabel: "Send round 1",
    },
  },
  {
    stage: "testing",
    step: {
      id: "atn-pay-2",
      title: "Pay the second instalment",
      detail: "Due when the site review link opens. Your invoice is in your email. " + PAY_NOTE,
      doneLabel: "I've paid",
    },
  },
  {
    stage: "testing",
    step: {
      id: "atn-review-site-2",
      hasEditableContent: true,
      pendingContentText: "Your review link appears here when it's ready. We'll email you.",
      title: "Review your site: round 2 of 2",
      detail: "Your round 1 changes are in. This is the last round on the site. " + ONE_LIST + " Anything after this round is a change request.",
      notePrompt: "Your consolidated list for round 2, or \"Approved\"",
      notePlaceholder: "Everything you'd change, in one list. Or type Approved.",
      noteRequired: true,
      doneLabel: "Send round 2",
    },
  },
  {
    stage: "testing",
    step: {
      id: "atn-signoff-site",
      hasEditableContent: true,
      pendingContentText: "What you're signing off appears here: the final list and the link to the final versions.",
      title: "Sign off your site",
      detail: "Both rounds are done. Type your full name to sign off the site. From here, changes to it are change requests.",
      notePrompt: "Type your full name to sign off the items above",
      notePlaceholder: "Your full name",
      noteRequired: true,
      doneLabel: "Sign off",
    },
  },

  // ── Funnel and ads ──
  {
    stage: "go-live",
    step: {
      id: "atn-review-landing",
      hasEditableContent: true,
      pendingContentText: "Your review link appears here when it's ready. We'll email you.",
      title: "Review landing pages A, B and C: round 1 of 2",
      detail: "One landing page per ad, on the review link. " + ONE_LIST + " Or approve them as they are.",
      notePrompt: "Your consolidated list for round 1, or \"Approved\"",
      notePlaceholder: "Everything you'd change, in one list. Or type Approved.",
      noteRequired: true,
      doneLabel: "Send round 1",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "atn-review-ads",
      hasEditableContent: true,
      pendingContentText: "Your review link appears here when it's ready. We'll email you.",
      title: "Review your ads and LinkedIn banner: round 1 of 2",
      detail: "The three video ads (Foundations, Tribe, Mentor7), the two statics and the LinkedIn banner, on the review link. " + ONE_LIST + " Or approve them as they are.",
      notePrompt: "Your consolidated list for round 1, or \"Approved\"",
      notePlaceholder: "Everything you'd change, in one list. Or type Approved.",
      noteRequired: true,
      doneLabel: "Send round 1",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "atn-review-funnel-2",
      hasEditableContent: true,
      pendingContentText: "Your review link appears here when it's ready. We'll email you.",
      title: "Review the funnel: round 2 of 2",
      detail: "Your round 1 changes to the landing pages, ads, statics and banner are in. This is the last round. " + ONE_LIST,
      notePrompt: "Your consolidated list for round 2, or \"Approved\"",
      notePlaceholder: "Everything you'd change, in one list. Or type Approved.",
      noteRequired: true,
      doneLabel: "Send round 2",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "atn-signoff-funnel",
      hasEditableContent: true,
      pendingContentText: "What you're signing off appears here: the final list and the link to the final versions.",
      title: "Sign off the funnel",
      detail: "Type your full name to sign off the landing pages, ads, statics and banner. Your team runs the ads; the tags on every page show what converts.",
      notePrompt: "Type your full name to sign off the items above",
      notePlaceholder: "Your full name",
      noteRequired: true,
      doneLabel: "Sign off",
    },
  },

  // ── Final review and handover ──
  {
    stage: "post-launch",
    step: {
      id: "atn-review-final",
      hasEditableContent: true,
      pendingContentText: "Your review link appears here when it's ready. We'll email you.",
      title: "Review the final work",
      detail: "Everything together, one last time, on the review link. Approve it, or send one change list within 5 business days. After that it is deemed accepted.",
      notePrompt: "Approved, or your change list",
      notePlaceholder: "Type Approved, or list what you'd change.",
      noteRequired: true,
      doneLabel: "Send my answer",
    },
  },
  {
    stage: "post-launch",
    step: {
      id: "atn-pay-final",
      title: "Pay the final instalment",
      detail: "Due when the final review link opens. Handover follows once it is paid. " + PAY_NOTE,
      doneLabel: "I've paid",
    },
  },
  {
    stage: "post-launch",
    step: {
      id: "atn-domain-access",
      title: "Give domain and hosting access for go-live",
      detail: "So your finished site can go live on your domain. Never send us a password in the portal: tell us who to invite or how you'd like to share access.",
      important: "Never send a password here. An invite is all we need.",
      inviteEmail: "jesse@allconvos.ai",
      notePrompt: "Who manages your domain and hosting, and where is it (for example GoDaddy)?",
      notePlaceholder: "Name, email, provider",
      noteRequired: true,
      doneLabel: "Access confirmed",
    },
  },
  {
    stage: "post-launch",
    step: {
      id: "atn-handover",
      title: "Confirm your handover",
      detail: "You've received the finished site files, assets and access. From here, hosting and changes are yours. Tick this once you've checked you have everything.",
      notePrompt: "Anything missing?",
      doneLabel: "I have everything",
    },
  },
];
