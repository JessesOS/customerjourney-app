// AT Network: the client's side. 15 steps, in the order of the handover
// (products/at-network/spec.md, 2026-10-21). Brand-new product: nothing here
// is copied from Fin's bss-custom beyond the build pattern.
//
// EVERY WORD HERE IS A DRAFT (Claude, 2026-10-21): all steps are in draftCopy.
// OPEN in the spec, so PLACEHOLDERS here: total days, each stage's day window,
// every due date, the brand tagline. No prices anywhere (they live in the contract).
// Steps open one at a time, in order. Payments are ticked by Jesse in admin.
// Step 1 is the signed acceptance of the agreement (./agreement.ts). Payments
// are Stripe invoices; the portal shows the step and Jesse marks it paid.

import type { StagePatch } from "../custom";
import type { ClientStep, StageId } from "../types";

const PAY_NOTE = "Pay by card or bank transfer from the invoice. Jesse ticks this once your payment shows. Nothing else is needed from you after you've paid.";
const ONE_LIST = "Send one list with everything you'd change, from both of you. That counts as one round.";

export const atNetworkStages: Partial<Record<StageId, StagePatch>> = {
  onboarding: {
    name: "Get started",
    dayStart: 1,
    dayEnd: 7,
    blurb: "Agree how we work together, pay the first instalment and send us what we need to begin.",
    statusNotes: [],
  },
  build: {
    name: "Build",
    dayStart: 8,
    dayEnd: 28,
    blurb: "We build your site and landing pages. You see everything on a review link as it is built.",
    statusNotes: [],
  },
  testing: {
    name: "Ads and review",
    dayStart: 29,
    dayEnd: 35,
    blurb: "Your video ads, statics and LinkedIn banner are ready for your review.",
    statusNotes: [],
  },
  "go-live": {
    name: "Final review",
    dayStart: 36,
    dayEnd: 40,
    blurb: "You review the final work and pay the final instalment.",
    statusNotes: [],
  },
  "post-launch": {
    name: "Handover",
    dayStart: 41,
    dayEnd: 42,
    blurb: "We hand over your finished site files and help you go live on your domain.",
    statusNotes: [],
  },
};

export const atNetworkSteps: { stage: StageId; step: ClientStep }[] = [
  {
    stage: "onboarding",
    step: {
      // The legal acceptance (Jesse, 2026-10-21: the portal is the signature).
      // The agreement and its form come from portal.agreement (./agreement.ts):
      // tick, entity, full name, email; stored with the time, version, exact
      // text and IP address, with a printable copy. Replaces atn-how-we-work.
      id: "atn-agreement",
      title: "Read the agreement and accept it",
      detail: "This is our agreement with you. Read all of it, then accept it below. Your acceptance is your signature.",
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
      id: "atn-starmap",
      title: "Send the StarMap questions and report details",
      detail: "Martyn: send us the questions and the details for the StarMap report. Paste them in the box, or upload a file.",
      hasUpload: true,
      uploadOptions: {
        accept: ".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg,.zip",
        title: "Upload your StarMap files",
        hint: "Documents or screenshots. You can also paste everything in the box below.",
        choose: "Click to choose your files",
        chooseMore: "+ Add more files",
        stayOpen: true,
      },
      notePrompt: "The StarMap questions and report details",
      notePlaceholder: "Paste the questions and the details of the report here.",
      doneLabel: "I've sent them",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "atn-package-breakdown",
      title: "Send the product package breakdown",
      detail: "Rich: share your product package breakdown as a Google Doc. Set sharing so anyone with the link can view, then paste the link.",
      steps: [
        "Open your Google Doc and press Share.",
        "Under General access, choose \"Anyone with the link\".",
        "Copy the link and paste it below.",
      ],
      notePrompt: "Link to the package breakdown",
      notePlaceholder: "https://docs.google.com/...",
      noteRequired: true,
      doneLabel: "I've sent the link",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "atn-photos-rich",
      title: "Send photos of Rich",
      detail: "Rich: upload the photos we should use. Clear, high-quality shots are best. Photos of Martyn and your final eBook are already with us.",
      hasUpload: true,
      uploadOptions: {
        accept: ".png,.jpg,.jpeg,.webp,.heic,.zip",
        title: "Upload photos of Rich",
        hint: "Add as many as you like, one at a time or several at once. A zip is fine.",
        choose: "Click to choose your photos",
        chooseMore: "+ Add more photos",
        stayOpen: true,
      },
      doneLabel: "Next",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "atn-academy",
      title: "Send the Academy course details",
      detail: "Rich: tell us what the Academy course includes, so we can describe it correctly on your site.",
      notePrompt: "Academy course details",
      notePlaceholder: "Name, what it covers, who it's for, how it runs. A link to a document is fine.",
      noteRequired: true,
      doneLabel: "I've sent the details",
    },
  },
  {
    stage: "onboarding",
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
      detail: "Your team writes a first draft for the sales video on each landing page. Rough is fine: we shape it with you. Paste them in the box, or upload a document.",
      hasUpload: true,
      uploadOptions: {
        accept: ".pdf,.doc,.docx,.txt,.rtf,.zip",
        title: "Upload your script drafts",
        hint: "One document per landing page, or one for all of them.",
        choose: "Click to choose your files",
        chooseMore: "+ Add more files",
        stayOpen: true,
      },
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
      detail: "Tell us the dates your videographer can film, so we can plan the shoot.",
      notePrompt: "Dates and times that work",
      notePlaceholder: "Dates, times, location, and the videographer's name.",
      noteRequired: true,
      doneLabel: "I've sent the dates",
    },
  },
  {
    stage: "build",
    step: {
      id: "atn-review-site",
      title: "Review your site and landing pages",
      detail: "Rich and Martyn: open the review link and look at every page. " + ONE_LIST + " Or approve it as it is.",
      awaitingTeam: false,
      notePrompt: "Your consolidated feedback list, or \"Approved\"",
      notePlaceholder: "Everything you'd change, or type Approved.",
      noteRequired: true,
      doneLabel: "Send my feedback",
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
      id: "atn-review-ads",
      title: "Review your ads and LinkedIn banner",
      detail: "Rich and Martyn: review the three video ads, the two statics and the LinkedIn banner on the review link. " + ONE_LIST + " Or approve them as they are.",
      notePrompt: "Your consolidated feedback list, or \"Approved\"",
      notePlaceholder: "Everything you'd change, or type Approved.",
      noteRequired: true,
      doneLabel: "Send my feedback",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "atn-review-final",
      title: "Review the final work",
      detail: "Rich and Martyn: review everything one last time on the review link. Approve it, or send one change list within 5 business days. After that it is deemed accepted.",
      notePrompt: "Approved, or your change list",
      notePlaceholder: "Type Approved, or list what you'd change.",
      noteRequired: true,
      doneLabel: "Send my answer",
    },
  },
  {
    stage: "go-live",
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
];
