"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Messages (AT Network first, Jesse 2026-10-21): a button, bottom left, that
 * opens the client's messages with the team. Several people share one link, so
 * each message carries the sender's name (asked once, kept on that device).
 * Shown only when the product switches on journey.comms.
 * Simplified 2026-10-28 (Jesse): no pickers or tabs. Opened from a step, it is
 * "Message about: <step>" and shows that step's messages; opened from the
 * button, it is "Message Jesse" and messages go as general. A change request
 * is a small link under the box (the team marks it quoted, approved, declined,
 * parked for Phase 2, or done; the status shows here). Older approvals still
 * show; the client no longer sends them from here.
 * Reuses the Ask Jesse panel's look (pja-*); its own position lives below.
 */

type Kind = "message" | "approval" | "change_request" | "status";
type Status = "open" | "quoted" | "approved" | "declined" | "parked" | "done";
type Comm = { id: number; stepId: string; kind: Kind; authorSide: "client" | "team"; authorName: string; body: string; parentId: number | null; status: Status | null; createdAt: string; currentStatus?: Status };
type Step = { id: string; title: string };

const GENERAL = "";
const STATUS_LABEL: Record<Status, string> = { open: "Open", quoted: "Quoted", approved: "Approved", declined: "Declined", parked: "Parked for Phase 2", done: "Done" };

function when(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function PortalComms({ portalToken, steps }: { portalToken: string; steps: Step[] }) {
  const [open, setOpen] = useState(false);
  const [comms, setComms] = useState<Comm[]>([]);
  const [unread, setUnread] = useState(0);
  const [stepId, setStepId] = useState<string>(GENERAL);
  const [change, setChange] = useState(false);
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const nameKey = `pjcName:${portalToken}`;
  const base = `/api/portal/${portalToken}/comms`;
  const titleOf = useMemo(() => new Map(steps.map((s) => [s.id, s.title])), [steps]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(base);
      if (!res.ok) return;
      const data = (await res.json()) as { ok: boolean; comms: Comm[]; unread: number };
      if (!data.ok) return;
      setComms(data.comms);
      setUnread(data.unread);
    } catch {}
  }, [base]);

  useEffect(() => {
    void load();
    try {
      const n = window.localStorage.getItem(nameKey) ?? "";
      setName(n);
      setSavedName(n);
    } catch {}
  }, [load, nameKey]);

  // Another part of the portal can open a step's messages: window.dispatchEvent(new CustomEvent("pjc:open", { detail: stepId })).
  useEffect(() => {
    const onOpen = (e: Event) => {
      setStepId((e as CustomEvent<string>).detail ?? GENERAL);
      setChange(false);
      setOpen(true);
    };
    window.addEventListener("pjc:open", onOpen);
    return () => window.removeEventListener("pjc:open", onOpen);
  }, []);

  // Opening the panel marks the team's replies as seen.
  useEffect(() => {
    if (!open) return;
    const lastTeam = Math.max(0, ...comms.filter((c) => c.authorSide === "team").map((c) => c.id));
    if (unread && lastTeam) {
      setUnread(0);
      void fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seen: lastTeam }) }).catch(() => {});
    }
  }, [open, comms, unread, base]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [comms, open, stepId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); buttonRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const canSend = Boolean(text.trim()) && Boolean(name.trim()) && !busy;

  async function send() {
    if (!canSend) return;
    setBusy(true);
    setError(null);
    try {
      const author = name.trim();
      try { window.localStorage.setItem(nameKey, author); } catch {}
      const res = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stepId, kind: change ? "change_request" : "message", authorName: author, body: text.trim() }) });
      const data = (await res.json()) as { ok: boolean; comms?: Comm[]; error?: string };
      if (!data.ok) { setError(data.error ?? "Couldn't send that. Try again."); return; }
      setText("");
      setChange(false);
      setSavedName(author);
      if (data.comms) setComms(data.comms);
    } catch {
      setError("Connection hiccup. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const visible = comms.filter((c) => c.kind !== "status");
  // From a step: that step's messages. From the button: everything, each labelled with its step.
  const shown = stepId ? visible.filter((c) => c.stepId === stepId) : visible;
  const label = (id: string) => (id ? titleOf.get(id) ?? "A step" : "General");
  const openRequests = visible.filter((c) => c.kind === "change_request" && (c.currentStatus === "open" || c.currentStatus === "quoted")).length;
  const editingName = !savedName;

  return (
    <>
      <style>{`
        .pjc-button { position: fixed; left: 22px; bottom: 22px; z-index: 65; display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px 11px 15px; border: 1px solid var(--pj-line); border-radius: 999px; background: var(--pj-card); color: var(--pj-ink); font: 650 14px var(--font-body), sans-serif; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.16); }
        .pjc-button:hover, .pjc-button:focus-visible { border-color: var(--pj-act); }
        .pjc-panel.pja-panel { left: 22px; right: auto; }
        .pjc-panel.pja-panel.is-empty { height: auto; }
        .pjc-meta { font-size: 11.5px; color: var(--pj-faint); margin-top: 4px; }
        .pjc-msg.is-client .pjc-meta { color: inherit; opacity: 0.7; }
        .pjc-step { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.75; margin-bottom: 3px; }
        .pjc-kind { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; margin-bottom: 5px; border: 1px solid currentColor; opacity: 0.85; }
        .pjc-msg.is-approval { border: 1px solid var(--pj-done); }
        .pjc-msg.is-change { border: 1px solid var(--pj-act); }
        .pjc-status { display: inline-block; margin-top: 6px; font-size: 11.5px; font-weight: 650; padding: 2px 8px; border-radius: 999px; background: var(--pj-act-fill, rgba(0,0,0,0.06)); color: var(--pj-act); }
        .pjc-link { padding: 0; border: 0; background: none; color: var(--pj-muted); font: 500 12px var(--font-body), sans-serif; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
        .pjc-link:hover, .pjc-link:focus-visible { color: var(--pj-ink); }
        .pjc-change { font-size: 12px; color: var(--pj-act); }
        .pjc-under { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        @media (max-width: 640px) {
          .pjc-button { left: 14px; bottom: 14px; }
          .pjc-panel.pja-panel { left: 0; right: 0; }
        }
      `}</style>

      <button
        ref={buttonRef}
        type="button"
        className="pjc-button"
        aria-label={open ? "Close messages" : unread ? `Messages (${unread} new)` : "Messages"}
        aria-expanded={open}
        onClick={() => { if (!open) { setStepId(GENERAL); setChange(false); } setOpen((v) => !v); }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Messages</span>
        {unread > 0 && <span className="pja-dot" aria-hidden />}
      </button>

      {open && (
        <div className={`pja-panel pjc-panel${shown.length || error ? "" : " is-empty"}`} role="dialog" aria-modal="false" aria-label="Messages">
          <div className="pja-head">
            <div>
              <div className="pja-title">{stepId ? `Message about: ${label(stepId)}` : "Message Jesse"}</div>
              <div className="pja-sub">We reply within one business day.{openRequests ? ` ${openRequests} change request${openRequests === 1 ? "" : "s"} open.` : ""}</div>
            </div>
            <button type="button" className="pja-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>

          {(shown.length > 0 || error) && (
            <div ref={scrollRef} className="pja-body">
              {shown.map((c) => (
                <div key={c.id} className={`pja-msg pjc-msg ${c.authorSide === "client" ? "is-client" : "is-team"}${c.kind === "approval" ? " is-approval" : c.kind === "change_request" ? " is-change" : ""}`}>
                  {!stepId && <div className="pjc-step">{label(c.stepId)}</div>}
                  {c.kind === "approval" && <div className="pjc-kind">Approval</div>}
                  {c.kind === "change_request" && <div className="pjc-kind">Change request</div>}
                  {c.body}
                  {c.kind === "change_request" && c.currentStatus && <div><span className="pjc-status">{STATUS_LABEL[c.currentStatus]}</span></div>}
                  <div className="pjc-meta">{c.authorName || (c.authorSide === "team" ? "Jesse" : "You")} · {when(c.createdAt)}</div>
                </div>
              ))}
              {error && <div className="pja-error">{error}</div>}
            </div>
          )}

          <div className="pja-foot">
            {editingName && (
              <input className="pja-input" aria-label="Your name" placeholder="Your name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
            )}
            {change && (
              <div className="pjc-change">Change request: we quote it, you approve the quote, then we build it. <button type="button" className="pjc-link" onClick={() => setChange(false)}>Cancel</button></div>
            )}
            <div className="pja-row">
              <textarea
                className="pja-input pja-ask"
                rows={2}
                value={text}
                placeholder={change ? "What you'd like added or changed…" : "Write a message…"}
                maxLength={6000}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void send(); } }}
              />
              <button type="button" className="pja-btn is-primary" disabled={!canSend} onClick={() => void send()}>{busy ? "Sending…" : "Send"}</button>
            </div>
            <div className="pjc-under">
              {!change ? (
                <button type="button" className="pjc-link" onClick={() => setChange(true)}>Asking for something that&apos;s not in the agreement?</button>
              ) : <span />}
              {!editingName && (
                <span className="pja-fine">Sending as {savedName} · <button type="button" className="pjc-link" onClick={() => setSavedName("")}>Change</button></span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
