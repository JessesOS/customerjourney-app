"use client";

import { useEffect, useState } from "react";
import type { JourneyMilestone, JourneyStage } from "@/lib/onboardingJourney";
import type { TaskDisplayStatus } from "@/app/components/portal/StatusChip";
import type { StringPlan } from "@/lib/stringPlans";
import { StringTheory } from "@/app/components/portal/StringTheory";

/**
 * The client's progress at a glance (Jesse, 2026-10-15): opened from the
 * "Progress" button in the portal header. Two views of the same tasks:
 *   Timeline: the stages left to right with where they are now, and the
 *             chosen stage's tasks underneath.
 *   Board:    every task in columns by status (Your turn, With us, Coming up,
 *             Done), like a Kanban board, read-only.
 *   String Theory (BSS): the parallel workstreams as strings across the weeks.
 * A colour key under the header explains the four task colours.
 * Built from what the portal already knows (the journey and each task's
 * status), so it moves as the team's ticks arrive from the CSM board.
 * Colours ride the --pj-* tokens, so it follows the client's look.
 */

type View = "timeline" | "board" | "strings";

function when(s: JourneyStage) {
  if (s.ongoing) return "Ongoing";
  return s.dayStart === s.dayEnd ? `Day ${s.dayStart}` : `Days ${s.dayStart}–${s.dayEnd}`;
}

const COLUMNS: { key: TaskDisplayStatus; label: string }[] = [
  { key: "your-turn", label: "Your turn" },
  { key: "with-us", label: "With us" },
  { key: "up-next", label: "Coming up" },
  { key: "done", label: "Done" },
];

function StatusDot({ status }: { status: TaskDisplayStatus }) {
  return <span className={`po-dot po-dot--${status}`} aria-hidden />;
}

export function ProgressOverview({
  stages,
  currentStageIndex,
  currentDay,
  totalDays,
  taskStatus,
  onOpenTask,
  onClose,
  stringPlan,
  calendarDay,
}: {
  stages: JourneyStage[];
  currentStageIndex: number;
  currentDay: number;
  totalDays: number;
  taskStatus: (m: JourneyMilestone) => TaskDisplayStatus;
  onOpenTask: (stageId: string, milestoneIndex: number) => void;
  onClose: () => void;
  /** The product's workstreams for String Theory; no plan, no tab. */
  stringPlan?: StringPlan;
  calendarDay?: number;
}) {
  const [view, setView] = useState<View>("timeline");
  const [picked, setPicked] = useState(Math.max(0, currentStageIndex));
  // Board: "Coming up" is grouped by stage. The current stage starts open,
  // later stages start folded; a click opens or folds one.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(stages[currentStageIndex] ? [stages[currentStageIndex].id] : []));
  const toggleGroup = (id: string) => setOpenGroups((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const all = stages.flatMap((s) => s.milestones.map((m, mi) => ({ m, mi, stage: s, status: taskStatus(m) })));
  const doneCount = all.filter((t) => t.status === "done").length;
  const pct = all.length ? Math.round((doneCount / all.length) * 100) : 0;
  const stage = stages[picked];
  // "With us" only exists where the team has tasks in the client's journey.
  const hasTeamTasks = all.some((t) => t.m.awaitingTeam);
  const columns = COLUMNS.filter((c) => c.key !== "with-us" || hasTeamTasks);
  const milestoneById = new Map(all.map((t) => [t.m.id, { m: t.m, stageId: t.stage.id, index: t.mi }]));
  const views: { key: View; label: string }[] = [
    { key: "timeline", label: "Timeline" },
    { key: "board", label: "Board" },
    ...(stringPlan ? [{ key: "strings" as View, label: "String Theory" }] : []),
  ];

  return (
    <div className="po-scrim" onClick={onClose} role="presentation">
      <div className="po-sheet" role="dialog" aria-modal="true" aria-label="Your progress" onClick={(e) => e.stopPropagation()}>
        <div className="po-head">
          <div>
            <div className="po-kick">Your progress</div>
            <div className="po-sum">
              {doneCount} of {all.length} tasks done · Day {currentDay} of {totalDays} to go-live
            </div>
          </div>
          <div className="po-toggle" role="tablist" aria-label="View">
            {views.map((v) => (
              <button key={v.key} type="button" role="tab" aria-selected={view === v.key} className={view === v.key ? "po-tab po-tab--on" : "po-tab"} onClick={() => setView(v.key)}>
                {v.label}
              </button>
            ))}
          </div>
          <button type="button" className="po-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="po-overall" aria-hidden><i style={{ width: `${pct}%` }} /></div>
        <div className="po-key" aria-label="Colour key">
          <span><StatusDot status="your-turn" /> Your turn: what to do next</span>
          {hasTeamTasks ? <span><StatusDot status="with-us" /> With us: our team&rsquo;s work</span> : null}
          <span><StatusDot status="up-next" /> Coming up: your later tasks</span>
          <span><StatusDot status="done" /> Done</span>
        </div>

        {view === "strings" && stringPlan ? (
          <StringTheory plan={stringPlan!} milestoneById={milestoneById} taskStatus={taskStatus} currentDay={calendarDay ?? currentDay} onOpenTask={onOpenTask} />
        ) : view === "timeline" ? (
          <>
            <div className="po-line">
              {stages.map((s, i) => {
                const n = s.milestones.length;
                const d = s.milestones.filter((m) => taskStatus(m) === "done").length;
                const state = s.status === "done" ? "done" : i === currentStageIndex ? "now" : "later";
                return (
                  <button key={s.id} type="button" onClick={() => setPicked(i)} className={`po-stage po-stage--${state}${i === picked ? " po-stage--picked" : ""}`} style={{ animationDelay: `${i * 70}ms` }}>
                    <span className="po-node" aria-hidden>{state === "done" ? "✓" : i + 1}</span>
                    <span className="po-stage-name">{s.name}</span>
                    <span className="po-stage-when">{when(s)}</span>
                    <span className="po-stage-bar" aria-hidden><i style={{ width: `${n ? (d / n) * 100 : 0}%` }} /></span>
                    <span className="po-stage-count">{d} of {n} done</span>
                    {state === "now" ? <span className="po-here">You are here</span> : null}
                  </button>
                );
              })}
            </div>
            {stage ? (
              <div className="po-tasks" key={stage.id}>
                {stage.milestones.map((m, mi) => {
                  const st = taskStatus(m);
                  return (
                    <button key={m.id} type="button" className="po-task" onClick={() => onOpenTask(stage.id, mi + 1)} style={{ animationDelay: `${mi * 30}ms` }}>
                      <StatusDot status={st} />
                      <span className="po-task-title">{m.title}</span>
                      <span className={`po-chip po-chip--${st}`}>{COLUMNS.find((c) => c.key === st)?.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </>
        ) : (
          <div className="po-board" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(220px, 1fr))` }}>
            {columns.map((col) => {
              const items = all.filter((t) => t.status === col.key);
              const card = (t: (typeof all)[number], showStage: boolean) => (
                <button key={t.m.id} type="button" className="po-card" onClick={() => onOpenTask(t.stage.id, t.mi + 1)}>
                  <span className="po-card-title">{t.m.title}</span>
                  {showStage ? <span className="po-card-stage">{t.stage.name}</span> : null}
                </button>
              );
              return (
                <div key={col.key} className="po-col">
                  <div className="po-col-head">
                    <StatusDot status={col.key} />
                    {col.label}
                    <span className="po-col-n">{items.length}</span>
                  </div>
                  <div className="po-col-body">
                    {items.length === 0 ? <div className="po-empty">Nothing here</div> : null}
                    {col.key === "up-next"
                      ? stages.map((s) => {
                          const group = items.filter((t) => t.stage.id === s.id);
                          if (!group.length) return null;
                          const open = openGroups.has(s.id);
                          return (
                            <div key={s.id} className="po-group">
                              <button type="button" className="po-group-head" aria-expanded={open} onClick={() => toggleGroup(s.id)}>
                                <span>{s.name}</span>
                                <span className="po-col-n">{group.length}</span>
                                <svg className="po-group-chev" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: open ? "rotate(180deg)" : "none" }}>
                                  <path d="M6 9l6 6 6-6" />
                                </svg>
                              </button>
                              {open ? group.map((t) => card(t, false)) : null}
                            </div>
                          );
                        })
                      : items.map((t) => card(t, true))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
