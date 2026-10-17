import { bssWorkstreams } from "./bssJourney";
import type { StringPlan } from "./journeyTypes";

// The StringPlan and StringWorkstream types live in lib/journeyTypes.ts (2026-10-17).
export type { StringPlan, StringWorkstream } from "./journeyTypes";

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

// Scale — Meta ads only, used by "BSS Meta ads only" (Jesse, 2026-10-16). The
// strands group the Scale tasks; their days are the journey's own stage days
// (onboarding days 1–2, build 2–13, test day 14, go-live day 30, check-ins after).
// Google-only and hidden tasks simply don't appear (they aren't in the client's journey).
export const scaleMetaStringPlan: StringPlan = {
  weeks: 5,
  goLiveDay: 30,
  tailLabel: "→ ongoing",
  workstreams: [
    { id: "intake", name: "Interview & intake", dayStart: 1, dayEnd: 2, taskIds: ["ob-0", "ob-1", "ob-2"] },
    { id: "approvals", name: "Your approvals", dayStart: 1, dayEnd: 2, taskIds: ["ob-3", "ob-5"], after: ["intake"] },
    { id: "connect", name: "Apps & connections", dayStart: 1, dayEnd: 2, taskIds: ["ob-4", "ob-crm", "ob-6", "ob-6b", "ob-6c", "ob-7"], after: ["intake"] },
    { id: "campaigns", name: "Meta campaign build", dayStart: 2, dayEnd: 13, taskIds: ["bd-1", "bd-2", "bd-3"], after: ["approvals"] },
    { id: "testing", name: "Live test", dayStart: 14, dayEnd: 14, taskIds: ["ts-1", "ts-2", "ts-3"], after: ["campaigns", "connect"] },
    { id: "golive", name: "Go-live", dayStart: 30, dayEnd: 30, taskIds: ["gl-1", "gl-2", "gl-3", "gl-4", "gl-5"], after: ["testing"] },
    { id: "checkins", name: "Check-ins & support", dayStart: 31, dayEnd: 35, ongoing: true, taskIds: ["pl-1", "pl-2", "pl-3"], after: ["golive"] },
  ],
};
