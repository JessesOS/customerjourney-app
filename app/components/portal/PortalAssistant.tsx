"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MicButton } from "./MicButton";

/**
 * "Ask Jesse" (Jesse, 2026-10-18): a sound-wave button, bottom right, that
 * opens a side panel. The client asks a question (typed, or spoken with the
 * mic) and gets an answer from their reviewed project notes, or sends a
 * request to Jesse. Requests become tasks on the team board; Jesse's replies
 * come back here, with a dot on the button until they've been seen.
 * Shown only when the client's product switches it on (journey.assistant).
 */

type Message = { id: number; role: "client" | "assistant" | "team"; body: string; requestTaskId: number | null; createdAt: string };
type Request = { id: number; taskId: number | null; title: string; detail: string; status: string; createdAt: string; replies: { body: string; createdAt: string }[] };
type Suggestion = { title: string } | null;

const STATUS: Record<string, string> = { queued: "Open", in_progress: "In progress", complete: "Done" };
const REQUEST_PREFIX = "Request: ";

export function PortalAssistant({ portalToken, firstName }: { portalToken: string; firstName: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"ask" | "requests">("ask");
  const [messages, setMessages] = useState<Message[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion>(null);
  const [form, setForm] = useState<{ title: string; detail: string } | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [unread, setUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const seenKey = `pjAssistantSeen:${portalToken}`;
  const base = `/api/portal/${portalToken}/assistant`;

  const load = useCallback(async () => {
    try {
      const res = await fetch(base);
      if (!res.ok) return;
      const data = (await res.json()) as { ok: boolean; messages: Message[]; requests: Request[] };
      if (!data.ok) return;
      setMessages(data.messages);
      setRequests(data.requests);
      const lastTeam = Math.max(0, ...data.messages.filter((m) => m.role === "team").map((m) => m.id));
      let seen = 0;
      try { seen = Number(window.localStorage.getItem(seenKey) ?? 0); } catch {}
      setUnread(lastTeam > seen);
    } catch {}
  }, [base, seenKey]);

  useEffect(() => { void load(); }, [load]);

  // Opening the panel marks Jesse's replies as seen.
  useEffect(() => {
    if (!open) return;
    const lastTeam = Math.max(0, ...messages.filter((m) => m.role === "team").map((m) => m.id));
    try { window.localStorage.setItem(seenKey, String(lastTeam)); } catch {}
    setUnread(false);
  }, [open, messages, seenKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, suggestion, open, tab]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("textarea, input, button")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); buttonRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function ask() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    setSuggestion(null);
    setSent(null);
    setMessages((prev) => [...prev, { id: -Date.now(), role: "client", body: text, requestTaskId: null, createdAt: new Date().toISOString() }]);
    setBusy(true);
    try {
      const res = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      const data = (await res.json()) as { ok: boolean; reply?: string; suggestRequest?: boolean; requestTitle?: string; error?: string };
      if (!data.ok || !data.reply) {
        setError(data.error ?? "Something went wrong. Try again, or send it to Jesse below.");
        setSuggestion({ title: text.slice(0, 80) });
        return;
      }
      setMessages((prev) => [...prev, { id: -Date.now() - 1, role: "assistant", body: data.reply!, requestTaskId: null, createdAt: new Date().toISOString() }]);
      if (data.suggestRequest) setSuggestion({ title: data.requestTitle?.trim() || text.slice(0, 80) });
    } catch {
      setError("Connection hiccup. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendRequest(title: string, detail: string) {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${base}/requests`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, detail }) });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) { setError(data.error ?? "Couldn't send that. Try again."); return; }
      setSuggestion(null);
      setForm(null);
      setSent("Sent to Jesse. You'll see his reply here, under Requests.");
      await load();
    } catch {
      setError("Connection hiccup. Try again.");
    } finally {
      setBusy(false);
    }
  }

  // The last question before a suggestion, as the request's details.
  const lastQuestion = [...messages].reverse().find((m) => m.role === "client" && !m.body.startsWith(REQUEST_PREFIX))?.body ?? "";
  const chat = messages.filter((m) => !(m.role === "client" && m.body.startsWith(REQUEST_PREFIX)));
  const openRequests = requests.filter((r) => r.status !== "complete").length;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="pja-button"
        aria-label={open ? "Close Ask Jesse" : unread ? "Ask Jesse (Jesse has replied)" : "Ask Jesse"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="pja-wave" aria-hidden><i /><i /><i /><i /><i /></span>
        <span className="pja-button-label">Ask Jesse</span>
        {unread && <span className="pja-dot" aria-hidden />}
      </button>

      {open && (
        <div ref={panelRef} className="pja-panel" role="dialog" aria-modal="false" aria-label="Ask Jesse">
          <div className="pja-head">
            <div>
              <div className="pja-title">Ask Jesse</div>
              <div className="pja-sub">Questions about your project, or a request for Jesse.</div>
            </div>
            <button type="button" className="pja-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>

          <div className="pja-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "ask"} className={tab === "ask" ? "pja-tab is-on" : "pja-tab"} onClick={() => setTab("ask")}>Ask</button>
            <button type="button" role="tab" aria-selected={tab === "requests"} className={tab === "requests" ? "pja-tab is-on" : "pja-tab"} onClick={() => setTab("requests")}>
              Requests{openRequests ? ` (${openRequests})` : ""}
            </button>
          </div>

          <div ref={scrollRef} className="pja-body">
            {tab === "ask" ? (
              <>
                {chat.length === 0 && (
                  <div className="pja-msg is-assistant">
                    Hi{firstName ? ` ${firstName}` : ""}. Ask me anything about your project: what&apos;s next, what we need from you, or how something works. For anything else, send it straight to Jesse.
                  </div>
                )}
                {chat.map((m) => (
                  <div key={m.id} className={m.role === "client" ? "pja-msg is-client" : m.role === "team" ? "pja-msg is-team" : "pja-msg is-assistant"}>
                    {m.role === "team" && <div className="pja-from">Jesse replied to your request</div>}
                    {m.body}
                  </div>
                ))}
                {busy && !form && <div className="pja-msg is-assistant pja-typing" aria-label="Thinking"><i /><i /><i /></div>}
                {suggestion && !form && (
                  <div className="pja-suggest">
                    <div>Want me to send this to Jesse?</div>
                    <div className="pja-row">
                      <button type="button" className="pja-btn is-primary" disabled={busy} onClick={() => setForm({ title: suggestion.title, detail: lastQuestion })}>Send to Jesse</button>
                      <button type="button" className="pja-btn" onClick={() => setSuggestion(null)}>No thanks</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {requests.length === 0 && <div className="pja-empty">No requests yet. Anything you send to Jesse shows here, with his replies.</div>}
                {requests.map((r) => (
                  <div key={r.id} className="pja-request">
                    <div className="pja-row" style={{ justifyContent: "space-between" }}>
                      <strong>{r.title}</strong>
                      <span className={`pja-status is-${r.status}`}>{STATUS[r.status] ?? "Open"}</span>
                    </div>
                    {r.detail && <div className="pja-detail">{r.detail}</div>}
                    {r.replies.map((reply, i) => (
                      <div key={i} className="pja-msg is-team"><div className="pja-from">Jesse</div>{reply.body}</div>
                    ))}
                  </div>
                ))}
              </>
            )}

            {form && (
              <div className="pja-form">
                <label className="pja-label" htmlFor="pja-title">What's it about?</label>
                <input id="pja-title" className="pja-input" value={form.title} maxLength={160} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <label className="pja-label" htmlFor="pja-detail">Details (optional)</label>
                <textarea id="pja-detail" className="pja-input" rows={4} value={form.detail} maxLength={4000} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
                <div className="pja-row">
                  <button type="button" className="pja-btn is-primary" disabled={busy || !form.title.trim()} onClick={() => void sendRequest(form.title, form.detail)}>{busy ? "Sending…" : "Send to Jesse"}</button>
                  <button type="button" className="pja-btn" onClick={() => setForm(null)}>Cancel</button>
                </div>
              </div>
            )}
            {sent && <div className="pja-note">{sent}</div>}
            {error && <div className="pja-error">{error}</div>}
          </div>

          <div className="pja-foot">
            {tab === "ask" && !form ? (
              <>
                <div className="pja-row">
                  <textarea
                    className="pja-input pja-ask"
                    rows={1}
                    value={input}
                    placeholder="Ask a question…"
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void ask(); } }}
                  />
                  <button type="button" className="pja-btn is-primary" disabled={busy || !input.trim()} onClick={() => void ask()}>Ask</button>
                </div>
                <MicButton onText={(chunk) => setInput((prev) => `${prev} ${chunk}`.trim())} />
              </>
            ) : null}
            {!form && (
              <button type="button" className="pja-link" onClick={() => { setForm({ title: "", detail: "" }); setSent(null); }}>Send a request to Jesse</button>
            )}
            <div className="pja-fine">Never share passwords, seed phrases or private keys here.</div>
          </div>
        </div>
      )}
    </>
  );
}
