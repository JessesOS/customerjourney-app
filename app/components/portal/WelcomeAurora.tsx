"use client";

import { useEffect, useRef, useState } from "react";
import { AURORA_PALETTES, WaveField } from "@/app/components/portal/AuroraHub";

/**
 * Aurora welcome (motion redesign, 2026-10-11). Reference is Jesse's: the
 * brain.fm landing hero (night stage, a big line on the left with one
 * highlighted word that changes, colour blooming behind, one white button,
 * a strip of the modes along the bottom). Here the changing word is the
 * journey itself: the stage names cycle, each with its own field of flowing
 * lines, so the welcome previews the road the client is about to walk.
 * No new copy: the wordmark, the stage names and "Get started" only.
 */

const HOLD_MS = 2600;
const EXIT_MS = 700;

export function WelcomeAurora({ brand, stages, onStart }: { brand: "scale" | "respond"; stages: string[]; onStart: () => void }) {
  const [i, setI] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const wordmark = brand === "respond" ? "Respond" : "Scale";

  useEffect(() => {
    if (stages.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % stages.length), HOLD_MS);
    return () => window.clearInterval(id);
  }, [stages.length]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function start() {
    if (leaving) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onStart(); return; }
    setLeaving(true);
    timer.current = window.setTimeout(onStart, EXIT_MS);
  }

  const pal = AURORA_PALETTES[i % AURORA_PALETTES.length];
  return (
    <div
      className={leaving ? "aw aw--leaving" : "aw"}
      style={{ "--ax-a": pal[0], "--ax-b": pal[1], "--ax-c": pal[2], "--aw-exit": `${EXIT_MS}ms` } as React.CSSProperties}
    >
      <WaveField key={i} seed={i} animate lines={64} className="aw-field" />
      <div className="aw-copy">
        <h1 className="aw-wordmark">{wordmark}</h1>
        <div className="aw-word" key={i} data-xray="Stage word · CSS, drawn in code" data-xray-tool="code">
          <span>{stages[i]}</span>
        </div>
        <button type="button" onClick={start} className="aw-cta">
          Get started
        </button>
      </div>
      <div className="aw-strip" aria-hidden>
        {stages.map((s, k) => (
          <span key={s} className={k === i ? "aw-step aw-step--on" : "aw-step"}>{s}</span>
        ))}
      </div>
      <div className="aw-legal">Terms &amp; Conditions · Privacy Policy</div>
    </div>
  );
}
