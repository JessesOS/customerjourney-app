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
    blurb: "Accept the agreement, save your portal, read your scope and map, pay the first instalment, then book the kickoff call. After it, you approve a short written summary. That's the brief we build to.",
    statusNotes: [],
  },
  build: {
    name: "What we need from you",
    dayStart: 3,
    dayEnd: 10,
    blurb: "The content and details only you can give us, as listed in the agreement. Most are due 3 business days after payment 1. We build with what we have by each due date and mark anything still to come, so nothing here holds up your launch.",
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
      // Bookmark steps, as for Fin (Jesse, 2026-10-25). Client-only: no team task.
      id: "atn-bookmark",
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
      id: "atn-save-portal",
      title: "Save your portal to your phone",
      detail: "So you can get back here in one tap. Saved to your phone's home screen, it opens like an app.",
      steps: [
        "On an iPhone, open your portal link in Safari (even if you usually use Chrome). Tap the Share button: the square with an arrow pointing up, at the bottom of the screen. Scroll down, tap \"Add to Home Screen\", then tap \"Add\".",
        "On Android, open the link in Chrome, tap the three dots at the top right, then \"Add to Home screen\".",
        "From now on, open AT Network from your home screen.",
      ],
      doneLabel: "I've saved it",
      clientOnly: true,
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

  {
    stage: "onboarding",
    step: {
      // The Foundations VSL (Jesse, 2026-10-28): offered as the launch gift in
      // place of the two-minute impact cut. The signed agreement is unchanged;
      // this records the swap in writing, with the name and the time.
      id: "atn-vsl-confirm",
      title: "Confirm your Foundations VSL",
      detail: "At the kickoff call we'll talk through making Martyn's full Foundations overview (about 3 minutes 40) into your Foundations VSL, re-edited in the First Light look, as your launch gift in place of the two-minute impact-video cut. You get a widescreen version for desktop and a phone version, used on the Foundations page and landing pages A and B, with one round of changes. If that's what you'd like, type your full name to confirm.",
      notePrompt: "Type your full name to confirm",
      notePlaceholder: "Your full name",
      noteRequired: true,
      doneLabel: "Confirm",
    },
  },

  // ── What we need from you ──
  {
    stage: "build",
    step: {
      // Martyn already sent the StarMap (a Claude artifact, 24 Oct). This is a
      // confirmation, not a request (Jesse, 2026-10-25). The link is Martyn's
      // Claude artifact (from Jesse, 2026-10-25).
      id: "atn-starmap",
      guideUrl: "https://claude.ai/public/artifacts/0e5b4902-2540-4ff2-b0ec-1e456fc85bc6",
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
      // Received (agreement A4): Ben's copy for the four levels, 24 October.
      id: "atn-package-breakdown",
      title: "Confirm your product package breakdown",
      detail: "Received from Ben on 24 October: the website copy for Levels 0 to 3. We build the offer pages from it. Nothing to send unless something has changed. If it has, paste the link or upload the new version below.",
      hasUpload: true,
      uploadOptions: { accept: ".pdf,.doc,.docx,.txt,.rtf,.zip", title: "Newer version?", hint: "Only if the copy has changed since 24 October.", ...FILES },
      notePrompt: "Anything changed, or a link to the latest version (optional)",
      doneLabel: "Confirmed, nothing changed",
    },
  },
  {
    stage: "build",
    step: {
      // Agreement A4: prices and free-month terms, Rich, 3 business days after payment 1.
      id: "atn-prices",
      title: "Send the price and free-month terms for each level",
      detail: "Rich: for each level (Tribe, Academy, Mentor7) the price, the billing period, and what the free month is and who gets it. We need these for the offer pages and for landing pages A and B." + " Due 3 business days after payment 1.",
      notePrompt: "Price and free-month terms, per level",
      notePlaceholder: "Tribe: ... per month. Academy: ... Mentor7: ... Free month: ...",
      noteRequired: true,
      doneLabel: "I've sent them",
    },
  },
  {
    stage: "build",
    step: {
      id: "atn-photos-rich",
      title: "Send photos of Rich",
      detail: "Rich: upload the photos we should use. Clear, high-quality shots are best. Photos of Martyn and your final eBook are already with us. Due 3 business days after payment 1.",
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
      detail: "Rich: what the Academy course includes, so we describe it correctly on your site. Martyn's Foundations document is already with us. Your outlines for the Growth and Legacy courses go here too: we build their pages from them. Due 3 business days after payment 1.",
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
      detail: "Rich: upload the workbook, or paste a link to it. We use it as it is. Branding it is on the Phase 2 list. Due 3 business days after payment 1.",
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
      // Foundations VSL input 1 (Jesse, 2026-10-28). Ask Pete via Ben for the masters.
      id: "atn-vsl-originals",
      title: "Send the original files of Martyn's Foundations overview",
      detail: "For the Foundations VSL we need the best quality of Martyn's course overview: ideally the 4K master or the camera files, with no title or logo burned in. Pete may have them: Ben, could you ask him? If they don't exist, tell us and we'll work from the 1080p export we have. Paste a link if the files are big.",
      hasUpload: true,
      uploadOptions: { accept: ".mp4,.mov,.zip", title: "Upload the files", hint: "Big files: paste a Drive or Dropbox link in the box below instead.", ...FILES },
      notePrompt: "A link to the files, or where they are",
      notePlaceholder: "https://drive.google.com/...  or: Pete has them.",
      noteRequired: true,
      doneLabel: "I've sent them",
    },
  },
  {
    stage: "build",
    step: {
      // Foundations VSL input 2 (Jesse, 2026-10-28): networking footage for the cut-in.
      id: "atn-vsl-networking",
      title: "Send footage of your networking calls",
      detail: "Martyn's overview doesn't mention the live networking calls and breakout rooms, which Rich calls as valuable as the course. We'd like to cut in a few seconds of the real thing. Send any recordings you already have (with everyone's OK to use them), or tell us when your videographer can film one.",
      hasUpload: true,
      uploadOptions: { accept: ".mp4,.mov,.zip", title: "Upload footage", hint: "Big files: paste a link in the box below instead.", ...FILES },
      notePrompt: "A link to the footage, or when a call can be filmed",
      notePlaceholder: "https://...  or: Thursday's call, our videographer is free.",
      noteRequired: true,
      doneLabel: "I've sent it",
    },
  },
  {
    stage: "build",
    step: {
      // Stinger references (Jesse, 2026-10-25): the intro and outro idents for
      // the podcast, which doubles as the YouTube channel. Phase 1 makes both
      // (agreement Version 2, A2).
      id: "atn-stinger-ref",
      title: "Send a reference for your podcast stingers",
      detail: "The stingers are the short idents that open and close each podcast episode and YouTube video. Send us one or two examples you like, from any show, and a line on the feel you want. Links are best. We make a matching intro and outro from them.",
      hasUpload: true,
      uploadOptions: { accept: ".mp4,.mov,.mp3,.wav,.png,.jpg,.jpeg,.pdf,.zip", title: "Upload a reference", hint: "Short clips or stills, if you have them. Links go in the box below.", ...FILES },
      notePrompt: "Links to the examples, and the feel you want",
      notePlaceholder: "e.g. https://youtube.com/... Warm, cinematic, not corporate.",
      noteRequired: true,
      doneLabel: "I've sent the references",
    },
  },
  {
    stage: "build",
    step: {
      // Agreement A4: Executive Program page copy, Rich, 3 business days after payment 1.
      id: "atn-exec-copy",
      title: "Send the Benevolent Executive Program page copy",
      detail: "Rich: the copy for the Benevolent Executive Program page, as you'd like it to read. We place it in the First Light look. Due 3 business days after payment 1.",
      hasUpload: true,
      uploadOptions: { accept: ".pdf,.doc,.docx,.txt,.rtf", title: "Upload the copy", hint: "Or paste it, or a link, in the box below.", ...FILES },
      notePrompt: "The copy, or a link to it",
      doneLabel: "I've sent it",
    },
  },
  {
    stage: "build",
    step: {
      // Agreement A4: where the StarMap page links from, Rich, 3 business days after payment 1.
      id: "atn-starmap-link",
      title: "Tell us where the StarMap page links from",
      detail: "Rich: where on your site should people find the StarMap assessment? For example the top menu, the homepage, the Initiations page, or all three. Due 3 business days after payment 1.",
      notePrompt: "Where the StarMap page links from",
      notePlaceholder: "e.g. Top menu and the Initiations page",
      noteRequired: true,
      doneLabel: "I've told you",
    },
  },
  {
    stage: "build",
    step: {
      id: "atn-ghl-contact",
      title: "Name your GHL contact person",
      detail: "Who should we work with on your GoHighLevel account? One person is best. Due 3 business days after payment 1.",
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
      title: "Write first-draft scripts for your four sales videos",
      detail: "One sales video for each offer page, Levels 0 to 3 (not the Benevolent Executive page, and not the landing pages). Your team writes the first draft of each script from your product package breakdown. Rough is fine: you get one round of direction and changes from us on each. Filming and editing are yours. Paste the drafts in the box, or upload a document. Due 7 days after payment 1.",
      hasUpload: true,
      uploadOptions: { accept: ".pdf,.doc,.docx,.txt,.rtf,.zip", title: "Upload your script drafts", hint: "One document per video, or one for all four.", ...FILES },
      notePrompt: "Or paste your drafts here",
      notePlaceholder: "Level 0, Level 1, Level 2, Level 3: one script each.",
      doneLabel: "I've sent the drafts",
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
      id: "atn-review-vsl",
      hasEditableContent: true,
      pendingContentText: "Your Foundations VSL appears here when it's ready, in widescreen and phone. We'll email you.",
      title: "Review your Foundations VSL: one round",
      detail: "Watch both versions, widescreen and phone. " + ONE_LIST + " This piece has one round of changes. Or approve it as it is.",
      notePrompt: "Your consolidated list, or \"Approved\"",
      notePlaceholder: "Everything you'd change, in one list. Or type Approved.",
      noteRequired: true,
      doneLabel: "Send my answer",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "atn-signoff-funnel",
      hasEditableContent: true,
      pendingContentText: "What you're signing off appears here: the final list and the link to the final versions.",
      title: "Sign off the funnel",
      detail: "Type your full name to sign off the landing pages, ads, statics, banner and the Foundations VSL. Your team runs the ads; the tags on every page show what converts.",
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
      detail: "So your finished site can go live on your domain. Due at go-live: this is the one item that holds the launch date if it's late. Never send us a password in the portal: tell us who to invite or how you'd like to share access.",
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
      detail: "You've received the finished site files, assets and access, with a page template and a short guide for adding new pages in the same look. From here, hosting and changes are yours. Tick this once you've checked you have everything.",
      notePrompt: "Anything missing?",
      doneLabel: "I have everything",
    },
  },
];
