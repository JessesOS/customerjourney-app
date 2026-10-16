"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

/**
 * The welcome video, played once in a lightbox over the portal straight after
 * the welcome's "Get started" (Jesse, 2026-10-16: BSS Meta ads only plays his
 * walkthrough). A framed video on a dimmed, blurred backdrop, not full screen,
 * so the client is already on their journey behind it. It fades away when it
 * ends; the close button or Esc closes it early. A click outside the frame does
 * not: a double-click on "Get started" would land there and close it at once.
 *
 * It is mounted with the welcome, hidden, so `start()` can be called inside
 * the click itself: that is what lets the browser play it with sound. If the
 * browser still refuses, a play button appears.
 */
export type IntroVideoHandle = { start: () => void };

const FADE_MS = 500;

export const IntroVideo = forwardRef<IntroVideoHandle, { src: string; poster?: string; title: string; visible: boolean; onDone: () => void }>(
  function IntroVideo({ src, poster, title, visible, onDone }, ref) {
    const video = useRef<HTMLVideoElement | null>(null);
    const [blocked, setBlocked] = useState(false);
    const [closing, setClosing] = useState(false);

    useImperativeHandle(ref, () => ({
      start() {
        const v = video.current;
        if (!v) return;
        setClosing(false);
        v.currentTime = 0;
        v.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
      },
    }));

    const finish = () => {
      if (closing) return;
      video.current?.pause();
      setClosing(true);
      window.setTimeout(onDone, FADE_MS);
    };

    useEffect(() => {
      if (!visible) return;
      const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    });

    const open = visible && !closing;
    return (
      <div
        className={open ? "iv iv--on" : "iv"}
        aria-hidden={!open}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label={title}
      >
        <div className="iv-box">
          <div className="iv-head">
            <span className="iv-title">{title}</span>
            <button type="button" className="iv-close" onClick={finish} aria-label="Close the video">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <div className="iv-frame">
            <video
              ref={video}
              className="iv-video"
              src={src}
              poster={poster}
              controls
              playsInline
              preload="metadata"
              onEnded={finish}
            />
            {blocked && open ? (
              <button type="button" className="iv-play" onClick={() => { void video.current?.play().then(() => setBlocked(false)); }} aria-label="Play the video">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5.5v13l11-6.5z" /></svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  },
);
