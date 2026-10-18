"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STATUS_LABEL, teamFetch, timeAgo } from "@/app/components/admin/teamClient";

export type BoardTask = {
  id: number;
  templateId: string;
  title: string;
  notes: string;
  stageId: string;
  category: string;
  stepId: string | null;
  role: string;
  assigneeEmail: string | null;
  assigneeName: string | null;
  status: "queued" | "in_progress" | "complete";
  storedStatus: "queued" | "in_progress" | "complete";
  doneByClient: boolean;
  blockedReason: string;
  priority: string;
  dueWindow: string;
  dueDayStart: number | null;
  dueDayEnd: number | null;
  overdue: boolean;
  dependencies: { templateId: string; title: string; done: boolean }[];
  loomUrl: string;
  isCustom: boolean;
  updatedAt: string;
  completedAt: string | null;
  completedBy: string | null;
};

export type Member = { email: string; name: string; roles: string[] };

type TaskEvent = { id: number; actorName: string; kind: string; fromValue: string | null; toValue: string | null; createdAt: string };

/** One task: everything the team needs to work it. Saves each change straight away. */
export function TeamTaskDrawer({
  task,
  members,
  stageName,
  stepTitle,
  stepDone,
  onClose,
  onChanged,
}: {
  task: BoardTask;
  members: Member[];
  stageName: string;
  stepTitle: string | null;
  stepDone: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [comment, setComment] = useState("");
  const [reply, setReply] = useState("");
  const [notes, setNotes] = useState(task.notes);
  const [editingNotes, setEditingNotes] = useState(false);
  const [blocked, setBlocked] = useState(task.blockedReason);
  const [loom, setLoom] = useState(task.loomUrl);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { setNotes(task.notes); setBlocked(task.blockedReason); setLoom(task.loomUrl); }, [task.id, task.notes, task.blockedReason, task.loomUrl]);
  useEffect(() => { closeRef.current?.focus(); }, [task.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const loadEvents = useCallback(async () => {
    const { status, data } = await teamFetch<{ events: TaskEvent[] }>(`/api/admin/team/tasks/${task.id}`);
    if (status === 200 && data.ok) setEvents(data.events);
  }, [task.id]);
  useEffect(() => { void loadEvents(); }, [loadEvents]);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    const { status, data } = await teamFetch(`/api/admin/team/tasks/${task.id}`, { method: "PATCH", json: { ...patch, expectedUpdatedAt: task.updatedAt } });
    setSaving(false);
    if (status !== 200 || !data.ok) setError(data.error ?? "Could not save.");
    await onChanged();
    await loadEvents();
  }

  async function addComment() {
    if (!comment.trim()) return;
    const { status, data } = await teamFetch(`/api/admin/team/tasks/${task.id}/comments`, { method: "POST", json: { text: comment } });
    if (status === 200 && data.ok) { setComment(""); await loadEvents(); await onChanged(); }
    else setError(data.error ?? "Could not add the comment.");
  }

  async function replyToClient() {
    if (!reply.trim()) return;
    const { status, data } = await teamFetch(`/api/admin/team/tasks/${task.id}/reply`, { method: "POST", json: { text: reply } });
    if (status === 200 && data.ok) { setReply(""); await loadEvents(); await onChanged(); }
    else setError(data.error ?? "Could not send the reply.");
  }

  async function remove() {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    const { status, data } = await teamFetch(`/api/admin/team/tasks/${task.id}`, { method: "DELETE" });
    if (status === 200 && data.ok) { await onChanged(); onClose(); }
    else setError(data.error ?? "Could not delete.");
  }

  const roleMembers = members.filter((m) => !task.role || m.roles.includes(task.role));
  const otherMembers = members.filter((m) => !roleMembers.includes(m));

  return (
    <>
      <div className="tb-scrim" onClick={onClose} />
      <aside className="tb-drawer" role="dialog" aria-modal="true" aria-label={task.title}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div className="tb-faint" style={{ fontSize: 12 }}>{stageName}{task.category ? ` · ${task.category}` : ""} · {task.templateId}</div>
            <h2 style={{ fontSize: 19, fontWeight: 650, letterSpacing: "-0.01em", margin: "4px 0 0" }}>{task.title}</h2>
          </div>
          <button ref={closeRef} type="button" className="tb-btn tb-btn--small" onClick={onClose} aria-label="Close">Close</button>
        </div>

        {error ? <p className="tb-error" style={{ marginTop: 12 }}>{error}</p> : null}
        {task.doneByClient ? (
          <p className="tb-chip tb-chip--purple" style={{ marginTop: 12, padding: "6px 10px", whiteSpace: "normal" }}>Done automatically: the client finished the steps this task waits on.</p>
        ) : null}

        <div className="tb-drawer-grid">
          <div>
            <label className="tb-label" htmlFor="tb-status">Status</label>
            <select id="tb-status" className="tb-select" value={task.storedStatus} disabled={saving} onChange={(e) => void save({ status: e.target.value })}>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="tb-label" htmlFor="tb-assignee">Assignee</label>
            <select id="tb-assignee" className="tb-select" value={task.assigneeEmail ?? ""} disabled={saving} onChange={(e) => void save({ assigneeEmail: e.target.value || null })}>
              <option value="">Unassigned</option>
              {roleMembers.length ? <optgroup label={task.role ? `${task.role}` : "Team"}>{roleMembers.map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}</optgroup> : null}
              {otherMembers.length ? <optgroup label="Everyone else">{otherMembers.map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}</optgroup> : null}
            </select>
          </div>
          <div>
            <label className="tb-label" htmlFor="tb-priority">Priority</label>
            <select id="tb-priority" className="tb-select" value={task.priority} disabled={saving} onChange={(e) => void save({ priority: e.target.value })}>
              {["low", "normal", "high", "critical"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <span className="tb-label">Due</span>
            <div style={{ padding: "8px 0" }}>
              {task.dueWindow || "Not set"}
              {task.overdue ? <span className="tb-chip tb-chip--red" style={{ marginLeft: 8 }}>Overdue</span> : null}
            </div>
          </div>
        </div>

        <div className="tb-field">
          <span className="tb-label">Role</span>
          <div>{task.role || "Any"}</div>
        </div>

        {stepTitle ? (
          <div className="tb-field">
            <span className="tb-label">Behind client step</span>
            <div>{stepTitle} <span className={stepDone ? "tb-chip tb-chip--purple" : "tb-chip"}>{stepDone ? "client done" : "client to do"}</span></div>
          </div>
        ) : null}

        <div className="tb-field">
          <label className="tb-label" htmlFor="tb-blocked">Blocked by</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input id="tb-blocked" className="tb-input" placeholder="Nothing (not blocked)" value={blocked} onChange={(e) => setBlocked(e.target.value)} />
            <button type="button" className="tb-btn tb-btn--small" disabled={saving || blocked === task.blockedReason} onClick={() => void save({ blockedReason: blocked.trim() })}>Save</button>
            {task.blockedReason ? <button type="button" className="tb-btn tb-btn--small" disabled={saving} onClick={() => { setBlocked(""); void save({ blockedReason: "" }); }}>Unblock</button> : null}
          </div>
        </div>

        {task.dependencies.length ? (
          <div className="tb-field">
            <span className="tb-label">Do these first</span>
            {task.dependencies.map((d) => (
              <div key={d.templateId} style={{ fontSize: 13 }}><span className={d.done ? "tb-done" : undefined}>{d.title}</span> <span className="tb-faint">{d.done ? "done" : "open"}</span></div>
            ))}
          </div>
        ) : null}

        <div className="tb-field">
          <label className="tb-label" htmlFor="tb-loom">Loom link</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input id="tb-loom" className="tb-input" placeholder="https://www.loom.com/share/…" value={loom} onChange={(e) => setLoom(e.target.value)} />
            <button type="button" className="tb-btn tb-btn--small" disabled={saving || loom === task.loomUrl} onClick={() => void save({ loomUrl: loom.trim() })}>Save</button>
          </div>
          {task.loomUrl ? <a href={task.loomUrl} target="_blank" rel="noreferrer" className="tb-faint" style={{ fontSize: 12.5 }}>Open the Loom ↗</a> : null}
        </div>

        <div className="tb-field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="tb-label">How to do it</span>
            <button type="button" className="tb-btn tb-btn--small" onClick={() => setEditingNotes((v) => !v)}>{editingNotes ? "Cancel" : "Edit"}</button>
          </div>
          {editingNotes ? (
            <>
              <textarea className="tb-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <button type="button" className="tb-btn tb-btn--small tb-btn--primary" style={{ marginTop: 8 }} disabled={saving} onClick={() => { setEditingNotes(false); void save({ notes }); }}>Save notes</button>
            </>
          ) : (
            <div className="tb-notes">{task.notes || "No notes."}</div>
          )}
        </div>

        {task.category === "Support requests" ? (
          <div className="tb-field">
            <label className="tb-label" htmlFor="tb-reply">Reply to the client</label>
            <textarea id="tb-reply" className="tb-textarea" style={{ minHeight: 70 }} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Shows in their Ask Jesse panel, under this request" />
            <button type="button" className="tb-btn tb-btn--small tb-btn--primary" style={{ marginTop: 8 }} disabled={!reply.trim()} onClick={() => void replyToClient()}>Send to client</button>
          </div>
        ) : null}

        <div className="tb-field">
          <label className="tb-label" htmlFor="tb-comment">Comment</label>
          <textarea id="tb-comment" className="tb-textarea" style={{ minHeight: 70 }} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add an update for the team" />
          <button type="button" className="tb-btn tb-btn--small" style={{ marginTop: 8 }} disabled={!comment.trim()} onClick={() => void addComment()}>Add comment</button>
        </div>

        <div className="tb-field">
          <span className="tb-label">History</span>
          {events.length === 0 ? <div className="tb-faint" style={{ fontSize: 13 }}>No changes yet.</div> : null}
          {events.map((e) => (
            <div key={e.id} className="tb-feed-item">
              <strong style={{ fontWeight: 600 }}>{e.actorName}</strong>{" "}
              <span className="tb-muted">
                {e.kind === "comment" ? `: “${e.toValue}”` : e.kind === "status" ? `moved it to ${STATUS_LABEL[e.toValue ?? ""] ?? e.toValue}` : e.kind === "assign" ? (e.toValue ? `assigned ${members.find((m) => m.email === e.toValue)?.name ?? e.toValue}` : "unassigned it") : e.kind === "blocked" ? (e.toValue ? `blocked it: ${e.toValue}` : "unblocked it") : e.kind === "create" ? "added this task" : `changed the ${e.kind}`}
              </span>
              <div className="tb-faint" style={{ fontSize: 11.5 }}>{timeAgo(e.createdAt)}</div>
            </div>
          ))}
        </div>

        {task.isCustom ? <button type="button" className="tb-btn tb-btn--small tb-btn--danger" onClick={() => void remove()}>Delete this task</button> : null}
      </aside>
    </>
  );
}
