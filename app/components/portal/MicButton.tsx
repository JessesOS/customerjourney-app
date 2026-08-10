"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Dictation button for long-answer fields, using the browser's built-in
 * speech recognition (free, on-device/vendor — no backend, no keys). Renders
 * nothing at all when the browser doesn't support it (e.g. Firefox), so
 * unsupported users just see the normal field. Final transcripts stream to
 * `onText` chunk by chunk; the parent appends them to its field value, where
 * the client can still edit freely.
 */

type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function MicButton({ onText }: { onText: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    setSupported(Boolean(recognitionCtor()));
    return () => recRef.current?.stop();
  }, []);

  if (!supported) return null;

  function stop() {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }

  function start() {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-AU";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const chunk = result[0].transcript.trim();
          if (chunk) onTextRef.current(chunk);
        }
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start())}
      aria-label={listening ? "Stop dictating" : "Dictate your answer"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        marginTop: 8,
        padding: "6px 13px",
        borderRadius: 999,
        border: listening ? "1px solid #c2402a" : "1px solid var(--pj-line)",
        background: listening ? "rgba(194,64,42,0.09)" : "var(--pj-card)",
        color: listening ? "#c2402a" : "var(--pj-faint)",
        fontFamily: "var(--font-body), sans-serif",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
      {listening ? (
        <>
          Listening… tap to stop
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "#c2402a", animation: "pj-mic-pulse 1.1s ease-in-out infinite" }} />
          <style>{`@keyframes pj-mic-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.25 } }`}</style>
        </>
      ) : (
        "Speak instead of typing"
      )}
    </button>
  );
}
