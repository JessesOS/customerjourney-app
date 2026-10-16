// Respond (CRM — Respond): the ~10-day AI receptionist + CRM journey. One
// variant, no ad channels.
//
// Ask Claude to change it. Bump `version` with every change, then run
// npm run products:lock, products:render and products:check.
// Readable sheet: docs/products/respond.md (generated).

import { STAGE_ORDER, type Product, type ProductStage } from "../types";
import { respondClientStages } from "./client-steps";
import { respondTeamTasks } from "./team-tasks";

/**
 * Team-only. The portal's Respond journey has no Build stage (the client goes
 * from Onboarding to Testing), but CSM's build work happens on days 2-7.
 */
const build: ProductStage = {
  id: "build",
  name: "Build",
  dayStart: 2,
  dayEnd: 7,
  blurb: "Team only: CRM, automations, phone and Voice AI set up behind the scenes.",
  statusNotes: [],
  steps: [],
  teamOnly: true,
};

/** Team-only: payment support, cancellations and exits. Never reaches the portal. */
const support: ProductStage = {
  id: "support",
  name: "Support",
  dayStart: 11,
  dayEnd: 11,
  ongoing: true,
  blurb: "Team only, as needed: payment support, cancellations and exits.",
  statusNotes: [],
  steps: [],
  teamOnly: true,
};

export const respond: Product = {
  id: "respond",
  name: "Respond",
  version: "2026-10-16.1",
  status: "live",
  totalDays: 10,
  roles: [
    "Response CSM",
    "Account Manager",
    "Technical Admin",
    "Automation Specialist",
    "Voice AI Specialist",
    "Support Lead",
    "Accounts - Sandy",
    "Joseph",
    "Rich",
  ],
  stages: [...respondClientStages, build, support].sort((a, b) => STAGE_ORDER.indexOf(a.id) - STAGE_ORDER.indexOf(b.id)),
  teamTasks: respondTeamTasks,
  // Copied verbatim from lib/journeyEngine.ts (2026-10-16): Respond has no
  // product-map entries, only its label.
  variants: [
    {
      id: "respond",
      clientType: "respond",
      label: "CRM — Respond",
      portal: {},
    },
  ],
  source: {
    from: "csm-dashboard lib/respondTasks.ts",
    commit: "5c9abc9",
    files: ["lib/respondTasks.ts", "lib/types.ts"],
    document: {
      title: "Full List Of Tasks - Respond CSM Comprehensive Operational Workflow Manual",
      url: "https://docs.google.com/document/d/1ymwzx6joQ2HoPnrnBxHNxL3F1T4J2DYbsqZGkiHV0Bs/edit?usp=sharing",
    },
    convertedOn: "2026-10-16",
    report: "docs/products/conversion-report-2026-10.md",
  },
};
