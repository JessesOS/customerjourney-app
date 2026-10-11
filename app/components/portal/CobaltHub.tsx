"use client";

import type { ReactNode } from "react";
import type { JourneyMilestone, JourneyStage } from "@/lib/onboardingJourney";
import type { TaskDisplayStatus } from "@/app/components/portal/StatusChip";

/**
 * Journey page in the motion-redesign look (bar and design system in
 * motion/). Same frame as the other designs: sticky header with the stage
 * strip, an optional journey rail, and one main card holding the stage
 * title, the up-next action and the expandable task list. What changes is
 * the look: white cards on a mist ground, 28 px corners, hairlines, no
 * shadows, one family (Geist), a one-word stage title at display size.
 * Cobalt is kept to the current segment of the stage strip and the one
 * primary button. Colours ride the --pj-* tokens set by
 * [data-pj-design="cobalt"].
 */

function days(s: JourneyStage, one = "Day", many = "Days") {
  return s.dayStart === s.dayEnd ? `${one} ${s.dayStart}` : `${many} ${s.dayStart}–${s.dayEnd}`;
}

function Mark({ state }: { state: "done" | "current" | "future" }) {
  if (state === "done") {
    return (
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--pj-ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--pj-bg)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 13l4 4 10-12" />
        </svg>
      </span>
    );
  }
  return <span style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${state === "current" ? "var(--pj-ink)" : "var(--pj-line)"}`, boxSizing: "border-box", flexShrink: 0 }} />;
}

const label: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--pj-muted)", lineHeight: 1.3 };

export function CobaltHub({
  brand,
  clientLabel,
  name,
  currentDay,
  totalDays,
  stages,
  currentStageIndex,
  stageDoneCount,
  overallPercent,
  upNext,
  upNextDetail,
  onStartUpNext,
  onOpenTask,
  onSelectStage,
  taskStatus,
  tasksOpen,
  onToggleTasks,
  showRail,
  orbSlot,
  children,
}: {
  brand: string;
  clientLabel: string;
  name: string;
  currentDay: number;
  totalDays: number;
  stages: JourneyStage[];
  currentStageIndex: number;
  stageDoneCount: number;
  overallPercent: number;
  upNext?: JourneyMilestone;
  upNextDetail?: string;
  onStartUpNext?: () => void;
  onOpenTask: (milestoneIndex: number) => void;
  onSelectStage: (stageId: string) => void;
  taskStatus: (m: JourneyMilestone) => TaskDisplayStatus;
  tasksOpen: boolean;
  onToggleTasks: () => void;
  showRail: boolean;
  orbSlot?: ReactNode;
  children?: ReactNode;
}) {
  const stage = stages[currentStageIndex];
  const tasks = stage?.milestones ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--pj-rail)", color: "var(--pj-ink)", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      {/* Header and stage strip */}
      <header style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--pj-card)", borderBottom: "1px solid var(--pj-line)" }}>
        <div className="gx-wrap" style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 16, paddingBottom: 14 }}>
          <span style={{ fontWeight: 600, fontSize: 19, letterSpacing: "-0.02em" }}>{brand}</span>
          <span style={{ ...label, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{clientLabel}</span>
          <span style={{ ...label, marginLeft: "auto", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            Day {currentDay} / {totalDays} · <span style={{ color: "var(--pj-ink)" }}>on track</span>
          </span>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--pj-ink)", color: "var(--pj-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
            {name.charAt(0)}
          </span>
        </div>
        <div className="gx-wrap" style={{ display: "flex", gap: 6, paddingBottom: 14 }} aria-hidden>
          {stages.map((s, i) => (
            <span key={s.id} style={{ flex: 1, height: 4, borderRadius: 2, background: s.status === "done" ? "var(--pj-ink)" : i === currentStageIndex ? "var(--pj-act)" : "var(--pj-line)" }} />
          ))}
        </div>
      </header>

      <div className="gx-wrap gx-main-row">
        {/* Journey rail */}
        {showRail ? (
          <aside className="gx-rail">
            <div style={{ ...label, margin: "0 10px 12px" }}>Your journey</div>
            {stages.map((s, i) => {
              const done = s.status === "done", now = i === currentStageIndex && !done;
              const doneCount = s.milestones.filter((m) => m.status === "done").length;
              const meta = done
                ? `All ${s.milestones.length} tasks done · ${days(s, "Days")}`
                : now
                  ? `${doneCount} of ${s.milestones.length} done · ${days(s, "Days")}`
                  : `${s.milestones.length} tasks · ${days(s, "Day", "Day")}`;
              return (
                <button key={s.id} type="button" onClick={() => onSelectStage(s.id)} className={now ? "gx-stage gx-stage--now" : "gx-stage"}>
                  <Mark state={done ? "done" : now ? "current" : "future"} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: 16, fontWeight: now ? 600 : 500, color: done || now ? "var(--pj-ink)" : "var(--pj-muted)" }}>{s.name}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--pj-muted)", marginTop: 2 }}>{meta}</span>
                  </span>
                </button>
              );
            })}
            <div style={{ borderTop: "1px solid var(--pj-line)", margin: "14px 10px 0", paddingTop: 16 }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={label}>Overall progress</span>
                <b style={{ marginLeft: "auto", fontSize: 16, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{overallPercent}%</b>
              </div>
              <div style={{ height: 6, borderRadius: 6, background: "var(--pj-track)", overflow: "hidden", margin: "10px 0 8px" }}>
                <span style={{ display: "block", height: "100%", width: `${overallPercent}%`, background: "var(--pj-ink)", borderRadius: 6 }} />
              </div>
              <span style={{ fontSize: 12.5, color: "var(--pj-muted)" }}>of the journey complete</span>
            </div>
          </aside>
        ) : null}

        {/* Main card */}
        <main className="gx-card" key={stage?.id}>
          {orbSlot ? <div className="gx-orb">{orbSlot}</div> : null}
          <div className="gx-rise" style={label}>
            Stage {currentStageIndex + 1} of {stages.length} · {stage ? days(stage) : ""}
          </div>
          <h2 className="gx-title gx-rise" style={{ animationDelay: "80ms" }}>{stage?.name}</h2>
          {stage?.blurb ? (
            <p className="gx-rise" style={{ fontSize: 18, lineHeight: 1.45, color: "var(--pj-muted)", maxWidth: "52ch", margin: 0, animationDelay: "160ms" }}>
              {stage.blurb}
            </p>
          ) : null}

          {/* Up next: the one action on the page */}
          <div className="gx-next gx-rise" style={{ animationDelay: "240ms" }}>
            <div style={{ minWidth: 0 }}>
              <div style={label}>Up next for you</div>
              <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.17, letterSpacing: "-0.01em", marginTop: 8 }}>{upNext ? upNext.title : "We’re preparing your next step"}</div>
              <p style={{ fontSize: 16, lineHeight: 1.47, color: "var(--pj-muted)", margin: "6px 0 0", maxWidth: "52ch" }}>
                {upNext ? (upNextDetail ?? upNext.detail) : "Nothing needed from you right now — we’ll flag you the moment there’s something to review."}
              </p>
            </div>
            {upNext ? (
              <button type="button" onClick={onStartUpNext} className="gx-primary">
                Start this task →
              </button>
            ) : null}
          </div>

          {/* All tasks in this stage: expands in place, right under the action */}
          <div className="gx-tasks gx-rise" style={{ animationDelay: "320ms" }}>
            <button type="button" onClick={onToggleTasks} aria-expanded={tasksOpen} className="gx-toggle">
              <span className="gx-toggle-title">All tasks in this stage</span>
              {/* One segment per task, so the whole stage reads at a glance */}
              <span className="gx-segs" aria-hidden data-xray="Task segments · CSS, drawn in code" data-xray-tool="code">
                {tasks.map((m, i) => {
                  const st = taskStatus(m);
                  return (
                    <span key={m.id} className={st === "your-turn" ? "gx-seg gx-seg--now" : "gx-seg"}>
                      {st === "done" || st === "your-turn" ? <i style={{ animationDelay: `${400 + i * 70}ms` }} /> : null}
                    </span>
                  );
                })}
              </span>
              <span style={{ ...label, marginLeft: "auto", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {stageDoneCount} / {tasks.length} done · <span style={{ color: "var(--pj-ink)" }}>{tasksOpen ? "Hide" : "Show"}</span>
              </span>
              <span className="gx-chev" style={{ transform: tasksOpen ? "rotate(180deg)" : "none" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>
            {tasksOpen
              ? tasks.map((m, mi) => {
                  const st = taskStatus(m);
                  const done = st === "done", now = st === "your-turn";
                  return (
                    <div key={m.id} className={now ? "gx-row gx-row--now" : "gx-row"} style={{ animationDelay: `${mi * 40}ms` }}>
                      <Mark state={done ? "done" : now ? "current" : "future"} />
                      <span style={{ fontSize: 16, fontWeight: now ? 600 : 400, color: done ? "var(--pj-muted)" : "var(--pj-ink)", minWidth: 0 }}>{m.title}</span>
                      <span style={{ marginLeft: "auto", flexShrink: 0 }}>
                        {done ? (
                          <button type="button" onClick={() => onOpenTask(mi)} className="gx-view">View</button>
                        ) : now ? (
                          <button type="button" onClick={() => onOpenTask(mi)} className="gx-small">Start</button>
                        ) : (
                          <span className="gx-chip">{st === "with-us" ? "With us" : "Up next"}</span>
                        )}
                      </span>
                    </div>
                  );
                })
              : null}
          </div>

          {/* Happening with us */}
          {stage && stage.statusNotes.length > 0 ? (
            <div style={{ marginTop: 28 }}>
              <div style={label}>Happening with us</div>
              <ul style={{ listStyle: "none", padding: "16px 20px", margin: "10px 0 0", display: "grid", gap: 8, background: "var(--pj-rail)", borderRadius: 18 }}>
                {stage.statusNotes.map((note) => (
                  <li key={note} style={{ fontSize: 15, lineHeight: 1.47 }}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {children}
        </main>
      </div>
    </div>
  );
}
