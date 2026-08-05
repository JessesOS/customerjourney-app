"use client";

import { useEffect, useRef, useState } from "react";
import type { StageGuide as StageGuideData } from "@/lib/stageGuide";

/**
 * Imprint-style stage narrator: a small breathing orb that speaks a short
 * per-stage guide when tapped. The caption bubble shows the exact script
 * while it plays. No autoplay — browsers block unmuted autoplay, and a tap
 * keeps it invitational rather than intrusive. The topbar speaker toggle
 * (ClientPortalExperience) unmounts this entirely when voice is off.
 */
export function StageGuide({ guide }: { guide: StageGuideData }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  // Stop cleanly when the stage changes or voice is toggled off mid-play.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, [guide.audioSrc]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <div style={{ margin: "18px 0 4px" }}>
      <audio
        ref={audioRef}
        src={guide.audioSrc}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        style={{ display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-body), sans-serif", textAlign: "left" }}
      >
        <span className={playing ? "pj-orb--playing" : undefined} style={{ position: "relative", width: 34, height: 34, flexShrink: 0, display: "block" }}>
          <span className="pj-orb-ring" aria-hidden />
          <span className="pj-orb-ring" aria-hidden style={{ animationDelay: "-1.6s" }} />
          <span className="pj-orb-core">
            {playing ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="5" y="4" width="5" height="16" rx="1.5" />
                <rect x="14" y="4" width="5" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7 4.5v15l13-7.5-13-7.5z" />
              </svg>
            )}
          </span>
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: playing ? "var(--pj-act)" : "var(--pj-muted)" }}>
          {playing ? "Playing…" : `Hear this stage${duration ? ` · ${Math.round(duration)}s` : ""}`}
        </span>
      </button>
      {/* Caption bubble deliberately removed (2026-08-05) — the on-screen
          transcript read as clutter; the orb + audio carry it. Scripts stay
          in lib/stageGuide.ts for regeneration and future use. */}
    </div>
  );
}
