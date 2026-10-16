"use client";

import type { JourneyMilestone } from "@/lib/onboardingJourney";
import type { StringPlan, StringWorkstream } from "@/lib/stringPlans";
import type { TaskDisplayStatus } from "@/app/components/portal/StatusChip";

/**
 * "String Theory" (Jesse, 2026-10-15): the project as parallel strings across
 * the weeks. One string per workstream, drawn over the days it runs; a bead per
 * task, coloured by status. Threads show which workstream feeds the next. A
 * line marks today and a dashed line marks go-live. The axis follows the
 * product's plan (10 weeks for BSS, 5 for Scale). Drawn in SVG, coloured by
 * the --pj-* tokens; the strings draw in on open.
 */

const LABEL_W = 210; // left gutter for workstream names
const X0 = LABEL_W + 10;
const AXIS_W = 660; // the weeks share this width
const TAIL = 70; // past the last week: ongoing work
const LANE_H = 46;
const TOP = 64;
const BEAD_GAP = 15; // beads never sit closer than this, so short strands stay readable

export function StringTheory({
  plan,
  milestoneById,
  taskStatus,
  currentDay,
  onOpenTask,
}: {
  plan: StringPlan;
  milestoneById: Map<string, { m: JourneyMilestone; stageId: string; index: number }>;
  taskStatus: (m: JourneyMilestone) => TaskDisplayStatus;
  currentDay: number;
  onOpenTask: (stageId: string, milestoneNumber: number) => void;
}) {
  const { weeks, goLiveDay, tailLabel } = plan;
  const weekW = AXIS_W / weeks;
  const xDay = (day: number) => X0 + ((day - 1) / 7) * weekW; // start of a journey day
  const axisEnd = X0 + AXIS_W;
  const width = axisEnd + TAIL + 10;
  // Only workstreams with at least one task in this client's journey.
  const workstreams = plan.workstreams
    .map((w) => ({ w, tasks: w.taskIds.map((id) => milestoneById.get(id)).filter((t): t is NonNullable<typeof t> => Boolean(t)) }))
    .filter((x) => x.tasks.length > 0);
  const height = TOP + workstreams.length * LANE_H + 24;
  // Today sits in the middle of the current day. Past the axis it parks in the tail.
  const todayX = Math.min(xDay(Math.max(1, currentDay) + 0.5), axisEnd + TAIL - 8);
  const goLiveX = xDay(goLiveDay + 1);
  const laneY = (i: number) => TOP + i * LANE_H + LANE_H / 2;
  // A strand runs over its own days. If its beads need more room than that, it
  // grows earlier (never later), so nothing crosses past its end or the go-live
  // line; only if it would run off the left edge does it grow later instead.
  const span = (w: StringWorkstream, n: number) => {
    const end = w.ongoing ? axisEnd + TAIL - 6 : xDay(w.dayEnd + 1) - 6;
    let x1 = xDay(w.dayStart) + 6;
    const need = 8 + (n - 1) * BEAD_GAP;
    const beadEnd = w.ongoing ? Math.min(end, axisEnd) : end;
    if (beadEnd - x1 < need) x1 = Math.max(X0 + 6, beadEnd - need);
    return { x1, x2: Math.max(end, x1 + need) };
  };
  // A strand's state comes from the days, not the drawing.
  const stateOf = (w: StringWorkstream, allDone: boolean) =>
    allDone ? "done" : currentDay < w.dayStart ? "ahead" : w.ongoing || currentDay <= w.dayEnd ? "now" : "behind";
  const index = new Map(workstreams.map((x, i) => [x.w.id, i]));

  return (
    <div className="st-wrap">
      <svg className="st" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Workstreams across the weeks" data-xray="String Theory · SVG, drawn in code" data-xray-tool="code">
        <defs>
          {/* Ongoing strings fade out past the last week. */}
          <linearGradient id="stFade" gradientUnits="userSpaceOnUse" x1={axisEnd - 30} x2={axisEnd + TAIL}>
            <stop offset="0" stopColor="var(--pj-track)" />
            <stop offset="1" stopColor="var(--pj-track)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Week grid */}
        {Array.from({ length: weeks }, (_, i) => (
          <g key={i}>
            <line className="st-grid" x1={X0 + i * weekW} x2={X0 + i * weekW} y1={TOP - 14} y2={height - 18} />
            <text className="st-week" x={X0 + i * weekW + weekW / 2} y={TOP - 18} textAnchor="middle">W{i + 1}</text>
          </g>
        ))}
        <text className="st-week" x={axisEnd + TAIL / 2} y={TOP - 18} textAnchor="middle">{tailLabel}</text>
        <line className="st-golive" x1={goLiveX} x2={goLiveX} y1={TOP - 14} y2={height - 18} />
        <text className="st-golive-label" x={goLiveX - 6} y={height - 4} textAnchor="end">Go-live</text>

        {/* Threads: which workstream feeds which */}
        {workstreams.flatMap(({ w, tasks }, i) =>
          (w.after ?? []).map((from) => {
            const j = index.get(from);
            if (j === undefined) return null;
            const a = span(workstreams[j].w, workstreams[j].tasks.length), b = span(w, tasks.length);
            const xb = b.x1, ya = laneY(j), yb = laneY(i);
            const xa = Math.min(a.x2, xb + 20, xb); // never curve backwards
            const mid = (xa + xb) / 2;
            return <path key={`${from}-${w.id}`} className="st-thread" d={`M ${xa} ${ya} C ${mid} ${ya}, ${mid} ${yb}, ${xb} ${yb}`} pathLength={1} style={{ animationDelay: `${500 + i * 60}ms` }} />;
          }),
        )}

        {/* Strings and beads */}
        {workstreams.map(({ w, tasks }, i) => {
          const y = laneY(i);
          const { x1, x2 } = span(w, tasks.length);
          const statuses = tasks.map((t) => taskStatus(t.m));
          const done = statuses.filter((s) => s === "done").length;
          const state = stateOf(w, done === tasks.length);
          const beadEnd = w.ongoing ? Math.min(x2, axisEnd) : x2;
          const step = tasks.length > 1 ? Math.max(BEAD_GAP, (beadEnd - x1 - 8) / (tasks.length - 1)) : 0;
          return (
            <g key={w.id} className={`st-lane st-lane--${state}`} style={{ animationDelay: `${i * 70}ms` }}>
              <text className="st-name" x={LABEL_W} y={y + 4} textAnchor="end">{w.name}</text>
              <text className="st-count" x={LABEL_W} y={y + 18} textAnchor="end">{done}/{tasks.length}</text>
              <line className="st-string" x1={x1} x2={x2} y1={y} y2={y} pathLength={1} style={{ animationDelay: `${i * 70}ms`, ...(w.ongoing ? { stroke: "url(#stFade)" } : {}) }} />
              {tasks.map((t, k) => (
                <circle
                  key={t.m.id}
                  className={`st-bead st-bead--${statuses[k]}`}
                  cx={x1 + 4 + k * step}
                  cy={y}
                  r={statuses[k] === "your-turn" ? 6.5 : 5}
                  style={{ animationDelay: `${400 + i * 70 + k * 30}ms` }}
                  onClick={() => onOpenTask(t.stageId, t.index + 1)}
                >
                  <title>{t.m.title}</title>
                </circle>
              ))}
            </g>
          );
        })}

        {/* Today */}
        <g className="st-today">
          <line x1={todayX} x2={todayX} y1={TOP - 42} y2={height - 18} />
          <rect x={todayX - 24} y={TOP - 58} width={48} height={16} rx={8} />
          <text x={todayX} y={TOP - 47} textAnchor="middle">Today</text>
        </g>
      </svg>
    </div>
  );
}
