"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { teamFetch, timeAgo } from "@/app/components/admin/teamClient";

// The client's Messages threads on their board (AT Network first, 2026-10-21):
// read by step, reply on any step. Renders nothing for products without comms.

type Comm = { id: number; stepId: string; kind: string; authorSide: "client" | "team"; authorName: string; body: string; createdAt: string };
type Step = { id: string; title: string };
type View = { enabled: boolean; steps: Step[]; comms: Comm[]; unread: number };

const ALL = "__all";

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

  const shown = filter === ALL ? view.comms : view.comms.filter((c) => c.stepId === filter);
  const lastClient = Math.max(0, ...view.comms.filter((c) => c.authorSide === "client").map((c) => c.id));
  const label = (id: string) => (id ? titleOf.get(id) ?? id : "General");

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

  return (
    <>
      <div className="tb-label" style={{ marginTop: 18 }}>
        Messages{view.unread ? ` · ${view.unread} new` : ""}
      </div>
      <div className="tb-faint" style={{ fontSize: 12, marginBottom: 6 }}>The client&apos;s threads, by step. Reply within one business day. Nothing here can be edited or deleted.</div>
      <select value={filter} onChange={(e) => { setFilter(e.target.value); if (e.target.value !== ALL) setStepId(e.target.value); }} style={{ width: "100%", marginBottom: 8 }} aria-label="Show messages for">
        <option value={ALL}>All ({view.comms.length})</option>
        <option value="">General</option>
        {view.steps.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
      </select>
      {shown.length === 0 ? <div className="tb-faint" style={{ fontSize: 13 }}>No messages yet.</div> : null}
      {shown.slice(-40).map((c) => (
        <div key={c.id} className="tb-feed-item">
          <strong style={{ fontWeight: 600 }}>{c.authorSide === "client" ? c.authorName || "Client" : `${c.authorName || "Team"} (team)`}</strong>{" "}
          {filter === ALL ? <span className="tb-faint">on {label(c.stepId)}</span> : null}
          <div className="tb-muted" style={{ whiteSpace: "pre-wrap" }}>{c.body}</div>
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
