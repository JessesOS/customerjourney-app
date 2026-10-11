"use client";

import type { ReactNode } from "react";
import type { JourneyMilestone, JourneyStage } from "@/lib/onboardingJourney";
import type { TaskDisplayStatus } from "@/app/components/portal/StatusChip";

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
  stagePct: number;
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
  const pct = Math.max(0, Math.min(100, stagePct));

  return (
    <div className="gv-page">
      <header className="gv-header">
        <div className="gv-wrap" style={{ display: "flex", alignItems: "center", gap: 14, height: 64 }}>
          <span style={{ fontWeight: 600, fontSize: 19, letterSpacing: "-0.03em" }}>{brand}</span>
          <span style={{ width: 1, height: 18, background: "var(--pj-line)" }} />
          <span className="gv-muted" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{clientLabel}</span>
          <span className="gv-mono" style={{ marginLeft: "auto", whiteSpace: "nowrap", flexShrink: 0 }}>
            Day {currentDay} / {totalDays} · <span style={{ color: "var(--pj-act)" }}>on track</span>
          </span>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--pj-ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
            {name.charAt(0)}
          </span>
        </div>
      </header>

      <div className="gv-wrap gv-main-row">
        {/* Journey rail: a stepper whose line draws down to the current stage */}
        {showRail ? (
          <aside className="gv-rail">
            <div className="gv-mono gv-kick" style={{ margin: "0 0 14px 2px" }}>Your journey</div>
            <div style={{ position: "relative" }}>
              <span className="gv-line" style={{ top: STEP / 2, height: STEP * (stages.length - 1) }}>
                <i style={{ height: `${stages.length > 1 ? (currentStageIndex / (stages.length - 1)) * 100 : 0}%` }} />
              </span>
              {stages.map((s, i) => {
                const done = s.status === "done", now = i === currentStageIndex && !done;
                const doneCount = s.milestones.filter((m) => m.status === "done").length;
                const meta = done
                  ? `All ${s.milestones.length} tasks done · ${days(s, "Days")}`
                  : now
                    ? `${doneCount} of ${s.milestones.length} done · ${days(s, "Days")}`
                    : `${s.milestones.length} tasks · ${days(s, "Day", "Day")}`;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelectStage(s.id)}
                    className={now ? "gv-step gv-step--now" : "gv-step"}
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
            <div style={{ borderTop: "1px solid var(--pj-line)", marginTop: 18, paddingTop: 18 }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span className="gv-mono gv-kick">Overall progress</span>
                <b className="gv-mono" style={{ marginLeft: "auto", fontSize: 14, color: "var(--pj-ink)", fontWeight: 500 }}>{overallPercent}%</b>
              </div>
              <div style={{ height: 4, borderRadius: 4, background: "var(--pj-track)", overflow: "hidden", margin: "10px 0 8px" }}>
                <span className="gv-grow" style={{ display: "block", height: "100%", width: `${overallPercent}%`, background: "var(--pj-act)", borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12.5, color: "var(--pj-muted)" }}>of the journey complete</span>
            </div>
          </aside>
        ) : null}

        <main className="gv-main" key={stage?.id}>
          {/* The one field of colour: where you are, and the one thing to do */}
          <section className="gv-band">
            <svg className="gv-hills" viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden data-xray="Hills · SVG, drawn in code" data-xray-tool="code">
              <path d="M0 150 C 180 70, 330 90, 520 140 S 900 190, 1200 90 V220 H0Z" fill="rgba(255,255,255,0.05)" />
              <path d="M0 190 C 220 120, 420 150, 640 180 S 1000 140, 1200 170 V220 H0Z" fill="rgba(255,255,255,0.06)" />
            </svg>
            {orbSlot ? <div className="gv-orb">{orbSlot}</div> : null}
            <div className="gv-in" style={{ position: "relative" }}>
              <div className="gv-mono gv-kick" style={{ color: "rgba(255,255,255,0.72)" }}>
                Stage {currentStageIndex + 1} of {stages.length} · {stage ? days(stage) : ""}
              </div>
              <h2 className="gv-title">{stage?.name}</h2>
              {stage?.blurb ? <p style={{ fontSize: 17, lineHeight: 1.5, color: "rgba(255,255,255,0.82)", maxWidth: "52ch", margin: "0 0 4px" }}>{stage.blurb}</p> : null}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
                <span className="gv-bar"><i className="gv-grow" style={{ width: `${pct}%` }} /></span>
                <span className="gv-mono" style={{ color: "rgba(255,255,255,0.82)" }}>{stageDoneCount} / {tasks.length} done</span>
              </div>
            </div>

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
          </section>

          {/* All tasks in this stage: expands in place */}
          <div className="gv-card gv-in" style={{ animationDelay: "220ms", overflow: "hidden" }}>
            <button type="button" onClick={onToggleTasks} aria-expanded={tasksOpen} className="gv-toggle">
              <span className="gv-toggle-title">All tasks in this stage</span>
              <span className="gv-dots" aria-hidden>
                {tasks.map((m) => {
                  const st = taskStatus(m);
                  return <span key={m.id} className={st === "done" ? "gv-dot gv-dot--done" : st === "your-turn" ? "gv-dot gv-dot--now" : "gv-dot"} />;
                })}
              </span>
              <span className="gv-mono" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>
                {stageDoneCount} / {tasks.length} done · <span style={{ color: "var(--pj-ink)" }}>{tasksOpen ? "Hide" : "Show"}</span>
              </span>
              <span className="gv-chev" style={{ transform: tasksOpen ? "rotate(180deg)" : "none" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>
            {tasksOpen
              ? tasks.map((m, mi) => {
                  const st = taskStatus(m);
                  const done = st === "done", now = st === "your-turn";
                  return (
                    <div key={m.id} className={now ? "gv-row gv-row--now" : "gv-row"} style={{ animationDelay: `${mi * 35}ms` }}>
                      <span className="gv-mono" style={{ width: 22, color: "var(--pj-faint)" }}>{String(mi + 1).padStart(2, "0")}</span>
                      <Node state={done ? "done" : now ? "current" : "future"} />
                      <span style={{ fontSize: 15.5, fontWeight: now ? 600 : 400, color: done ? "var(--pj-muted)" : "var(--pj-ink)", minWidth: 0 }}>{m.title}</span>
                      <span style={{ marginLeft: "auto", flexShrink: 0 }}>
                        {done ? (
                          <button type="button" onClick={() => onOpenTask(mi)} className="gv-view">View</button>
                        ) : now ? (
                          <button type="button" onClick={() => onOpenTask(mi)} className="gv-small">Start</button>
                        ) : (
                          <span className="gv-chip">{st === "with-us" ? "With us" : "Up next"}</span>
                        )}
                      </span>
                    </div>
                  );
                })
              : null}
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

          {children}
        </main>
      </div>
    </div>
  );
}
