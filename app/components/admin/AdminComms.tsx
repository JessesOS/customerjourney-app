"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { teamFetch, timeAgo } from "@/app/components/admin/teamClient";

// The client's Messages threads on their board (AT Network first, 2026-10-21):
// read by step, reply on any step. Phase 2 (2026-10-25): change requests show
// their status with a picker (open, quoted, approved, declined, parked, done),
// approvals are marked, an "overdue" flag shows when a client message has
// waited more than one business day, and the record exports as CSV or a
// printable page. Renders nothing for products without comms.

type Kind = "message" | "approval" | "change_request" | "status";
type Status = "open" | "quoted" | "approved" | "declined" | "parked" | "done";
type Comm = { id: number; stepId: string; kind: Kind; authorSide: "client" | "team"; authorName: string; body: string; parentId: number | null; status: Status | null; createdAt: string; currentStatus?: Status };
type Step = { id: string; title: string };
type View = { enabled: boolean; steps: Step[]; comms: Comm[]; unread: number; oldestUnanswered: string | null };

const ALL = "__all";
const STATUSES: Status[] = ["open", "quoted", "approved", "declined", "parked", "done"];
const STATUS_LABEL: Record<Status, string> = { open: "Open", quoted: "Quoted", approved: "Approved", declined: "Declined", parked: "Parked (Phase 2)", done: "Done" };

/** More than one business day old (Mon-Fri, ignoring public holidays). */
function overdue(iso: string): boolean {
  const then = new Date(iso);
  const nowD = new Date();
  let days = 0;
  const d = new Date(then);
  d.setHours(0, 0, 0, 0);
  while (d < nowD) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) days += 1;
    if (days > 1) return nowD.getTime() - then.getTime() > 24 * 60 * 60 * 1000;
  }
  return false;
}

export function AdminComms({ clientId }: { clientId: string }) {
  const [view, setView] = useState<View | null>(null);
  const [filter, setFilter] = useState(ALL);
  const [stepId, setStepId] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = `/api/admin/team/clients/${clientId}/comms`;

  const load = useCallback(async () => {
    const { status, data } = await teamFetch<View>(url);
    if (status === 200 && data.ok) setView(data);
  }, [url]);
  useEffect(() => { void load(); }, [load]);

  const titleOf = useMemo(() => new Map((view?.steps ?? []).map((s) => [s.id, s.title])), [view]);
  if (!view?.enabled) return null;

  const visible = view.comms.filter((c) => c.kind !== "status");
  const shown = filter === ALL ? visible : visible.filter((c) => c.stepId === filter);
  const lastClient = Math.max(0, ...view.comms.filter((c) => c.authorSide === "client").map((c) => c.id));
  const label = (id: string) => (id ? titleOf.get(id) ?? id : "General");
  const isOverdue = view.oldestUnanswered ? overdue(view.oldestUnanswered) : false;
  const statusNotes = (id: number) => view!.comms.filter((c) => c.kind === "status" && c.parentId === id);

  async function markRead() {
    if (!lastClient) return;
    await teamFetch(url, { method: "POST", json: { seen: lastClient } });
    await load();
  }

  async function reply() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    const { data } = await teamFetch<View>(url, { method: "POST", json: { stepId, body: text } });
    setBusy(false);
    if (!data.ok) { setError(data.error ?? "Could not send."); return; }
    setText("");
    await load();
  }

  async function setStatus(requestId: number, status: Status) {
    const note = window.prompt(`Mark this change request ${STATUS_LABEL[status]}. Add a note for the client (optional):`, "") ?? null;
    if (note === null) return;
    const { data } = await teamFetch<View>(url, { method: "POST", json: { requestId, status, note } });
    if (!data.ok) { setError(data.error ?? "Could not update."); return; }
    await load();
  }

  return (
    <>
      <div className="tb-label" style={{ marginTop: 18 }}>
        Messages{view.unread ? ` · ${view.unread} new` : ""}{isOverdue ? " · OVERDUE" : ""}
      </div>
      <div className="tb-faint" style={{ fontSize: 12, marginBottom: 6 }}>
        The client&apos;s threads, by step. Reply within one business day.{isOverdue ? " A client message has waited more than a business day." : ""} Nothing here can be edited or deleted.
        {" "}<a href={`${url}/export`} target="_blank" rel="noopener noreferrer">Record</a> · <a href={`${url}/export?format=csv`}>CSV</a>
      </div>
      <select value={filter} onChange={(e) => { setFilter(e.target.value); if (e.target.value !== ALL) setStepId(e.target.value); }} style={{ width: "100%", marginBottom: 8 }} aria-label="Show messages for">
        <option value={ALL}>All ({visible.length})</option>
        <option value="">General</option>
        {view.steps.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
      </select>
      {shown.length === 0 ? <div className="tb-faint" style={{ fontSize: 13 }}>No messages yet.</div> : null}
      {shown.slice(-40).map((c) => (
        <div key={c.id} className="tb-feed-item">
          <strong style={{ fontWeight: 600 }}>{c.authorSide === "client" ? c.authorName || "Client" : `${c.authorName || "Team"} (team)`}</strong>{" "}
          {c.kind === "approval" ? <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#2e7d32" }}>APPROVAL</span> : null}
          {c.kind === "change_request" ? <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>CHANGE REQUEST · {STATUS_LABEL[c.currentStatus ?? "open"]}</span> : null}
          {filter === ALL ? <span className="tb-faint"> on {label(c.stepId)}</span> : null}
          <div className="tb-muted" style={{ whiteSpace: "pre-wrap" }}>{c.body}</div>
          {c.kind === "change_request" ? (
            <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <select value={c.currentStatus ?? "open"} onChange={(e) => void setStatus(c.id, e.target.value as Status)} aria-label="Change request status">
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
              {statusNotes(c.id).map((s) => <span key={s.id} className="tb-faint" style={{ fontSize: 11.5 }}>{STATUS_LABEL[s.status ?? "open"]} · {timeAgo(s.createdAt)}{s.body ? `: ${s.body}` : ""}</span>)}
            </div>
          ) : null}
          <div className="tb-faint" style={{ fontSize: 11.5 }}>{timeAgo(c.createdAt)}</div>
        </div>
      ))}
      {view.unread ? <button type="button" className="tb-btn" onClick={() => void markRead()} style={{ marginBottom: 8 }}>Mark as read</button> : null}
      <select value={stepId} onChange={(e) => setStepId(e.target.value)} style={{ width: "100%", marginBottom: 6 }} aria-label="Reply on">
        <option value="">Reply on: General</option>
        {view.steps.map((s) => <option key={s.id} value={s.id}>Reply on: {s.title}</option>)}
      </select>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Reply to the client…" style={{ width: "100%" }} />
      <button type="button" className="tb-btn" disabled={busy || !text.trim()} onClick={() => void reply()}>{busy ? "Sending…" : "Send reply"}</button>
      {error ? <div className="tb-faint" style={{ color: "#c0392b", fontSize: 12 }}>{error}</div> : null}
    </>
  );
}
