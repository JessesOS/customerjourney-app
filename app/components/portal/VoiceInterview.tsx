"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Voice interview: the first onboarding task. One question at a time; the
 * client answers out loud (browser speech recognition, as in MicButton: free,
 * no backend, no keys) or types. The words land in an editable box, so a
 * mis-heard answer can be fixed before moving on. Where the browser has no
 * speech recognition (e.g. Firefox) the mic is simply absent and the box is
 * typed into. Answers are handed up as one "Q / A" transcript, which the task
 * view saves as the task's note when the client finishes.
 * Each question is also spoken: a pre-rendered clip per question (see
 * scripts/generate-interview-voice.py) plays as the question appears, with a
 * replay button. The portal's voice toggle silences it. Starting the mic
 * stops the clip, so the interviewer is never transcribed.
 * Colours ride the --pj-* tokens, so it follows whichever look is active.
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

export function VoiceInterview({ questions, storageKey, audioBase, sound = true, readOnly = false, onChange }: { questions: string[]; storageKey: string; /** e.g. "/portal/voice/interview-ob-0" → "-1.m4a", "-2.m4a"… */ audioBase?: string; sound?: boolean; readOnly?: boolean; onChange: (transcript: string) => void }) {
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));
  const [i, setI] = useState(0);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [ready, setReady] = useState(false); // saved answers restored, so the right question is known
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Pick up where the client left off if they stepped away mid-interview.
  useEffect(() => {
    setSupported(Boolean(recognitionCtor()));
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(storageKey) ?? "null") as string[] | null;
      if (Array.isArray(saved) && saved.length === questions.length) {
        setAnswers(saved);
        const firstEmpty = saved.findIndex((a) => !a.trim());
        setI(firstEmpty === -1 ? questions.length - 1 : firstEmpty);
      }
    } catch {}
    setReady(true);
    return () => recRef.current?.stop();
  }, [storageKey, questions.length]);

  function hush() {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(false);
  }
  function speak(index: number) {
    hush();
    if (!audioBase) return;
    const a = new Audio(`${audioBase}-${index + 1}.m4a`);
    audioRef.current = a;
    a.onended = () => setSpeaking(false);
    a.onerror = () => setSpeaking(false);
    // A browser may refuse to play before the client has touched the page; the replay button still works.
    a.play().then(() => setSpeaking(true)).catch(() => setSpeaking(false));
  }
  // Ask each question out loud as it appears.
  useEffect(() => {
    if (!ready || readOnly || !sound) { hush(); return; }
    const id = window.setTimeout(() => speak(i), 350);
    return () => { window.clearTimeout(id); hush(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, ready, sound, readOnly, audioBase]);

  useEffect(() => {
    onChangeRef.current(compileInterview(questions, answers));
    try { window.sessionStorage.setItem(storageKey, JSON.stringify(answers)); } catch {}
  }, [answers, questions, storageKey]);

  function setAnswer(text: string) {
    setAnswers((prev) => prev.map((a, k) => (k === i ? text : a)));
  }
  function stop() {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
    setInterim("");
  }
  function start() {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    hush();
    const rec = new Ctor();
    const at = i;
    rec.lang = "en-AU";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let live = "";
      for (let k = event.resultIndex; k < event.results.length; k++) {
        const result = event.results[k];
        const chunk = result[0].transcript.trim();
        if (!chunk) continue;
        if (result.isFinal) setAnswers((prev) => prev.map((a, n) => (n === at ? `${a} ${chunk}`.trim() : a)));
        else live = `${live} ${chunk}`.trim();
      }
      setInterim(live);
    };
    rec.onend = () => { setListening(false); setInterim(""); };
    rec.onerror = () => { setListening(false); setInterim(""); };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }
  function go(to: number) {
    stop();
    setI(Math.max(0, Math.min(questions.length - 1, to)));
  }

  const answered = answers.filter((a) => a.trim()).length;
  const last = i === questions.length - 1;

  return (
    <div className="vi">
      <div className="vi-top">
        <span className="vi-count">
          Question {i + 1} of {questions.length}
        </span>
        {audioBase && !readOnly ? (
          <button type="button" onClick={() => (speaking ? hush() : speak(i))} className={speaking ? "vi-say vi-say--on" : "vi-say"} aria-label={speaking ? "Stop the question" : "Hear the question"}>
            <span className="vi-wave" aria-hidden><i /><i /><i /></span>
            {speaking ? "Stop" : "Hear it"}
          </button>
        ) : null}
        <span className="vi-segs" aria-hidden>
          {questions.map((q, k) => (
            <span key={q} className={k === i ? "vi-seg vi-seg--now" : answers[k].trim() ? "vi-seg vi-seg--done" : "vi-seg"} />
          ))}
        </span>
      </div>

      <div className="vi-q" key={i}>{questions[i]}</div>

      {!readOnly && supported ? (
        <div className="vi-mic-row">
          <button type="button" onClick={listening ? stop : start} className={listening ? "vi-mic vi-mic--on" : "vi-mic"} aria-pressed={listening} aria-label={listening ? "Stop listening" : "Answer out loud"}>
            {listening ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="7" y="7" width="10" height="10" rx="2" /></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            )}
          </button>
          <span className="vi-hint">{listening ? (interim || "Listening…") : answers[i].trim() ? "Tap to add more" : "Tap and answer out loud"}</span>
        </div>
      ) : null}

      <textarea
        className="vi-box"
        value={answers[i]}
        onChange={(e) => setAnswer(e.target.value)}
        readOnly={readOnly}
        rows={4}
        placeholder={supported ? "Your answer appears here. You can also type." : "Type your answer here."}
      />

      <div className="vi-nav">
        <button type="button" onClick={() => go(i - 1)} disabled={i === 0} className="vi-back">
          ← Back
        </button>
        <span className="vi-count" style={{ marginLeft: "auto" }}>
          {answered} of {questions.length} answered
        </span>
        {!last ? (
          <button type="button" onClick={() => go(i + 1)} className="vi-next">
            Next question →
          </button>
        ) : null}
      </div>
    </div>
  );
}
