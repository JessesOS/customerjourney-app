"use client";

import type { JourneyMilestone } from "@/lib/onboardingJourney";
import type { Workstream } from "@/lib/bssJourney";
import type { TaskDisplayStatus } from "@/app/components/portal/StatusChip";

/**
 * "String Theory" (Jesse, 2026-10-15): the project as parallel strings across
 * the weeks. One string per workstream, drawn over the weeks it runs; a bead per
 * task, coloured by status; the string fills as its tasks are done. Threads
 * show which workstream feeds the next. A line marks today. Read at a glance:
 * which strands are running now, which are finished, which are still ahead.
 * Drawn in SVG, coloured by the --pj-* tokens; the strings draw in on open.
 */

const LABEL_W = 210; // left gutter for workstream names
const WEEK0 = LABEL_W + 10;
const WEEKS = 10;
const WEEK_W = 66;
const TAIL = 70; // past week 10: support continues to month 8
const LANE_H = 46;
const TOP = 64;

const xAt = (week: number) => WEEK0 + (week - 1) * WEEK_W; // start of a week

export function StringTheory({
  workstreams,
  milestoneById,
  taskStatus,
  currentDay,
  onOpenTask,
}: {
  workstreams: Workstream[];
  milestoneById: Map<string, { m: JourneyMilestone; stageId: string; index: number }>;
  taskStatus: (m: JourneyMilestone) => TaskDisplayStatus;
  currentDay: number;
  onOpenTask: (stageId: string, milestoneNumber: number) => void;
}) {
  const width = xAt(WEEKS + 1) + TAIL + 10;
  const height = TOP + workstreams.length * LANE_H + 24;
  const todayX = xAt(1) + ((currentDay - 1) / 7) * WEEK_W;
  const laneY = (i: number) => TOP + i * LANE_H + LANE_H / 2;
  const span = (w: Workstream) => ({ x1: xAt(w.weekStart) + 6, x2: (w.ongoing ? xAt(WEEKS + 1) + TAIL : xAt(w.weekEnd + 1)) - 6 });
  const index = new Map(workstreams.map((w, i) => [w.id, i]));

  return (
    <div className="st-wrap">
      <svg className="st" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Workstreams across the weeks" data-xray="String Theory · SVG, drawn in code" data-xray-tool="code">
        <defs>
          {/* The support string fades out past week 10 (it runs on to month 8). */}
          <linearGradient id="stFade" gradientUnits="userSpaceOnUse" x1={xAt(WEEKS + 1) - 30} x2={xAt(WEEKS + 1) + TAIL}>
            <stop offset="0" stopColor="var(--pj-track)" />
            <stop offset="1" stopColor="var(--pj-track)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Week grid */}
        {Array.from({ length: WEEKS }, (_, i) => (
          <g key={i}>
            <line className="st-grid" x1={xAt(i + 1)} x2={xAt(i + 1)} y1={TOP - 14} y2={height - 18} />
            <text className="st-week" x={xAt(i + 1) + WEEK_W / 2} y={TOP - 18} textAnchor="middle">W{i + 1}</text>
          </g>
        ))}
        <text className="st-week" x={xAt(WEEKS + 1) + TAIL / 2} y={TOP - 18} textAnchor="middle">→ M8</text>
        <line className="st-golive" x1={xAt(7) - 1} x2={xAt(7) - 1} y1={TOP - 14} y2={height - 18} />
        <text className="st-golive-label" x={xAt(7) - 6} y={height - 4} textAnchor="end">Go-live</text>

        {/* Threads: which workstream feeds which */}
        {workstreams.flatMap((w, i) =>
          (w.after ?? []).map((from) => {
            const j = index.get(from);
            if (j === undefined) return null;
            const a = span(workstreams[j]), b = span(w);
            const xa = Math.min(a.x2, b.x1 + 20), ya = laneY(j), xb = b.x1, yb = laneY(i);
            const mid = (xa + xb) / 2;
            return <path key={`${from}-${w.id}`} className="st-thread" d={`M ${xa} ${ya} C ${mid} ${ya}, ${mid} ${yb}, ${xb} ${yb}`} pathLength={1} style={{ animationDelay: `${500 + i * 60}ms` }} />;
          }),
        )}

        {/* Strings and beads */}
        {workstreams.map((w, i) => {
          const y = laneY(i);
          const { x1, x2 } = span(w);
          const tasks = w.taskIds.map((id) => milestoneById.get(id)).filter((t): t is NonNullable<typeof t> => Boolean(t));
          const statuses = tasks.map((t) => taskStatus(t.m));
          const done = statuses.filter((s) => s === "done").length;
          const state = done === tasks.length && tasks.length ? "done" : todayX >= x1 && todayX <= x2 ? "now" : todayX > x2 ? "behind" : "ahead";
          const step = tasks.length > 1 ? (Math.min(x2, w.ongoing ? xAt(WEEKS + 1) : x2) - x1 - 8) / (tasks.length - 1) : 0;
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
