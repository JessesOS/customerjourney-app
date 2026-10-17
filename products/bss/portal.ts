// BSS Launchpad (custom journey, paused) portal settings: the String Theory
// plan. Copied verbatim from lib/bssJourney.ts and lib/stringPlans.ts on
// 2026-10-17. No voice guide or Ask-AI: their scripts were written for Scale
// and CRM.

import type { StringPlan } from "../../lib/journeyTypes";

/** The parallel workstreams behind the five stages, with their weeks, for the
    "String Theory" view in the progress panel. Groups and windows are the CSM
    board's categories and due windows (csm-dashboard lib/bssTasks.ts), from the
    agreement. `ongoing` runs past week 10 (support to month 8). `after` names
    the workstreams that feed this one, drawn as threads between strings. */
export type Workstream = { id: string; name: string; weekStart: number; weekEnd: number; ongoing?: boolean; taskIds: string[]; after?: string[] };

const ids = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `bss-${String(from + i).padStart(3, "0")}`);

export const bssWorkstreams: Workstream[] = [
  { id: "intake", name: "Intake & kick-off", weekStart: 1, weekEnd: 2, taskIds: ids(1, 3) },
  { id: "mapping", name: "Mapping & audit", weekStart: 1, weekEnd: 2, taskIds: ids(4, 7), after: ["intake"] },
  { id: "crm", name: "CRM build", weekStart: 2, weekEnd: 4, taskIds: ids(8, 13), after: ["mapping"] },
  { id: "website", name: "Website build", weekStart: 2, weekEnd: 4, taskIds: ids(14, 18), after: ["mapping"] },
  { id: "channels", name: "Channel connections", weekStart: 5, weekEnd: 5, taskIds: ids(19, 21), after: ["crm", "website"] },
  { id: "testing", name: "Testing & QA", weekStart: 6, weekEnd: 6, taskIds: ids(22, 26), after: ["channels"] },
  { id: "launch", name: "Launch & automate", weekStart: 6, weekEnd: 6, taskIds: ids(27, 34), after: ["testing"] },
  { id: "partners", name: "Partners, webinar & onboarding", weekStart: 7, weekEnd: 10, taskIds: ids(35, 37), after: ["launch"] },
  { id: "support", name: "Refine & support", weekStart: 7, weekEnd: 10, ongoing: true, taskIds: ids(38, 41), after: ["launch"] },
];

// BSS (paused custom product): the CSM board's categories and windows, in weeks.
export const bssStringPlan: StringPlan = {
  weeks: 10,
  goLiveDay: 42,
  tailLabel: "→ M8",
  workstreams: bssWorkstreams.map((w) => ({
    id: w.id,
    name: w.name,
    dayStart: (w.weekStart - 1) * 7 + 1,
    dayEnd: w.weekEnd * 7,
    ongoing: w.ongoing,
    taskIds: w.taskIds,
    after: w.after,
  })),
};
