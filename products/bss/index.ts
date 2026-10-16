// BSS Launchpad, the custom 41-task journey for Bitcoin Success School: PAUSED.
// Reference only. Never seeded onto a team board, and no client type maps to it
// (productForClientType("bss") is null). Fin's live product is "bss-meta",
// a Scale variant (products/scale).
//
// Only the team tasks were converted. The client journey stays in
// lib/bssJourney.ts (paused too); the stage data below is copied from it.

import type { Product } from "../types";
import { bssTeamTasks } from "./team-tasks";

export const bss: Product = {
  id: "bss",
  name: "BSS Launchpad (custom journey)",
  version: "2026-10-16.1",
  status: "paused",
  totalDays: 42,
  roles: ["Jesse Allan"],
  stages: [
    {
      id: "onboarding",
      name: "Onboarding",
      dayStart: 1,
      dayEnd: 14,
      blurb: "Two weeks to get to know your business, gather access, and map your customer journey before anything is built.",
      statusNotes: [
        "Nothing is built until your customer journey is mapped and agreed with you.",
        "We'll confirm your partner pages and how payment is taken in these first two weeks.",
      ],
      steps: [],
    },
    {
      id: "build",
      name: "Build",
      dayStart: 8,
      dayEnd: 35,
      blurb: "Weeks 2 to 5: your CRM, your website and your messaging channels are built and connected.",
      statusNotes: ["Your existing copy, claims and offers stay as they are unless you approve a change."],
      steps: [],
    },
    {
      id: "testing",
      name: "Testing",
      dayStart: 36,
      dayEnd: 39,
      blurb: "Everything is tested end to end before it goes live.",
      statusNotes: ["Your AI lead agent only uses wording you've approved."],
      steps: [],
    },
    {
      id: "go-live",
      name: "Go-Live",
      dayStart: 40,
      dayEnd: 42,
      blurb: "Week 6: your website launches on your domain and your automations switch on.",
      statusNotes: [],
      steps: [],
    },
    {
      id: "post-launch",
      name: "Post-Launch",
      dayStart: 43,
      dayEnd: 240,
      ongoing: true,
      blurb: "Weeks 7 to 10 add partners, webinars and client onboarding. Then we review, tune and support you through month 8.",
      statusNotes: [],
      steps: [],
    },
  ],
  teamTasks: bssTeamTasks,
  variants: [],
  source: {
    from: "csm-dashboard lib/bssTasks.ts",
    commit: "5c9abc9",
    files: ["lib/bssTasks.ts", "lib/types.ts"],
    document: {
      title: "Bitcoin Success School — Scope & Agreement v2 (2026-10-14)",
      url: "https://bss-agreement.vercel.app/",
    },
    convertedOn: "2026-10-16",
    report: "docs/products/conversion-report-2026-10.md",
  },
};
