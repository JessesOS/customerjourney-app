"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Voice interview: the first onboarding task, shaped like a voice call.
 * The centrepiece is the interviewer, drawn as a glowing orb. The client
 * taps it once to start; the interviewer asks a question out loud (a
 * pre-rendered clip per question, see scripts/generate-interview-voice.py),
 * then listens (browser speech recognition, as in MicButton: free, no
 * backend, no keys). The client taps the orb when they have finished
 * answering and the next question follows. Everything said is written out
 * underneath as a running transcript, and any answer can be typed or fixed.
 * Where the browser has no speech recognition (e.g. Firefox) the answers are
 * typed. Answers are handed up as one "Q / A" transcript, which the task
 * view saves as the task's note when the client finishes.
 */

type SpeechResultEvent = { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
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

export function compileInterview(questions: string[], answers: string[]) {
  return questions
    .map((q, i) => ((answers[i] ?? "").trim() ? `Q: ${q}\nA: ${answers[i].trim()}` : ""))
    .filter(Boolean)
    .join("\n\n");
}

// idle: not started. asking: the interviewer is speaking. listening: the mic is open.
// typing: the client is typing or fixing an answer. done: every question has been asked.
type Phase = "idle" | "asking" | "listening" | "typing" | "done";

export function VoiceInterview({
  questions,
  storageKey,
  audioBase,
  sound = true,
  onChange,
}: {
  questions: string[];
  storageKey: string;
  /** e.g. "/portal/voice/interview-ob-0" → "-1.m4a", "-2.m4a"… */
  audioBase?: string;
  sound?: boolean;
  onChange: (transcript: string) => void;
}) {
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [supported, setSupported] = useState(false);
  const [interim, setInterim] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const last = questions.length - 1;

  // Pick up where the client left off if they stepped away mid-interview.
  useEffect(() => {
    setSupported(Boolean(recognitionCtor()));
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(storageKey) ?? "null") as string[] | null;
      if (Array.isArray(saved) && saved.length === questions.length) {
        setAnswers(saved);
        const firstEmpty = saved.findIndex((a) => !a.trim());
        if (firstEmpty === -1) { setI(questions.length - 1); setPhase("done"); }
        else setI(firstEmpty);
      }
    } catch {}
    return () => { recRef.current?.stop(); audioRef.current?.pause(); };
  }, [storageKey, questions.length]);

  useEffect(() => {
    onChangeRef.current(compileInterview(questions, answers));
    try { window.sessionStorage.setItem(storageKey, JSON.stringify(answers)); } catch {}
  }, [answers, questions, storageKey]);

  // Keep the newest line of the transcript in view.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [i, phase, interim, answers]);

  function hush() {
    if (audioRef.current) { audioRef.current.onended = null; audioRef.current.pause(); audioRef.current = null; }
  }
  function stopListening() {
    if (recRef.current) { recRef.current.onend = null; recRef.current.stop(); recRef.current = null; }
    setInterim("");
  }
  function listen(k: number) {
    hush();
    const Ctor = recognitionCtor();
    if (!Ctor) { setPhase("typing"); return; }
    stopListening();
    const rec = new Ctor();
    rec.lang = "en-AU";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let live = "";
      for (let n = event.resultIndex; n < event.results.length; n++) {
        const result = event.results[n];
        const chunk = result[0].transcript.trim();
        if (!chunk) continue;
        if (result.isFinal) setAnswers((prev) => prev.map((a, idx) => (idx === k ? `${a} ${chunk}`.trim() : a)));
        else live = `${live} ${chunk}`.trim();
      }
      setInterim(live);
    };
    // The browser closes the mic after a long silence or if permission is refused: fall back to typing.
    rec.onend = () => { recRef.current = null; setInterim(""); setPhase((p) => (p === "listening" ? "typing" : p)); };
    rec.onerror = () => {};
    recRef.current = rec;
    try { rec.start(); setPhase("listening"); } catch { setPhase("typing"); }
  }
  function ask(k: number) {
    stopListening();
    hush();
    setI(k);
    setPhase("asking");
    if (!audioBase || !sound) { window.setTimeout(() => listen(k), 900); return; }
    const a = new Audio(`${audioBase}-${k + 1}.m4a`);
    audioRef.current = a;
    a.onended = () => listen(k);
    a.onerror = () => listen(k);
    a.play().catch(() => listen(k));
  }
  function next() {
    stopListening();
    hush();
    if (i < last) ask(i + 1);
    else setPhase("done");
  }
  function orb() {
    if (phase === "idle") ask(i);
    else if (phase === "asking") listen(i); // skip the rest of the question
    else if (phase === "listening" || phase === "typing") next();
    else ask(0); // done: go round again from the top, keeping the answers
  }
  function edit(k: number) {
    stopListening();
    hush();
    setI(k);
    setPhase("typing");
  }

  const started = phase !== "idle";
  const status =
    phase === "idle"
      ? answers.some((a) => a.trim()) ? "Tap to carry on" : "Tap to start"
      : phase === "asking"
        ? "Asking…"
        : phase === "listening"
          ? "Listening. Tap when you’ve finished."
          : phase === "typing"
            ? "Type your answer, then tap to go on."
            : "All done. Thank you.";
  const shown = started ? questions.map((_, k) => k).filter((k) => k <= i || answers[k].trim()) : questions.map((_, k) => k).filter((k) => answers[k].trim());

  return (
    <div className="vi">
      <button type="button" onClick={orb} className={`vi-orb vi-orb--${phase}`} aria-label={status}>
        <span className="vi-orb-glow" aria-hidden />
        <span className="vi-orb-ring" aria-hidden />
        <span className="vi-orb-body" aria-hidden data-xray="Interviewer orb · CSS, drawn in code" data-xray-tool="code">
          <span className="vi-orb-swirl" />
          <span className="vi-orb-shine" />
        </span>
        <span className="vi-orb-icon" aria-hidden>
          {phase === "idle" ? (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
          ) : phase === "asking" ? (
            <span className="vi-bars"><i /><i /><i /><i /><i /></span>
          ) : phase === "done" ? (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4 10-12" /></svg>
          ) : (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          )}
        </span>
      </button>

      <div className="vi-status" aria-live="polite">{status}</div>
      <div className="vi-count">
        {started && phase !== "done" ? `Question ${i + 1} of ${questions.length}` : `${questions.length} questions · about 5 minutes`}
      </div>

      {shown.length > 0 ? (
        <div className="vi-log" ref={logRef}>
          {shown.map((k) => {
            const current = k === i && started && phase !== "done";
            return (
              <div key={k} className={current ? "vi-turn vi-turn--now" : "vi-turn"}>
                <div className="vi-who">Interviewer</div>
                <div className="vi-said vi-said--q">{questions[k]}</div>
                <div className="vi-who" style={{ marginTop: 12 }}>
                  You
                  {!current && answers[k].trim() ? (
                    <button type="button" onClick={() => edit(k)} className="vi-edit">Edit</button>
                  ) : null}
                </div>
                {current && phase === "typing" ? (
                  <textarea
                    className="vi-box"
                    autoFocus
                    value={answers[k]}
                    onChange={(e) => setAnswers((prev) => prev.map((a, idx) => (idx === k ? e.target.value : a)))}
                    rows={3}
                    placeholder="Type your answer here."
                  />
                ) : (
                  <div className="vi-said">
                    {answers[k]}
                    {current && interim ? <span className="vi-interim"> {interim}</span> : null}
                    {current && phase === "listening" && !answers[k] && !interim ? <span className="vi-interim">…</span> : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {started && phase !== "done" ? (
        <div className="vi-tools">
          {audioBase && sound ? (
            <button type="button" onClick={() => ask(i)} className="vi-tool">Hear it again</button>
          ) : null}
          {phase === "listening" ? (
            <button type="button" onClick={() => edit(i)} className="vi-tool">Type instead</button>
          ) : phase === "typing" && supported ? (
            <button type="button" onClick={() => listen(i)} className="vi-tool">Speak instead</button>
          ) : null}
          {i > 0 ? (
            <button type="button" onClick={() => ask(i - 1)} className="vi-tool">Previous question</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
