// Website add-on: DRAFT. Seeded from the only Website task set that exists,
// BSS tasks bss-014…bss-017 (ids kept), so a website build can be sold beside
// Scale or Respond later. No client steps or timeline yet: both to be written
// with Jesse. Never seeded onto a client board while it is a draft.
//
// Generated once by scripts/products/import-csm-templates.ts on 2026-10-16
// (see docs/products/conversion-report-2026-10.md).
// From here on this file is edited by hand: ask Claude, and bump the version
// with every change (npm run products:check enforces it).

import type { Product, TeamTask } from "../types";

const websiteTeamTasks: TeamTask[] = [
  // ── Website Build (build) ──
  {
    id: "bss-014",
    title: "Build 8 core pages (desktop + mobile)",
    stage: "build",
    category: "Website Build",
    role: "Jesse Allan",
    priority: "high",
    due: "Weeks 2-4",
    dependencies: [],
    notes: "Keep existing copy, claims, offers and guarantee unchanged unless the client approves a change. 2 revision rounds on core pages.",
  },
  {
    id: "bss-015",
    title: "Build 2 webinar pages (registration + thank-you)",
    stage: "build",
    category: "Website Build",
    role: "Jesse Allan",
    priority: "normal",
    due: "Weeks 2-4",
    dependencies: [],
    notes: "",
  },
  {
    id: "bss-016",
    title: "Update partner pages",
    stage: "build",
    category: "Website Build",
    role: "Jesse Allan",
    priority: "normal",
    due: "Weeks 2-4",
    dependencies: [],
    notes: "",
  },
  {
    id: "bss-017",
    title: "Add VSL placeholder slot",
    stage: "build",
    category: "Website Build",
    role: "Jesse Allan",
    priority: "low",
    due: "Weeks 2-4",
    dependencies: ["bss-014"],
    notes: "Placeholder slot only — the VSL itself is an excluded add-on.",
  },
];

export const website: Product = {
  id: "website",
  name: "Website add-on",
  version: "2026-10-16.1",
  status: "draft",
  totalDays: null,
  roles: ["Jesse Allan"],
  stages: [
    {
      id: "build",
      name: "Build",
      // BSS's build window (weeks 2 to 5), where these tasks came from.
      dayStart: 8,
      dayEnd: 35,
      statusNotes: [],
      steps: [],
    },
  ],
  teamTasks: websiteTeamTasks,
  variants: [],
  source: {
    from: "csm-dashboard lib/bssTasks.ts (bss-014…bss-017)",
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
