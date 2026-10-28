"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ProgressOverview } from "@/app/components/portal/ProgressOverview";
import type { JourneyMilestone, JourneyStage, StringPlan } from "@/lib/journeyTypes";
import type { TaskDisplayStatus } from "@/app/components/portal/StatusChip";
import { AURORA_PALETTES, WaveField } from "@/app/components/portal/AuroraHub";

/**
 * Journey page in the "Grove" look (motion redesign, third direction,
 * 2026-10-11). Jesse's brief: very clean, not distracting, neither as warm
 * as the original nor as cold as Cobalt; reference clay.com (white
 * surfaces, near-black type, one deep green field, one lime action) and
 * Vercel's type (Geist, with Geist Mono for small labels and figures).
 * Same frame and functions as the other designs. The colour lives in one
 * place: a green band holding the stage and its one action. Motion is kept
 * to the journey rail (the progress line draws to the current stage, which
 * breathes) and the page's entrance. Colours ride the --pj-* tokens set by
 * [data-pj-design="grove"].
 */

const STEP = 68; // height of one rail step, so the progress line can be measured

function days(s: JourneyStage, one = "Day", many = "Days") {
  if (s.ongoing) return "";
  return s.dayStart === s.dayEnd ? `${one} ${s.dayStart}` : `${many} ${s.dayStart}–${s.dayEnd}`;
}

function Check({ size = 10, stroke = "#fff" }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 13l4 4 10-12" />
    </svg>
  );
}

function Node({ state }: { state: "done" | "current" | "future" }) {
  return <span className={`gv-node gv-node--${state}`}>{state === "done" ? <Check /> : null}</span>;
}

export function GroveHub({
  brand,
  clientLabel,
  name,
  person,
  currentDay,
  totalDays,
  stages,
  currentStageIndex,
  stageDoneCount,
  stagePct,
  overallPercent,
  upNext,
  upNextDetail,
  onStartUpNext,
  onOpenTask,
  onSelectStage,
  onOpenStageTask,
  stringPlan,
  calendarDay,
  taskStatus,
  tasksOpen,
  onToggleTasks,
  showRail,
  aurora = false,
  orbSlot,
  children,
}: {
  brand: string;
  clientLabel: string;
  name: string;
  /** Who's this? (products with people): the name picked on this device. The initial becomes theirs and asks again on tap. */
  person?: string;
  currentDay: number;
  totalDays: number;
  stages: JourneyStage[];
  currentStageIndex: number;
  stageDoneCount: number;
  stagePct: number;
  overallPercent: number;
  upNext?: JourneyMilestone;
  upNextDetail?: string;
  onStartUpNext?: () => void;
  onOpenTask: (milestoneIndex: number) => void;
  onSelectStage: (stageId: string) => void;
  /** Opens any task, in any stage (used by the progress view). */
  onOpenStageTask?: (stageId: string, milestoneNumber: number) => void;
  /** Workstreams for the String Theory view (products that have one). */
  stringPlan?: StringPlan;
  calendarDay?: number;
  taskStatus: (m: JourneyMilestone) => TaskDisplayStatus;
  tasksOpen: boolean;
  onToggleTasks: () => void;
  showRail: boolean;
  /** "Grove Aurora": the same page with the Aurora welcome's colours as the
      accents. The band turns to night with the stage's field of lines, and the
      rail's fade takes the same hues. Everything else stays Grove. */
  aurora?: boolean;
  orbSlot?: ReactNode;
  children?: ReactNode;
}) {
  // Clicking a stage in the rail shows that stage's own page (band, tasks, notes)
  // rather than opening its first task (Jesse, 2026-10-16). It follows the
  // client's current stage until they pick another.
  // Once every task is done there is no current stage (index -1); home is
  // then the last stage, shown as complete.
  const allDone = currentStageIndex < 0;
  const homeIndex = allDone ? Math.max(0, stages.length - 1) : currentStageIndex;
  const [shown, setShown] = useState(homeIndex);
  useEffect(() => setShown(homeIndex), [homeIndex]);
  const isCurrent = !allDone && shown === currentStageIndex;
  const stage = stages[shown] ?? stages[homeIndex];
  const tasks = stage?.milestones ?? [];
  const shownDone = tasks.filter((m) => m.status === "done").length;
  const openTask = (mi: number) => (isCurrent ? onOpenTask(mi) : onOpenStageTask ? onOpenStageTask(stage.id, mi + 1) : onSelectStage(stage.id));
  const showStage = (i: number) => { setShown(i); window.scrollTo({ top: 0, behavior: "smooth" }); };
  // The client's list shows their own tasks; the team's work in this stage is
  // one summary line (Jesse, 2026-10-16). The full picture is in Progress.
  const myTasks = tasks.map((m, mi) => ({ m, mi })).filter((t) => !t.m.awaitingTeam);
  const teamTasks = tasks.filter((m) => m.awaitingTeam);
  const teamDone = teamTasks.filter((m) => m.status === "done").length;
  const myDone = myTasks.filter((t) => t.m.status === "done").length;
  const pct = Math.max(0, Math.min(100, isCurrent ? stagePct : tasks.length ? (shownDone / tasks.length) * 100 : 0));
  const pal = AURORA_PALETTES[Math.max(0, shown) % AURORA_PALETTES.length];
  const [progressOpen, setProgressOpen] = useState(false);

  return (
    <div
      className={aurora ? "gv-page gv-page--aurora" : "gv-page"}
      style={aurora ? ({ "--ax-a": pal[0], "--ax-b": pal[1], "--ax-c": pal[2] } as React.CSSProperties) : undefined}
    >
      <header className="gv-header">
        <div className="gv-wrap" style={{ display: "flex", alignItems: "center", gap: 14, height: 64 }}>
          <button
            type="button"
            className="pj-home-link"
            onClick={() => { setProgressOpen(false); showStage(homeIndex); }}
            title="Home"
            style={{ fontWeight: 600, fontSize: 19, letterSpacing: "-0.03em" }}
          >
            {brand}
          </button>
          <span style={{ width: 1, height: 18, background: "var(--pj-line)" }} />
          <span className="gv-muted" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{clientLabel}</span>
          <button type="button" className="gv-progress-btn" onClick={() => setProgressOpen(true)} style={{ marginLeft: "auto" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M4 6h10M4 12h16M4 18h7" />
            </svg>
            <span className="gv-progress-label">Progress</span>
          </button>
          <span className="gv-mono gv-daycount" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
            Day {currentDay} / {totalDays} · <span style={{ color: "var(--pj-act)" }}>on track</span>
          </span>
          {person ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("pjc:who"))}
              aria-label={`You're ${person}. Not you? Change`}
              title={`You're ${person} · tap if not you`}
              style={{ width: 32, height: 32, borderRadius: "50%", border: 0, padding: 0, cursor: "pointer", background: "var(--pj-ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, flexShrink: 0 }}
            >
              {person.charAt(0)}
            </button>
          ) : (
            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--pj-ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
              {name.charAt(0)}
            </span>
          )}
        </div>
      </header>

      {progressOpen ? (
        <ProgressOverview
          stages={stages}
          currentStageIndex={currentStageIndex}
          currentDay={currentDay}
          totalDays={totalDays}
          taskStatus={taskStatus}
          stringPlan={stringPlan}
          calendarDay={calendarDay}
          onOpenTask={(stageId, n) => { setProgressOpen(false); if (onOpenStageTask) onOpenStageTask(stageId, n); else onSelectStage(stageId); }}
          onClose={() => setProgressOpen(false)}
        />
      ) : null}

      <div className="gv-wrap gv-main-row">
        {/* Journey rail: a stepper whose line draws down to the current stage */}
        {showRail ? (
          <aside className="gv-rail">
            <div className="gv-mono gv-kick" style={{ margin: "0 0 14px 2px" }}>Your journey</div>
            <div style={{ position: "relative" }}>
              <span className="gv-line" style={{ top: STEP / 2, height: STEP * (stages.length - 1) }}>
                <i style={{ height: `${stages.length > 1 ? (homeIndex / (stages.length - 1)) * 100 : 0}%` }} />
              </span>
              {stages.map((s, i) => {
                const done = s.status === "done", now = i === currentStageIndex && !done;
                const doneCount = s.milestones.filter((m) => m.status === "done").length;
                const when = (one: string, many: string) => (s.ongoing ? "" : ` · ${days(s, one, many)}`);
                const meta = done
                  ? `All ${s.milestones.length} tasks done${when("Days", "Days")}`
                  : now
                    ? `${doneCount} of ${s.milestones.length} done${when("Days", "Days")}`
                    : `${s.milestones.length} tasks${when("Day", "Day")}`;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => showStage(i)}
                    aria-current={i === shown ? "page" : undefined}
                    className={i === shown ? "gv-step gv-step--now" : "gv-step"}
                    style={{ height: STEP, animationDelay: `${120 + i * 70}ms` }}
                  >
                    <Node state={done ? "done" : now ? "current" : "future"} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 15.5, fontWeight: now ? 600 : 500, letterSpacing: "-0.01em", color: done || now ? "var(--pj-ink)" : "var(--pj-muted)" }}>{s.name}</span>
                      <span style={{ display: "block", fontSize: 12.5, color: "var(--pj-muted)", marginTop: 2 }}>{meta}</span>
                    </span>
                    <svg className="gv-step-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                );
              })}
            </div>
            <div style={{ borderTop: "1px solid var(--gv-rail-edge, #cfe2d4)", marginTop: 18, paddingTop: 18 }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span className="gv-mono gv-kick">Overall progress</span>
                <b className="gv-mono" style={{ marginLeft: "auto", fontSize: 14, color: "var(--pj-ink)", fontWeight: 500 }}>{overallPercent}%</b>
              </div>
              <div style={{ height: 4, borderRadius: 4, background: "var(--gv-rail-track, #c9dfcf)", overflow: "hidden", margin: "10px 0 8px" }}>
                <span className="gv-grow" style={{ display: "block", height: "100%", width: `${overallPercent}%`, background: "var(--pj-act)", borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12.5, color: "var(--pj-muted)" }}>of the journey complete</span>
            </div>
          </aside>
        ) : null}

        <main className="gv-main" key={stage?.id}>
          {/* The one field of colour: where you are, and the one thing to do */}
          <section className="gv-band">
            {aurora ? <WaveField key={shown} seed={shown} animate sparks={false} lines={38} className="gv-field" /> : null}
            <svg className="gv-hills" viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden data-xray="Hills · SVG, drawn in code" data-xray-tool="code">
              <path d="M0 150 C 180 70, 330 90, 520 140 S 900 190, 1200 90 V220 H0Z" fill="rgba(255,255,255,0.05)" />
              <path d="M0 190 C 220 120, 420 150, 640 180 S 1000 140, 1200 170 V220 H0Z" fill="rgba(255,255,255,0.06)" />
            </svg>
            {orbSlot && isCurrent ? <div className="gv-orb">{orbSlot}</div> : null}
            <div className="gv-in" style={{ position: "relative" }}>
              <div className="gv-mono gv-kick" style={{ color: "rgba(255,255,255,0.72)" }}>
                Stage {shown + 1} of {stages.length}{stage && !stage.ongoing ? ` · ${days(stage)}` : ""}
              </div>
              <h2 className="gv-title">{stage?.name}</h2>
              {stage?.blurb ? <p style={{ fontSize: 17, lineHeight: 1.5, color: "rgba(255,255,255,0.82)", maxWidth: "52ch", margin: "0 0 4px" }}>{stage.blurb}</p> : null}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
                <span className="gv-bar"><i className="gv-grow" style={{ width: `${pct}%` }} /></span>
                <span className="gv-mono" style={{ color: "rgba(255,255,255,0.82)" }}>{isCurrent ? stageDoneCount : shownDone} / {tasks.length} done</span>
              </div>
            </div>

            {!isCurrent ? (
              <div className="gv-next gv-in" style={{ animationDelay: "140ms" }}>
                <div style={{ minWidth: 0 }}>
                  <div className="gv-mono gv-kick" style={{ color: "var(--pj-muted)" }}>{stage.status === "done" ? "Complete" : "Coming up"}</div>
                  <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.02em", marginTop: 8 }}>
                    {stage.status === "done" ? "All done here" : stage.ongoing ? "This stage starts after go-live" : `This stage starts on day ${stage.dayStart}`}
                  </div>
                  <p style={{ fontSize: 15.5, lineHeight: 1.5, color: "var(--pj-muted)", margin: "6px 0 0", maxWidth: "54ch" }}>
                    {stage.status === "done" ? "Every task in this stage is complete." : "Here’s what’s ahead. Nothing for you to do here yet."}
                  </p>
                </div>
                {shown !== homeIndex ? (
                  <button type="button" onClick={() => showStage(homeIndex)} className="gv-primary">
                    Back to {stages[homeIndex]?.name ?? "your stage"} <span aria-hidden>→</span>
                  </button>
                ) : null}
              </div>
            ) : (
            <div className="gv-next gv-in" style={{ animationDelay: "140ms" }}>
              <div style={{ minWidth: 0 }}>
                <div className="gv-mono gv-kick" style={{ color: "var(--pj-muted)" }}>Up next for you</div>
                <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.02em", marginTop: 8 }}>{upNext ? upNext.title : "We’re preparing your next step"}</div>
                <p style={{ fontSize: 15.5, lineHeight: 1.5, color: "var(--pj-muted)", margin: "6px 0 0", maxWidth: "54ch" }}>
                  {upNext ? (upNextDetail ?? upNext.detail) : "Nothing needed from you right now — we’ll flag you the moment there’s something to review."}
                </p>
              </div>
              {upNext ? (
                <button type="button" onClick={onStartUpNext} className="gv-primary">
                  Start this task <span aria-hidden>→</span>
                </button>
              ) : null}
            </div>
            )}
          </section>

          {/* All tasks in this stage: expands in place */}
          <div className="gv-card gv-in" style={{ animationDelay: "220ms", overflow: "hidden" }}>
            <button type="button" onClick={onToggleTasks} aria-expanded={tasksOpen} className="gv-toggle">
              <span className="gv-toggle-title">{teamTasks.length ? "Your tasks in this stage" : "All tasks in this stage"}</span>
              <span className="gv-dots" aria-hidden>
                {myTasks.map(({ m }) => {
                  const st = taskStatus(m);
                  return <span key={m.id} className={st === "done" ? "gv-dot gv-dot--done" : st === "your-turn" ? "gv-dot gv-dot--now" : "gv-dot"} />;
                })}
              </span>
              <span className="gv-mono" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>
                {teamTasks.length ? `${myDone} / ${myTasks.length}` : `${shownDone} / ${tasks.length}`} done · <span style={{ color: "var(--pj-ink)" }}>{tasksOpen ? "Hide" : "Show"}</span>
              </span>
              <span className="gv-chev" style={{ transform: tasksOpen ? "rotate(180deg)" : "none" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>
            {tasksOpen && teamTasks.length > 0 && myTasks.length === 0 ? (
              <div className="gv-row gv-row--team">Nothing for you to do in this stage.</div>
            ) : null}
            {tasksOpen
              ? myTasks.map(({ m, mi }, k) => {
                  const st = taskStatus(m);
                  const done = st === "done", now = st === "your-turn";
                  return (
                    <div key={m.id} className={now ? "gv-row gv-row--now" : "gv-row"} style={{ animationDelay: `${k * 35}ms` }}>
                      <span className="gv-mono" style={{ width: 22, color: "var(--pj-faint)" }}>{String(k + 1).padStart(2, "0")}</span>
                      <Node state={done ? "done" : now ? "current" : "future"} />
                      <span style={{ fontSize: 15.5, fontWeight: now ? 600 : 400, color: done ? "var(--pj-muted)" : "var(--pj-ink)", minWidth: 0 }}>{m.title}</span>
                      <span style={{ marginLeft: "auto", flexShrink: 0 }}>
                        {done ? (
                          <button type="button" onClick={() => openTask(mi)} className="gv-view">View</button>
                        ) : now ? (
                          <button type="button" onClick={() => openTask(mi)} className="gv-small">Start</button>
                        ) : (
                          <button type="button" onClick={() => openTask(mi)} className="gv-chip gv-chip--link">{st === "with-us" ? "With us" : "Up next"}</button>
                        )}
                      </span>
                    </div>
                  );
                })
              : null}
            {teamTasks.length > 0 ? (
              <div className="gv-row gv-row--team">
                <span className="gv-team-dot" aria-hidden />
                <span>
                  Our team: {teamDone} of {teamTasks.length} done this stage
                </span>
              </div>
            ) : null}
          </div>

          {/* Happening with us */}
          {stage && stage.statusNotes.length > 0 ? (
            <div className="gv-note gv-in" style={{ animationDelay: "300ms" }}>
              <div className="gv-mono gv-kick">Happening with us</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0", display: "grid", gap: 6 }}>
                {stage.statusNotes.map((note) => (
                  <li key={note} style={{ fontSize: 15, lineHeight: 1.5 }}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {isCurrent ? children : null}
        </main>
      </div>
    </div>
  );
}
