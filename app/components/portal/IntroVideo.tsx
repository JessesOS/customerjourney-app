"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

/**
 * A full-screen video that plays once, straight after the welcome's "Get
 * started", then hands over to the journey page when it ends (Jesse,
 * 2026-10-16: BSS Meta ads only plays his walkthrough). It is mounted with the
 * welcome, hidden, so `start()` can be called inside the click itself: that is
 * what lets the browser play it with sound. If the browser still refuses, a
 * play button appears. Skip is always there.
 */
export type IntroVideoHandle = { start: () => void };

export const IntroVideo = forwardRef<IntroVideoHandle, { src: string; poster?: string; title: string; visible: boolean; onDone: () => void }>(
  function IntroVideo({ src, poster, title, visible, onDone }, ref) {
    const video = useRef<HTMLVideoElement | null>(null);
    const [blocked, setBlocked] = useState(false);

    useImperativeHandle(ref, () => ({
      start() {
        const v = video.current;
        if (!v) return;
        v.currentTime = 0;
        v.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
      },
    }));

    const finish = () => {
      video.current?.pause();
      onDone();
    };

    return (
      <div className={visible ? "iv iv--on" : "iv"} aria-hidden={!visible} role={visible ? "dialog" : undefined} aria-label={title}>
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
        {blocked && visible ? (
          <button type="button" className="iv-play" onClick={() => { void video.current?.play().then(() => setBlocked(false)); }} aria-label="Play the video">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5.5v13l11-6.5z" /></svg>
          </button>
        ) : null}
        <button type="button" className="iv-skip" onClick={finish}>
          Skip <span aria-hidden>→</span>
        </button>
      </div>
    );
  },
);
