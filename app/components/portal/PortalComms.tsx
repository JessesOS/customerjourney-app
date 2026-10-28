"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Messages (AT Network first, Jesse 2026-10-21): a button, bottom left, that
 * opens the client's threads with the team. Every message sits on a step (or
 * is general), carries the sender's typed name (several people share one
 * link) and stays as a dated record. Filter by step; write on any step, even
 * one already ticked. Shown only when the product switches on journey.comms.
 * Phase 2 (2026-10-25): a message can be sent as an Approval (full name, a
 * dated record) or a Change request (the team marks it quoted, approved,
 * declined, parked for Phase 2, or done; the status shows here).
 * Reuses the Ask Jesse panel's look (pja-*); its own position lives below.
 */

type Kind = "message" | "approval" | "change_request" | "status";
type Status = "open" | "quoted" | "approved" | "declined" | "parked" | "done";
type Comm = { id: number; stepId: string; kind: Kind; authorSide: "client" | "team"; authorName: string; body: string; parentId: number | null; status: Status | null; createdAt: string; currentStatus?: Status };
type Step = { id: string; title: string };

const ALL = "__all";
const GENERAL = "";
const STATUS_LABEL: Record<Status, string> = { open: "Open", quoted: "Quoted", approved: "Approved", declined: "Declined", parked: "Parked for Phase 2", done: "Done" };
const KIND_HINT: Record<Exclude<Kind, "status">, string> = {
  message: "A question, an update, or feedback.",
  approval: "Approve something in writing. Your full name is recorded with the date and time.",
  change_request: "Something outside Phase 1. We quote it, you approve the quote, then we build it.",
};

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
  const [filter, setFilter] = useState<string>(ALL);
  const [stepId, setStepId] = useState<string>(GENERAL);
  const [kind, setKind] = useState<Exclude<Kind, "status">>("message");
  const [name, setName] = useState("");
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
    try { setName(window.localStorage.getItem(nameKey) ?? ""); } catch {}
  }, [load, nameKey]);

  // Another part of the portal can open a step's thread: window.dispatchEvent(new CustomEvent("pjc:open", { detail: stepId })).
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail ?? GENERAL;
      setFilter(id);
      setStepId(id);
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
  }, [comms, open, filter]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); buttonRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const fullName = name.trim().split(/\s+/).length >= 2;
  const canSend = Boolean(text.trim()) && Boolean(name.trim()) && (kind !== "approval" || fullName) && !busy;

  async function send() {
    if (!canSend) return;
    setBusy(true);
    setError(null);
    try {
      const author = name.trim();
      try { window.localStorage.setItem(nameKey, author); } catch {}
      const res = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stepId, kind, authorName: author, body: text.trim() }) });
      const data = (await res.json()) as { ok: boolean; comms?: Comm[]; error?: string };
      if (!data.ok) { setError(data.error ?? "Couldn't send that. Try again."); return; }
      setText("");
      setKind("message");
      if (data.comms) setComms(data.comms);
      if (filter !== ALL && filter !== stepId) setFilter(stepId);
    } catch {
      setError("Connection hiccup. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of comms) if (c.kind !== "status") m.set(c.stepId, (m.get(c.stepId) ?? 0) + 1);
    return m;
  }, [comms]);
  const visible = comms.filter((c) => c.kind !== "status");
  const shown = filter === ALL ? visible : visible.filter((c) => c.stepId === filter);
  const label = (id: string) => (id ? titleOf.get(id) ?? "A step" : "General");
  const openRequests = visible.filter((c) => c.kind === "change_request" && (c.currentStatus === "open" || c.currentStatus === "quoted")).length;

  return (
    <>
      <style>{`
        .pjc-button { position: fixed; left: 22px; bottom: 22px; z-index: 65; display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px 11px 15px; border: 1px solid var(--pj-line); border-radius: 999px; background: var(--pj-card); color: var(--pj-ink); font: 650 14px var(--font-body), sans-serif; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.16); }
        .pjc-button:hover, .pjc-button:focus-visible { border-color: var(--pj-act); }
        .pjc-panel.pja-panel { left: 22px; right: auto; }
        .pjc-tools { display: flex; gap: 8px; padding: 0 16px 10px; border-bottom: 1px solid var(--pj-line); }
        .pjc-select { flex: 1; min-width: 0; padding: 7px 10px; border-radius: 10px; border: 1px solid var(--pj-line); background: var(--pj-card); color: var(--pj-ink); font: 500 13px var(--font-body), sans-serif; }
        .pjc-meta { font-size: 11.5px; color: var(--pj-faint); margin-top: 4px; }
        .pjc-msg.is-client .pjc-meta { color: inherit; opacity: 0.7; }
        .pjc-step { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.75; margin-bottom: 3px; }
        .pjc-kind { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; margin-bottom: 5px; border: 1px solid currentColor; opacity: 0.85; }
        .pjc-msg.is-approval { border: 1px solid var(--pj-done); }
        .pjc-msg.is-change { border: 1px solid var(--pj-act); }
        .pjc-status { display: inline-block; margin-top: 6px; font-size: 11.5px; font-weight: 650; padding: 2px 8px; border-radius: 999px; background: var(--pj-act-fill, rgba(0,0,0,0.06)); color: var(--pj-act); }
        .pjc-kinds { display: flex; gap: 6px; margin-bottom: 8px; }
        .pjc-kinds button { flex: 1; padding: 6px 8px; border-radius: 999px; border: 1px solid var(--pj-line); background: var(--pj-card); color: var(--pj-muted); font: 600 12px var(--font-body), sans-serif; cursor: pointer; }
        .pjc-kinds button.is-on { background: var(--pj-ink); color: var(--pj-card); border-color: var(--pj-ink); }
        .pjc-hint { font-size: 11.5px; color: var(--pj-faint); margin: -2px 0 8px; }
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
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Messages</span>
        {unread > 0 && <span className="pja-dot" aria-hidden />}
      </button>

      {open && (
        <div className="pja-panel pjc-panel" role="dialog" aria-modal="false" aria-label="Messages">
          <div className="pja-head">
            <div>
              <div className="pja-title">Messages</div>
              <div className="pja-sub">Questions, feedback and change requests, kept on each step. We reply within one business day.{openRequests ? ` ${openRequests} change request${openRequests === 1 ? "" : "s"} open.` : ""}</div>
            </div>
            <button type="button" className="pja-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>

          {visible.length > 0 && (
          <div className="pjc-tools">
            <select className="pjc-select" aria-label="Show messages for" value={filter} onChange={(e) => { setFilter(e.target.value); if (e.target.value !== ALL) setStepId(e.target.value); }}>
              <option value={ALL}>All messages ({visible.length})</option>
              <option value={GENERAL}>General{counts.get(GENERAL) ? ` (${counts.get(GENERAL)})` : ""}</option>
              {steps.map((s) => (
                <option key={s.id} value={s.id}>{s.title}{counts.get(s.id) ? ` (${counts.get(s.id)})` : ""}</option>
              ))}
            </select>
          </div>
          )}

          <div ref={scrollRef} className="pja-body">
            {shown.map((c) => (
              <div key={c.id} className={`pja-msg pjc-msg ${c.authorSide === "client" ? "is-client" : "is-team"}${c.kind === "approval" ? " is-approval" : c.kind === "change_request" ? " is-change" : ""}`}>
                {filter === ALL && <div className="pjc-step">{label(c.stepId)}</div>}
                {c.kind === "approval" && <div className="pjc-kind">Approval</div>}
                {c.kind === "change_request" && <div className="pjc-kind">Change request</div>}
                {c.body}
                {c.kind === "change_request" && c.currentStatus && <div><span className="pjc-status">{STATUS_LABEL[c.currentStatus]}</span></div>}
                <div className="pjc-meta">{c.authorName || (c.authorSide === "team" ? "Jesse" : "You")} · {when(c.createdAt)}</div>
              </div>
            ))}
            {error && <div className="pja-error">{error}</div>}
          </div>

          <div className="pja-foot">
            <div className="pjc-kinds" role="tablist" aria-label="What are you sending?">
              {(["message", "change_request"] as const).map((k) => (
                <button key={k} type="button" role="tab" aria-selected={kind === k} className={kind === k ? "is-on" : ""} onClick={() => setKind(k)}>
                  {k === "message" ? "Message" : "Change request"}
                </button>
              ))}
            </div>
            <div className="pjc-hint">{KIND_HINT[kind]}</div>
            <select className="pjc-select" aria-label="Which step is this about?" value={stepId} onChange={(e) => setStepId(e.target.value)} style={{ width: "100%", marginBottom: 8 }}>
              <option value={GENERAL}>About: General</option>
              {steps.map((s) => (
                <option key={s.id} value={s.id}>About: {s.title}</option>
              ))}
            </select>
            <input className="pja-input" aria-label={kind === "approval" ? "Your full name" : "Your name"} placeholder={kind === "approval" ? "Your full name (first and last)" : "Your name"} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
            <div className="pja-row">
              <textarea
                className="pja-input pja-ask"
                rows={2}
                value={text}
                placeholder={kind === "approval" ? "What you're approving, in your words…" : kind === "change_request" ? "What you'd like changed or added…" : "Write a message…"}
                maxLength={6000}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void send(); } }}
              />
              <button type="button" className="pja-btn is-primary" disabled={!canSend} onClick={() => void send()}>{busy ? "Sending…" : kind === "approval" ? "Approve" : "Send"}</button>
            </div>
            <div className="pja-fine">{kind === "approval" ? "Approving here is a written record with your name, the date and the time." : "Never share passwords here."}</div>
          </div>
        </div>
      )}
    </>
  );
}
