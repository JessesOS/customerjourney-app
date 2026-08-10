"use client";

import { useEffect, useRef, useState } from "react";
import { MicButton } from "./MicButton";

/**
 * "Test your AI receptionist live" — a working playground on the Testing task.
 * Chats through the client's own generated qualification script (token-scoped
 * API), takes voice input via MicButton, and can speak replies aloud with the
 * browser's built-in TTS. Same brain the production bot gets; demo body.
 */

type ChatMessage = { role: "user" | "assistant"; content: string };

export function ReceptionistPlayground({ portalToken }: { portalToken: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notReady, setNotReady] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speak, setSpeak] = useState(false);
  const speakRef = useRef(speak);
  speakRef.current = speak;
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  function sayAloud(text: string) {
    try {
      if (!speakRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-AU";
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang === "en-AU");
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  async function send(history: ChatMessage[]) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/${portalToken}/receptionist-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = (await res.json()) as { ok: boolean; reply?: string; error?: string };
      if (res.status === 409) {
        setNotReady(data.error ?? "Your AI is still being set up — check back shortly.");
        return;
      }
      if (!data.ok || !data.reply) {
        setError(data.error ?? "The receptionist dropped the call — try again.");
        return;
      }
      setMessages([...history, { role: "assistant", content: data.reply }]);
      sayAloud(data.reply);
    } catch {
      setError("Connection hiccup — try again.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void send([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    void send(next);
  }

  if (notReady) {
    return (
      <div style={{ marginTop: 18, border: "1px solid var(--pj-line)", borderRadius: "var(--pj-radius-card)", background: "var(--pj-well)", padding: "18px 20px", fontSize: 14, color: "var(--pj-faint)", fontStyle: "italic" }}>
        {notReady}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18, border: "1px solid var(--pj-line)", borderRadius: "var(--pj-radius-card)", background: "var(--pj-card)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid var(--pj-line)", background: "var(--pj-well)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: "#0a7d33" }} />
          <span style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)" }}>
            Your AI receptionist — live test
          </span>
        </div>
        <button
          type="button"
          onClick={() => { const next = !speak; setSpeak(next); if (!next && typeof window !== "undefined") window.speechSynthesis?.cancel(); }}
          style={{ background: "none", border: "1px solid var(--pj-line)", borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: speak ? "var(--pj-act)" : "var(--pj-faint)", cursor: "pointer", fontFamily: "var(--font-body), sans-serif" }}
        >
          {speak ? "🔊 Voice on" : "🔇 Voice off"}
        </button>
      </div>

      <div ref={scrollRef} style={{ maxHeight: 340, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "82%", padding: "10px 14px", borderRadius: 14, fontSize: 14, lineHeight: 1.45, fontFamily: "var(--font-body), sans-serif", background: m.role === "user" ? "var(--pj-ink)" : "var(--pj-well)", color: m.role === "user" ? "var(--pj-bg, #fff)" : "var(--pj-ink)" }}>
            {m.content}
          </div>
        ))}
        {busy && (
          <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: 14, fontSize: 14, background: "var(--pj-well)", color: "var(--pj-faint)", fontStyle: "italic" }}>
            …
          </div>
        )}
        {error && <div style={{ fontSize: 12.5, color: "#b3261e" }}>{error}</div>}
      </div>

      <div style={{ borderTop: "1px solid var(--pj-line)", padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Say something a customer would say…"
            style={{ flex: 1, padding: "11px 14px", borderRadius: 999, border: "1px solid var(--pj-line)", background: "var(--pj-well)", color: "var(--pj-ink)", fontSize: 14, outline: "none", fontFamily: "var(--font-body), sans-serif" }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy || !input.trim()}
            style={{ padding: "11px 20px", borderRadius: 999, border: "none", background: "var(--pj-act)", color: "var(--pj-act-ink, #fff)", fontSize: 14, fontWeight: 650, cursor: busy ? "wait" : "pointer", fontFamily: "var(--font-body), sans-serif" }}
          >
            Send
          </button>
        </div>
        <MicButton onText={(chunk) => setInput((prev) => `${prev} ${chunk}`.trim())} />
      </div>
    </div>
  );
}
