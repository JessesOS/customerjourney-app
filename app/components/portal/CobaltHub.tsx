"use client";

import type { ReactNode } from "react";
import type { JourneyMilestone, JourneyStage } from "@/lib/onboardingJourney";
import type { TaskDisplayStatus } from "@/app/components/portal/StatusChip";

/**
 * Journey page in the motion-redesign look (bar and design system in
 * motion/). A white gallery: one thing per band, white and mist bands
 * alternating, 28 px corners, hairlines, no shadows, one family (Geist).
 * Cobalt appears twice per screen at most: the current segment of the stage
 * strip and the one primary button. Each stage opens on its one-word title.
 * The stage's task bars echo the booked rows of the funnel welcome, so the
 * picture a client just watched carries into the page they land on.
 * Colours ride the --pj-* tokens set by [data-pj-design="cobalt"].
 */

function days(s: JourneyStage) {
  return s.dayStart === s.dayEnd ? `Day ${s.dayStart}` : `Days ${s.dayStart}–${s.dayEnd}`;
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
  upNext,
  upNextDetail,
  onStartUpNext,
  onOpenTask,
  taskStatus,
  tasksOpen,
  onToggleTasks,
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
  upNext?: JourneyMilestone;
  upNextDetail?: string;
  onStartUpNext?: () => void;
  onOpenTask: (milestoneIndex: number) => void;
  taskStatus: (m: JourneyMilestone) => TaskDisplayStatus;
  tasksOpen: boolean;
  onToggleTasks: () => void;
  orbSlot?: ReactNode;
  children?: ReactNode;
}) {
  const stage = stages[currentStageIndex];
  const tasks = stage?.milestones ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--pj-bg)", color: "var(--pj-ink)", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      {/* Header and stage strip */}
      <header style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--pj-bg)", borderBottom: "1px solid var(--pj-line)" }}>
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

      {/* Stage opener: one word at display size, and the stage's task bars */}
      <section className="gx-wrap gx-opener" key={stage?.id}>
        <div style={{ minWidth: 0 }}>
          <div className="gx-rise" style={label}>
            Stage {currentStageIndex + 1} of {stages.length} · {stage ? days(stage) : ""}
          </div>
          <h2 className="gx-title gx-rise" style={{ animationDelay: "80ms" }}>{stage?.name}</h2>
          {stage?.blurb ? (
            <p className="gx-rise" style={{ fontSize: 21, lineHeight: 1.38, color: "var(--pj-muted)", maxWidth: "30ch", margin: 0, animationDelay: "160ms" }}>
              {stage.blurb}
            </p>
          ) : null}
        </div>
        <div className="gx-bars" data-xray="Task bars · CSS, drawn in code" data-xray-tool="code">
          {tasks.map((m, i) => {
            const st = taskStatus(m);
            return (
              <span key={m.id} className="gx-bar-track">
                {st === "done" || st === "your-turn" ? (
                  <span className={st === "done" ? "gx-bar" : "gx-bar gx-bar--now"} style={{ animationDelay: `${200 + i * 90}ms`, width: st === "done" ? "100%" : "34%" }} />
                ) : null}
              </span>
            );
          })}
          <span style={{ ...label, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
            {stageDoneCount} of {tasks.length} done
          </span>
        </div>
        {orbSlot ? <div className="gx-orb">{orbSlot}</div> : null}
      </section>

      {/* Up next: the one action on the page */}
      <section style={{ background: "var(--pj-rail)" }}>
        <div className="gx-wrap gx-band">
          <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-line)", borderRadius: 28, padding: "clamp(24px, 4vw, 40px)" }}>
            <div style={label}>Up next for you</div>
            {upNext ? (
              <div className="gx-next">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.17, letterSpacing: "-0.01em", marginTop: 10 }}>{upNext.title}</div>
                  <p style={{ fontSize: 17, lineHeight: 1.47, color: "var(--pj-muted)", margin: "8px 0 0", maxWidth: "52ch" }}>{upNextDetail ?? upNext.detail}</p>
                </div>
                <button type="button" onClick={onStartUpNext} className="gx-primary">
                  Start this task →
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.17, letterSpacing: "-0.01em", marginTop: 10 }}>We’re preparing your next step</div>
                <p style={{ fontSize: 17, lineHeight: 1.47, color: "var(--pj-muted)", margin: "8px 0 0" }}>Nothing needed from you right now — we’ll flag you the moment there’s something to review.</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* All tasks in this stage */}
      <section className="gx-wrap gx-band">
        <button type="button" onClick={onToggleTasks} aria-expanded={tasksOpen} className="gx-toggle">
          <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em" }}>All tasks in this stage</span>
          <span style={{ ...label, marginLeft: "auto", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
            {stageDoneCount} / {tasks.length} done · {tasksOpen ? "Hide" : "Show"}
          </span>
        </button>
        {tasksOpen
          ? tasks.map((m, mi) => {
              const st = taskStatus(m);
              const done = st === "done", now = st === "your-turn";
              return (
                <button key={m.id} type="button" onClick={() => onOpenTask(mi)} className="gx-row">
                  <Mark state={done ? "done" : now ? "current" : "future"} />
                  <span style={{ fontSize: 17, fontWeight: now ? 600 : 400, color: done ? "var(--pj-muted)" : "var(--pj-ink)", textAlign: "left", minWidth: 0 }}>{m.title}</span>
                  <span style={{ ...label, marginLeft: "auto", whiteSpace: "nowrap", color: now ? "var(--pj-ink)" : "var(--pj-muted)" }}>
                    {done ? "Done" : now ? "Your turn" : st === "with-us" ? "With us" : "Up next"}
                  </span>
                </button>
              );
            })
          : null}
      </section>

      {/* Happening with us */}
      {stage && stage.statusNotes.length > 0 ? (
        <section style={{ background: "var(--pj-rail)" }}>
          <div className="gx-wrap gx-band">
            <div style={label}>Happening with us</div>
            <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "grid", gap: 10 }}>
              {stage.statusNotes.map((note) => (
                <li key={note} style={{ fontSize: 17, lineHeight: 1.47 }}>{note}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {children ? <section className="gx-wrap gx-band">{children}</section> : null}

      {/* Your journey: every stage, so the whole road stays in view without a side rail */}
      <section style={{ borderTop: "1px solid var(--pj-line)" }}>
        <div className="gx-wrap gx-band">
          <div style={label}>Your journey</div>
          <div style={{ marginTop: 10 }}>
            {stages.map((s, i) => {
              const done = s.status === "done", now = i === currentStageIndex && !done;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderTop: i ? "1px solid var(--pj-line)" : "none" }}>
                  <Mark state={done ? "done" : now ? "current" : "future"} />
                  <span style={{ fontSize: 21, fontWeight: now ? 600 : 400, color: done || now ? "var(--pj-ink)" : "var(--pj-muted)" }}>{s.name}</span>
                  <span style={{ ...label, marginLeft: "auto", whiteSpace: "nowrap" }}>{days(s)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
