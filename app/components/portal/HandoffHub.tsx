"use client";

import type { ReactNode } from "react";
import type { JourneyMilestone, JourneyStage } from "@/lib/onboardingJourney";
import type { TaskDisplayStatus } from "@/app/components/portal/StatusChip";

/**
 * Full structural port of the client_portal design handoff
 * (design_handoff_scale/client_portal, 2026-08-10): sticky header with the
 * centered RT DIGITAL watermark, 5-segment teal/terracotta progress strip,
 * journey rail with pastel stage icons + status dots + overall-progress
 * footer, and the hub card (mono kicker, up-next with ink button, collapsible
 * task list with UP NEXT chips). Colours ride the --pj-* tokens so the
 * handoff's own Light|Dark schemes apply via [data-pj-design]/[data-pj-scheme]
 * in globals.css. Rendered by ClientPortalExperience in place of the current
 * home layout while the "New design" review toggle is active.
 */

const MONO = "var(--pj-inkmono, var(--font-ibm-plex-mono)), monospace";

function monoLabel(size = 10.5): React.CSSProperties {
  return { fontFamily: MONO, fontSize: size, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 };
}

// Stage icon pastels + glyphs per the handoff README (flat CSS glyphs).
const STAGE_ICONS: { bg: string; fg: string; glyph: (fg: string) => ReactNode }[] = [
  {
    bg: "#f6e8d6",
    fg: "#c9622f",
    glyph: (fg) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2.4" strokeLinecap="round">
        <rect x="5" y="3" width="14" height="18" rx="2.5" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    bg: "#dcebe9",
    fg: "#1f6b70",
    glyph: (fg) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 4l6 6-9 9H5v-6z" />
        <path d="M12 6l6 6" />
      </svg>
    ),
  },
  {
    bg: "#eae3f0",
    fg: "#6a4a7e",
    glyph: (fg) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2.4">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3.5" fill={fg} stroke="none" />
      </svg>
    ),
  },
  {
    bg: "#fdeecd",
    fg: "#d9911f",
    glyph: (fg) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill={fg}>
        <path d="M13 2 5 13h5l-1 9 8-11h-5z" />
      </svg>
    ),
  },
  {
    bg: "#f7e2da",
    fg: "#c05a3e",
    glyph: (fg) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill={fg}>
        <path d="m12 2 2.9 6.2 6.6.9-4.8 4.6 1.2 6.6-5.9-3.2-5.9 3.2 1.2-6.6L2.5 9.1l6.6-.9z" />
      </svg>
    ),
  },
];

function StatusDot({ state }: { state: "done" | "current" | "future" }) {
  if (state === "done") {
    return (
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--pj-done)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4 10-12" />
        </svg>
      </span>
    );
  }
  if (state === "current") {
    return <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--pj-act)", flexShrink: 0, animation: "hfDot 2.4s ease-in-out infinite" }} />;
  }
  return <span style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid var(--pj-line)", flexShrink: 0, boxSizing: "border-box" }} />;
}

export function HandoffHub({
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
  onStartUpNext,
  onStartTask,
  onViewTask,
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
  onStartUpNext?: () => void;
  onStartTask: (milestoneIndex: number) => void;
  onViewTask: (milestoneIndex: number) => void;
  taskStatus: (m: JourneyMilestone) => TaskDisplayStatus;
  tasksOpen: boolean;
  onToggleTasks: () => void;
  showRail: boolean;
  orbSlot?: ReactNode;
  children?: ReactNode;
}) {
  const stage = stages[currentStageIndex];
  const inkBtn: React.CSSProperties = {
    background: "var(--pj-ink)",
    color: "var(--pj-bg)",
    fontWeight: 600,
    fontSize: 14,
    border: "none",
    borderRadius: 999,
    padding: "13px 26px",
    cursor: "pointer",
    boxShadow: "0 8px 18px -8px rgba(23, 19, 14, 0.35)",
    fontFamily: "var(--font-body), sans-serif",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--pj-bg)", color: "var(--pj-ink)", fontFamily: "var(--font-body), sans-serif" }}>
      {/* Sticky header with centered watermark */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--pj-card)", borderBottom: "1px solid var(--pj-line)" }}>
        <div style={{ position: "relative", maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", gap: 14, padding: "16px 32px" }}>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>{brand}</span>
          <span style={{ width: 1, height: 18, background: "var(--pj-line)" }} />
          <span style={{ fontSize: 13.5, color: "var(--pj-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{clientLabel}</span>
          <span aria-hidden style={{ ...monoLabel(14), position: "absolute", left: "50%", transform: "translateX(-50%)", letterSpacing: "0.26em", opacity: 0.55, color: "var(--pj-faint)" }}>
            RT DIGITAL
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: "var(--pj-muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
              Day {currentDay} / {totalDays} · <b style={{ color: "var(--pj-done)", fontWeight: 650 }}>on track</b>
            </span>
            <span style={{ width: 32, height: 32, borderRadius: 99, background: "var(--pj-ink)", color: "var(--pj-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
              {name.charAt(0)}
            </span>
          </div>
        </div>
        {/* Stage progress strip */}
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px 14px" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {stages.map((s, i) => {
              const done = i < currentStageIndex || s.status === "done";
              const current = i === currentStageIndex && s.status !== "done";
              const pct = Math.max(8, stagePct);
              return (
                <span
                  key={s.id}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: done
                      ? "var(--pj-done)"
                      : current
                        ? `linear-gradient(90deg, var(--pj-act) ${pct}%, var(--pj-line) ${pct}%)`
                        : "var(--pj-line)",
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 9 }}>
            <b style={{ fontSize: 14, fontWeight: 650 }}>
              Stage {currentStageIndex + 1} · {stage?.name}
            </b>
            <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--pj-muted)", fontVariantNumeric: "tabular-nums" }}>
              {stageDoneCount} / {stage?.milestones.length ?? 0} done
            </span>
          </div>
        </div>
      </div>

      {/* Main row */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "36px 56px 60px", display: "flex", gap: 40, alignItems: "flex-start" }}>
        {showRail && (
          <aside className="hf-rail" style={{ width: 262, flexShrink: 0, position: "sticky", top: 92, background: "var(--pj-card)", border: "1px solid var(--pj-line)", borderRadius: 24, padding: "20px 14px 18px", boxShadow: "var(--pj-rail-card-shadow)" }}>
            <div style={{ ...monoLabel(), color: "var(--pj-faint)", margin: "2px 10px 14px" }}>Your journey</div>
            {stages.map((s, i) => {
              const icon = STAGE_ICONS[i % STAGE_ICONS.length];
              const done = s.status === "done";
              const current = i === currentStageIndex && !done;
              const doneCount = s.milestones.filter((m) => m.status === "done").length;
              const meta = done
                ? `All ${s.milestones.length} tasks done · Days ${s.dayStart}${s.dayEnd !== s.dayStart ? `–${s.dayEnd}` : ""}`
                : current
                  ? `${doneCount} of ${s.milestones.length} done · Days ${s.dayStart}${s.dayEnd !== s.dayStart ? `–${s.dayEnd}` : ""}`
                  : `${s.milestones.length} tasks · Day ${s.dayStart}${s.dayEnd !== s.dayStart ? `–${s.dayEnd}` : ""}`;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 10px", borderRadius: 16, background: current ? "var(--pj-turn-tint)" : "transparent" }}>
                  <span style={{ width: 38, height: 38, borderRadius: "50%", background: icon.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: current ? "0 0 0 2px var(--pj-act)" : "none" }}>
                    {icon.glyph(icon.fg)}
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>{s.name}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--pj-muted)", marginTop: 1 }}>{meta}</span>
                  </span>
                  <StatusDot state={done ? "done" : current ? "current" : "future"} />
                </div>
              );
            })}
            <div style={{ borderTop: "1px solid var(--pj-line)", margin: "12px 10px 0", paddingTop: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ ...monoLabel(), color: "var(--pj-faint)" }}>Overall progress</span>
                <b style={{ marginLeft: "auto", fontSize: 15 }}>{overallPercent}%</b>
              </div>
              <div style={{ height: 6, borderRadius: 6, background: "var(--pj-line)", overflow: "hidden", margin: "10px 0 8px" }}>
                <span style={{ display: "block", height: "100%", width: `${overallPercent}%`, background: "linear-gradient(90deg, #2a8087, var(--pj-done))", borderRadius: 6 }} />
              </div>
              <span style={{ fontSize: 12, color: "var(--pj-muted)" }}>of the journey complete</span>
            </div>
          </aside>
        )}

        {/* Main card */}
        <main style={{ flex: 1, minWidth: 0, position: "relative", background: "var(--pj-card)", border: "1px solid var(--pj-line)", borderRadius: 28, padding: "46px 54px 42px", boxShadow: "var(--pj-shadow-frame)" }}>
          {orbSlot ? <div style={{ position: "absolute", top: 42, right: 46 }}>{orbSlot}</div> : null}
          <div style={{ ...monoLabel(11), color: "var(--pj-act)", marginBottom: 12 }}>
            Stage {currentStageIndex + 1} of {stages.length} · Days {stage?.dayStart}
            {stage && stage.dayEnd !== stage.dayStart ? `–${stage.dayEnd}` : ""}
          </div>
          <h2 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 46, fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 10px", lineHeight: 1.05 }}>{stage?.name}</h2>
          {stage?.blurb ? <p style={{ fontSize: 16.5, color: "var(--pj-muted)", maxWidth: "56ch", margin: 0, lineHeight: 1.55 }}>{stage.blurb}</p> : null}

          {/* Up next */}
          <div style={{ background: "linear-gradient(180deg, var(--pj-card) 0%, var(--pj-turn-tint) 100%)", border: "1px solid var(--pj-line)", borderRadius: 22, padding: "26px 28px", boxShadow: "var(--pj-shadow-card)", margin: "26px 0 26px" }}>
            <div style={{ ...monoLabel(), color: "var(--pj-faint)", marginBottom: 10 }}>Up next for you</div>
            {upNext ? (
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: "1 1 320px" }}>
                  <span style={{ ...monoLabel(10), display: "inline-flex", alignItems: "center", gap: 6, background: "#f9e2d0", color: "#a34d1d", borderRadius: 999, padding: "5px 11px" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a34d1d" }} />
                    Your turn
                  </span>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em", marginTop: 10, fontFamily: "var(--font-heading), sans-serif" }}>{upNext.title}</div>
                  <div style={{ fontSize: 14.5, color: "var(--pj-muted)", marginTop: 5, maxWidth: "52ch" }}>{upNext.detail}</div>
                </div>
                <button type="button" onClick={onStartUpNext} style={{ ...inkBtn, marginLeft: "auto" }}>
                  Start this task →
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 15, color: "var(--pj-muted)" }}>Nothing waiting on you — we&apos;re on it.</div>
            )}
          </div>

          {/* Collapsible task list */}
          <div style={{ border: "1px solid var(--pj-line)", borderRadius: 16, overflow: "hidden" }}>
            <button
              type="button"
              onClick={onToggleTasks}
              aria-expanded={tasksOpen}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body), sans-serif" }}
            >
              <span style={{ ...monoLabel(), color: "var(--pj-faint)", whiteSpace: "nowrap" }}>All tasks in this stage</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {stage?.milestones.map((m) => {
                  const ds = taskStatus(m);
                  const bg = ds === "done" ? "var(--pj-done)" : ds === "your-turn" ? "var(--pj-act)" : "var(--pj-line)";
                  return <span key={m.id} style={{ width: 7, height: 7, borderRadius: "50%", background: bg, flexShrink: 0 }} />;
                })}
              </span>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--pj-muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0 }}>
                {stageDoneCount} / {stage?.milestones.length ?? 0} done
                <span style={{ fontWeight: 600 }}>{tasksOpen ? "Hide" : "Show"}</span>
                <span style={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid var(--pj-line)", display: "flex", alignItems: "center", justifyContent: "center", transform: tasksOpen ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </span>
            </button>
            {tasksOpen &&
              stage?.milestones.map((m, mi) => {
                const ds = taskStatus(m);
                const isDone = ds === "done";
                const isTurn = ds === "your-turn";
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderTop: "1px solid var(--pj-line)", background: isTurn ? "var(--pj-turn-tint)" : "transparent" }}>
                    <StatusDot state={isDone ? "done" : isTurn ? "current" : "future"} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: isDone ? "var(--pj-faint)" : "var(--pj-ink)", textDecoration: isDone ? "line-through" : "none", textDecorationColor: "var(--pj-strike)" }}>{m.title}</div>
                      {isTurn && m.detail ? <div style={{ fontSize: 12.5, color: "var(--pj-muted)", marginTop: 2, maxWidth: "60ch", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.detail.split(". ")[0]}</div> : null}
                    </div>
                    <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                      {isDone ? (
                        <button type="button" onClick={() => onViewTask(mi)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 550, color: "var(--pj-faint)", fontFamily: "var(--font-body), sans-serif" }}>
                          View
                        </button>
                      ) : isTurn ? (
                        <button type="button" onClick={() => onStartTask(mi)} style={{ ...inkBtn, padding: "9px 20px", fontSize: 13 }}>
                          Start
                        </button>
                      ) : (
                        <span style={{ ...monoLabel(9.5), color: "var(--pj-faint)", border: "1px solid var(--pj-line)", borderRadius: 999, padding: "5px 10px" }}>Up next</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
