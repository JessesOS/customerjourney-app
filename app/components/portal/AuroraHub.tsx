"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { JourneyMilestone, JourneyStage } from "@/lib/journeyTypes";
import type { TaskDisplayStatus } from "@/app/components/portal/StatusChip";

/**
 * Journey page in the "Aurora" look (motion redesign, second direction,
 * 2026-10-11). References are Jesse's: the brain.fm app (night ground, one
 * giant word under a progress arc, art tiles of flowing lines) and a dark
 * dashboard with glowing orbs. Same frame and functions as the other
 * designs: sticky header with the stage strip, an optional journey rail,
 * the up-next action and the expandable task list. The art is drawn in
 * code on canvas (no images, no video): each stage has its own field of
 * flowing lines, small on its rail tile and large and moving behind the
 * current stage. Colours ride the --pj-* tokens set by
 * [data-pj-design="aurora"].
 */

// One palette per stage, cycling. Each is the left-to-right colour of the lines.
export const AURORA_PALETTES: string[][] = [
  ["#6d4bff", "#ff4fa3", "#ff9a3d"],
  ["#2f7bff", "#35d6e6", "#8a5cff"],
  ["#ffb320", "#ff4fa3", "#6d4bff"],
  ["#ff7a3d", "#ff3d6e", "#c04bff"],
  ["#ff6fb5", "#b58cff", "#3d8bff"],
];

/** A field of flowing lines: wireframe hills that drift. Static unless `animate`. */
export function WaveField({ seed, animate = false, sparks = true, lines = 44, className, style }: { seed: number; animate?: boolean; sparks?: boolean; lines?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    const g = cv?.getContext("2d");
    if (!cv || !g) return;
    const pal = AURORA_PALETTES[seed % AURORA_PALETTES.length];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, raf = 0, last = 0;
    // Two hills per field; the seed moves and reshapes them so no two stages match.
    const c1 = 0.2 + ((seed * 37) % 23) / 100, c2 = 0.62 + ((seed * 53) % 27) / 100;
    const w1 = 0.016 + ((seed * 17) % 9) / 600, w2 = 0.022 + ((seed * 29) % 11) / 600;

    function size() {
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      const r = cv!.getBoundingClientRect();
      W = cv!.width = Math.max(1, Math.round(r.width * d));
      H = cv!.height = Math.max(1, Math.round(r.height * d));
    }
    function draw(t: number) {
      g!.clearRect(0, 0, W, H);
      const grad = g!.createLinearGradient(0, 0, W, 0);
      pal.forEach((c, i) => grad.addColorStop(i / (pal.length - 1), c));
      g!.strokeStyle = grad;
      g!.lineWidth = Math.max(1.2, W / 900);
      g!.globalCompositeOperation = "lighter";
      const step = Math.max(6, W / 140);
      for (let i = 0; i < lines; i++) {
        const p = i / (lines - 1);
        g!.globalAlpha = 0.22 + 0.68 * p;
        g!.beginPath();
        for (let x = -step; x <= W + step; x += step) {
          const u = x / W;
          const a = c1 + 0.05 * Math.sin(t * 0.21 + seed), b = c2 + 0.06 * Math.cos(t * 0.17 + seed * 2);
          const hills = Math.exp(-((u - a) ** 2) / w1) * (0.85 + 0.15 * Math.sin(t * 0.4)) + 0.72 * Math.exp(-((u - b) ** 2) / w2);
          const ripple = Math.sin(u * 9 + t * 0.5 + p * 5 + seed) * 0.018 + Math.sin(u * 23 - t * 0.3 + p * 9) * 0.006;
          const y = H * (0.42 + 0.6 * p) - H * 0.4 * (1 - p * 0.86) * hills + H * ripple * (1 - p * 0.5);
          if (x <= 0) g!.moveTo(x, y); else g!.lineTo(x, y);
        }
        g!.stroke();
      }
      // A few slow sparks above the hills, on the moving field only
      if (animate && sparks) {
        g!.fillStyle = "#fff";
        for (let k = 0; k < 70; k++) {
          const sx = ((k * 0.6180339 + seed * 0.13) % 1) * W + Math.sin(t * 0.12 + k) * W * 0.01;
          const sy = (((k * 0.3819 + seed * 0.29) % 1) * 0.62 + ((t * 0.006 * (1 + (k % 5))) % 1) * 0.04) * H;
          g!.globalAlpha = 0.12 + 0.5 * Math.abs(Math.sin(t * 0.6 + k * 1.7));
          g!.beginPath(); g!.arc(sx, sy, (0.6 + (k % 3) * 0.5) * (W / 1400), 0, 6.283); g!.fill();
        }
      }
      g!.globalAlpha = 1;
      g!.globalCompositeOperation = "source-over";
    }
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (now - last < 33 || document.hidden) return; // about 30 frames a second is plenty for a slow drift
      last = now;
      draw(now / 1000 + seed * 10);
    }
    const onResize = () => { size(); if (!animate || reduced) draw(seed * 10); };
    size();
    draw(seed * 10);
    window.addEventListener("resize", onResize);
    if (animate && !reduced) raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [seed, animate, sparks, lines]);
  return <canvas ref={ref} aria-hidden className={className} style={style} />;
}

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
  if (state === "current") return <span className="ax-dot" />;
  return <span style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid var(--pj-ring)", boxSizing: "border-box", flexShrink: 0 }} />;
}

export function AuroraHub({
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
  calm = false,
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
  /** The dialled-back version: quieter art, no arc, a smaller left-aligned title. */
  calm?: boolean;
  orbSlot?: ReactNode;
  children?: ReactNode;
}) {
  // Once every task is done there is no current stage (index -1); show the
  // last stage instead of reading a palette at -1, which crashed the page.
  const homeIndex = currentStageIndex < 0 ? Math.max(0, stages.length - 1) : currentStageIndex;
  const stage = stages[homeIndex];
  const tasks = stage?.milestones ?? [];
  const pal = AURORA_PALETTES[homeIndex % AURORA_PALETTES.length];
  // The arc is a half circle. Its end dot sits at the stage's progress.
  const allDone = currentStageIndex < 0;
  const pct = allDone ? 100 : Math.max(0, Math.min(100, stagePct));
  const doneHere = allDone ? tasks.length : stageDoneCount;
  const ang = Math.PI * (1 - pct / 100);
  const dotX = 500 + 460 * Math.cos(ang), dotY = 500 - 460 * Math.sin(ang);

  return (
    <div className={calm ? "ax-page ax-page--calm" : "ax-page"} style={{ "--ax-a": pal[0], "--ax-b": pal[1], "--ax-c": pal[2] } as React.CSSProperties}>
      {/* The current stage's field, large and moving, behind everything */}
      <WaveField key={`bg${homeIndex}`} seed={homeIndex} animate sparks={!calm} lines={calm ? 36 : 64} className="ax-bg" />

      {/* Header and stage strip */}
      <header className="ax-header">
        <div className="ax-wrap" style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 16, paddingBottom: 14 }}>
          <span style={{ fontWeight: 600, fontSize: 20, letterSpacing: "-0.02em" }}>{brand}</span>
          <span className="ax-label" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{clientLabel}</span>
          <span className="ax-label" style={{ marginLeft: "auto", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            Day {currentDay} / {totalDays} · <span style={{ color: "var(--pj-ink)" }}>on track</span>
          </span>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--pj-ink)", color: "var(--pj-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
            {name.charAt(0)}
          </span>
        </div>
        <div className="ax-wrap" style={{ display: "flex", gap: 6, paddingBottom: 14 }} aria-hidden>
          {stages.map((s, i) => (
            <span
              key={s.id}
              style={{ flex: 1, height: 4, borderRadius: 2, background: s.status === "done" ? "var(--pj-ink)" : i === currentStageIndex ? `linear-gradient(90deg, ${pal[0]}, ${pal[1]}, ${pal[2]})` : "var(--pj-track)" }}
            />
          ))}
        </div>
      </header>

      <div className="ax-wrap ax-main-row">
        {/* Journey rail: one art tile per stage */}
        {showRail ? (
          <aside className="ax-rail">
            <div className="ax-label" style={{ margin: "0 4px 12px" }}>Your journey</div>
            {stages.map((s, i) => {
              const done = s.status === "done", now = i === currentStageIndex && !done;
              const doneCount = s.milestones.filter((m) => m.status === "done").length;
              const meta = done
                ? `All ${s.milestones.length} tasks done · ${days(s, "Days")}`
                : now
                  ? `${doneCount} of ${s.milestones.length} done · ${days(s, "Days")}`
                  : `${s.milestones.length} tasks · ${days(s, "Day", "Day")}`;
              return (
                <button key={s.id} type="button" onClick={() => onSelectStage(s.id)} className={now ? "ax-tile ax-tile--now" : "ax-tile"}>
                  <WaveField seed={i} lines={30} className="ax-tile-art" />
                  <span className="ax-tile-shade" />
                  <span style={{ position: "relative", minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>{s.name}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>{meta}</span>
                  </span>
                  <span style={{ position: "relative" }}>
                    <Mark state={done ? "done" : now ? "current" : "future"} />
                  </span>
                </button>
              );
            })}
            <div style={{ margin: "16px 4px 0" }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span className="ax-label">Overall progress</span>
                <b style={{ marginLeft: "auto", fontSize: 16, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{overallPercent}%</b>
              </div>
              <div style={{ height: 6, borderRadius: 6, background: "var(--pj-track)", overflow: "hidden", margin: "10px 0 8px" }}>
                <span style={{ display: "block", height: "100%", width: `${overallPercent}%`, background: "var(--pj-ink)", borderRadius: 6 }} />
              </div>
              <span style={{ fontSize: 12.5, color: "var(--pj-muted)" }}>of the journey complete</span>
            </div>
          </aside>
        ) : null}

        <main className="ax-main" key={stage?.id}>
          {orbSlot ? <div className="ax-orb">{orbSlot}</div> : null}

          {/* Hero: the stage's one word under its progress arc */}
          <section className="ax-hero">
            <svg className="ax-arc" viewBox="0 0 1000 520" aria-hidden data-xray="Stage arc · SVG, drawn in code" data-xray-tool="code">
              <defs>
                <linearGradient id="axArc" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor={pal[0]} />
                  <stop offset="0.5" stopColor={pal[1]} />
                  <stop offset="1" stopColor={pal[2]} />
                </linearGradient>
              </defs>
              <path d="M 40 500 A 460 460 0 0 1 960 500" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="7" strokeLinecap="round" />
              {pct > 0 ? (
                <path className="ax-arc-fill" d="M 40 500 A 460 460 0 0 1 960 500" fill="none" stroke="url(#axArc)" strokeWidth="7" strokeLinecap="round" pathLength={100} strokeDasharray={`${pct} 100`} />
              ) : null}
              <circle className="ax-arc-dot" cx={dotX} cy={dotY} r="11" fill="#fff" />
            </svg>
            <div className="ax-hero-copy">
              <div className="ax-kicker ax-rise">
                Stage {homeIndex + 1} of {stages.length} · {stage ? days(stage) : ""}
              </div>
              <h2 className="ax-title ax-rise" style={{ animationDelay: "90ms" }}>{stage?.name}</h2>
              <div className="ax-label ax-rise" style={{ animationDelay: "180ms", fontVariantNumeric: "tabular-nums" }}>
                {doneHere} / {tasks.length} done
              </div>
              {calm ? (
                <div className="ax-calm-bar" aria-hidden>
                  <span style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${pal[0]}, ${pal[1]}, ${pal[2]})` }} />
                </div>
              ) : null}
            </div>
          </section>
          {stage?.blurb ? (
            <p className="ax-rise ax-blurb" style={{ animationDelay: "240ms" }}>
              {stage.blurb}
            </p>
          ) : null}

          {/* Up next: the one action on the page */}
          <div className="ax-glass ax-next ax-rise" style={{ animationDelay: "300ms" }}>
            <div style={{ minWidth: 0 }}>
              <div className="ax-label">Up next for you</div>
              <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.015em", marginTop: 8 }}>{upNext ? upNext.title : "We’re preparing your next step"}</div>
              <p style={{ fontSize: 16, lineHeight: 1.47, color: "var(--pj-muted)", margin: "6px 0 0", maxWidth: "52ch" }}>
                {upNext ? (upNextDetail ?? upNext.detail) : "Nothing needed from you right now — we’ll flag you the moment there’s something to review."}
              </p>
            </div>
            {upNext ? (
              <button type="button" onClick={onStartUpNext} className="ax-primary">
                Start this task →
              </button>
            ) : null}
          </div>

          {/* All tasks in this stage: expands in place */}
          <div className="ax-glass ax-tasks ax-rise" style={{ animationDelay: "380ms" }}>
            <button type="button" onClick={onToggleTasks} aria-expanded={tasksOpen} className="ax-toggle">
              <span className="ax-toggle-title">All tasks in this stage</span>
              <span className="ax-segs" aria-hidden>
                {tasks.map((m) => {
                  const st = taskStatus(m);
                  return <span key={m.id} className="ax-seg" style={{ background: st === "done" ? "var(--pj-ink)" : st === "your-turn" ? pal[1] : "var(--pj-track)" }} />;
                })}
              </span>
              <span className="ax-label" style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {doneHere} / {tasks.length} done · <span style={{ color: "var(--pj-ink)" }}>{tasksOpen ? "Hide" : "Show"}</span>
              </span>
              <span className="ax-chev" style={{ transform: tasksOpen ? "rotate(180deg)" : "none" }}>
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
                    <div key={m.id} className={now ? "ax-row ax-row--now" : "ax-row"} style={{ animationDelay: `${mi * 40}ms` }}>
                      <Mark state={done ? "done" : now ? "current" : "future"} />
                      <span style={{ fontSize: 16, fontWeight: now ? 600 : 400, color: done ? "var(--pj-muted)" : "var(--pj-ink)", minWidth: 0 }}>{m.title}</span>
                      <span style={{ marginLeft: "auto", flexShrink: 0 }}>
                        {done ? (
                          <button type="button" onClick={() => onOpenTask(mi)} className="ax-view">View</button>
                        ) : now ? (
                          <button type="button" onClick={() => onOpenTask(mi)} className="ax-small">Start</button>
                        ) : (
                          <span className="ax-chip">{st === "with-us" ? "With us" : "Up next"}</span>
                        )}
                      </span>
                    </div>
                  );
                })
              : null}
          </div>

          {/* Happening with us */}
          {stage && stage.statusNotes.length > 0 ? (
            <div className="ax-glass" style={{ marginTop: 16, padding: "20px 24px" }}>
              <div className="ax-label">Happening with us</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0", display: "grid", gap: 8 }}>
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
