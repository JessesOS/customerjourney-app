// Scale: the 30-day journey for Meta and/or Google ads clients, plus "BSS Meta
// ads only" (Fin's product: the Meta set under the BSS Launchpad name).
//
// Ask Claude to change it. Bump `version` with every change, then run
// npm run products:lock, products:render and products:check.
// Readable sheet: docs/products/scale.md (generated).

import { STAGE_ORDER, type Product, type ProductStage } from "../types";
import { scaleClientStages } from "./client-steps";
import { scaleTeamTasks } from "./team-tasks";

/** Team-only: exits, pauses and cancellations. Never reaches the portal. */
const support: ProductStage = {
  id: "support",
  name: "Support",
  dayStart: 31,
  dayEnd: 31,
  ongoing: true,
  blurb: "Team only, as needed: exit, pause and cancellation requests.",
  statusNotes: [],
  steps: [],
  teamOnly: true,
};

export const scale: Product = {
  id: "scale",
  name: "Scale",
  version: "2026-10-16.1",
  status: "live",
  totalDays: 30,
  roles: [
    "Scale CSM",
    "Account Manager",
    "Creative Strategist",
    "Ads Team",
    "Automation Specialist",
    "Voice AI Specialist",
    "Support Lead",
    "Accounts - Sandy",
    "Joseph",
    "Rich",
  ],
  stages: [...scaleClientStages, support].sort((a, b) => STAGE_ORDER.indexOf(a.id) - STAGE_ORDER.indexOf(b.id)),
  teamTasks: scaleTeamTasks,
  // Portal tweaks copied verbatim from the product* maps and clientTypeLabels in
  // lib/journeyEngine.ts (2026-10-16). The golden-overrides check keeps them equal.
  variants: [
    {
      id: "meta",
      clientType: "meta",
      label: "Scale — Meta ads",
      channels: ["meta"],
      portal: {
        hidesIncentive: true,
      },
    },
    {
      id: "google",
      clientType: "google",
      label: "Scale — Google Ads",
      channels: ["google"],
      portal: {},
    },
    {
      id: "meta-google",
      clientType: "meta-google",
      label: "Scale — Meta + Google Ads",
      channels: ["meta", "google"],
      portal: {},
    },
    {
      // Fin Creighton's live product (since 2026-10-16). check:fin guards it.
      id: "bss-meta",
      clientType: "bss-meta",
      label: "BSS Meta ads only",
      channels: ["meta"],
      portal: {
        lockedLook: "groveaurora",
        brandName: "BSS Launchpad",
        hidesIncentive: true,
        introVideo: {
          src: "/api/media/bss-launch-walkthrough.mp4",
          poster: "/portal/media/bss-launch-walkthrough-poster.jpg",
          title: "Welcome to BSS Launchpad",
        },
        hiddenTaskVideos: ["ob-4", "ob-6", "ob-6b", "bd-3"],
        taskNotes: {
          "ob-2": "No need to book this one. We've already been working through this together, so you can tick it off.",
          "ob-crm": "CRM access is coming very soon.",
          "ob-6": "You can do this once your CRM access is ready. We'll let you know.",
          "ob-6b": "You can do this once your CRM access is ready. We'll let you know.",
          "ob-6c": "Not needed at this point. If you need a phone number, it's billed at cost, along with your SMS and call charges.",
          "ts-1": "Your CRM access is coming soon. You can check this once it's set up.",
          "ts-2": "This opens once your CRM is connected and live. We'll let you know when it's ready to test.",
          "ts-3": "Booking isn't open yet. We'll give you access and let you know when it's ready.",
        },
        taskDetails: {
          "ob-2": "A live 30-minute walkthrough of your portal, your milestones, and your messaging center.",
          "ts-3": "Once testing is done, we'll lock in your go-live walkthrough together.",
        },
        hiddenTaskBooking: ["ob-2", "ts-3"],
        hiddenTaskPlayground: ["ts-2"],
        hiddenTaskImportant: ["ob-6c"],
        tagline: "Onboarding & delivery",
      },
    },
  ],
  source: {
    from: "csm-dashboard lib/scaleTasks.ts",
    commit: "5c9abc9",
    files: ["lib/scaleTasks.ts", "lib/types.ts"],
    document: {
      title: "Full List Of Tasks - Scale CSM Comprehensive Operational Workflow Manual",
      url: "https://docs.google.com/document/d/1KJZdPO2NkB9w67_stgykSrBSr6hVqeA32Tvihp439yg/edit?usp=drive_link",
    },
    convertedOn: "2026-10-16",
    report: "docs/products/conversion-report-2026-10.md",
  },
};
