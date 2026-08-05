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
/** Wordless narrator orb (label + caption removed 2026-08-05 — the breathing
 *  orb alone carries it; the tooltip and aria-label explain on approach).
 *  Positioned by the parent into the header's negative space. */
export function StageGuide({ guide }: { guide: StageGuideData }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

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
    <>
      <audio ref={audioRef} src={guide.audioSrc} preload="metadata" onEnded={() => setPlaying(false)} />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Stop the stage narration" : "Hear this stage"}
        title={playing ? "Stop" : "Hear this stage"}
        style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "block" }}
      >
        <span className={playing ? "pj-orb--playing" : undefined} style={{ position: "relative", width: 46, height: 46, display: "block" }}>
          <span className="pj-orb-ring" aria-hidden />
          <span className="pj-orb-ring" aria-hidden style={{ animationDelay: "-1.6s" }} />
          <span className="pj-orb-core">
            {playing ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="5" y="4" width="5" height="16" rx="1.5" />
                <rect x="14" y="4" width="5" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7 4.5v15l13-7.5-13-7.5z" />
              </svg>
            )}
          </span>
        </span>
      </button>
    </>
  );
}
