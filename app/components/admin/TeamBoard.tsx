"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PRIORITY_CHIP, STATUS_LABEL, teamFetch, timeAgo, useMe } from "@/app/components/admin/teamClient";
import { TeamTaskDrawer, type BoardTask, type Member } from "@/app/components/admin/TeamTaskDrawer";

type Step = { id: string; title: string; done: boolean; clientOnly: boolean; note: string | null; uploads: number };
type Stage = { id: string; name: string; dayStart: number; dayEnd: number; ongoing: boolean; teamOnly: boolean; steps: Step[] };
type BoardEvent = { id: number; taskId: number | null; actorName: string; kind: string; fromValue: string | null; toValue: string | null; createdAt: string };
type Board = {
  client: { id: string; name: string; companyName: string; label: string; day: number; calendarDay: number; totalDays: number; journeyState: string; firstOpenedAt: string | null; lastOpenedAt: string | null; portalToken: string };
  board: { productName: string; productVersion: string; variant: string; startedAt: string; startedBy: string } | null;
  startBlocked: string | null;
  productNow: { name: string; version: string; variant: string; tasks: number } | null;
  stages: Stage[];
  tasks: BoardTask[];
  events: BoardEvent[];
  members: Member[];
  roles: string[];
  progress: { clientSteps: { done: number; total: number }; team: { done: number; total: number } };
};

type View = "steps" | "columns" | "categories";
const VIEW_KEY = "tbBoardView";
const COLUMNS: { status: BoardTask["status"]; label: string }[] = [
  { status: "queued", label: "To do" },
  { status: "in_progress", label: "In progress" },
  { status: "complete", label: "Done" },
];

function pct(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

function eventText(e: BoardEvent, tasks: BoardTask[], members: Member[]): string {
  const title = tasks.find((t) => t.id === e.taskId)?.title;
  const person = (email: string | null) => members.find((m) => m.email === email)?.name ?? email;
  const on = title ? ` · ${title}` : "";
  switch (e.kind) {
    case "seed": return `started the board: ${e.toValue}`;
    case "status": return `moved to ${STATUS_LABEL[e.toValue ?? ""] ?? e.toValue}${on}`;
    case "assign": return `${e.toValue ? `assigned ${person(e.toValue)}` : "unassigned"}${on}`;
    case "blocked": return `${e.toValue ? `blocked: ${e.toValue}` : "unblocked"}${on}`;
    case "comment": return `commented${on}: “${e.toValue}”`;
    case "create": return `added a task: ${e.toValue}`;
    case "delete": return `deleted a task: ${e.fromValue}`;
    case "notes": return `edited the notes${on}`;
    case "loom": return `${e.toValue ? "added a Loom link" : "removed the Loom link"}${on}`;
    default: return `changed ${e.kind}${on}`;
  }
}

function TaskCard({ task, onOpen, draggable }: { task: BoardTask; onOpen: () => void; draggable?: boolean }) {
  return (
    <button
      type="button"
      className="tb-task"
      onClick={onOpen}
      draggable={draggable}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(task.id)); e.dataTransfer.effectAllowed = "move"; }}
    >
      <span className={`tb-task-title${task.status === "complete" ? " tb-done" : ""}`}>{task.title}</span>
      <span className="tb-task-meta">
        {task.blockedReason ? <span className="tb-chip tb-chip--red">Blocked</span> : null}
        {task.overdue ? <span className="tb-chip tb-chip--red">Overdue</span> : null}
        {task.doneByClient ? <span className="tb-chip tb-chip--purple">Done by client</span> : null}
        {task.priority === "critical" || task.priority === "high" ? <span className={PRIORITY_CHIP[task.priority]}>{task.priority}</span> : null}
        <span>{task.assigneeName ?? (task.role ? `${task.role} · unassigned` : "Unassigned")}</span>
        {task.dueWindow ? <span>· {task.dueWindow}</span> : null}
      </span>
    </button>
  );
}

function TaskRow({ task, onOpen }: { task: BoardTask; onOpen: () => void }) {
  return (
    <button type="button" className="tb-row" onClick={onOpen}>
      <span className={`tb-dot tb-dot--${task.status}`} aria-label={STATUS_LABEL[task.status]} />
      <span className={task.status === "complete" ? "tb-done" : undefined}>{task.title}</span>
      <span className="tb-task-meta" style={{ justifyContent: "flex-end" }}>
        {task.blockedReason ? <span className="tb-chip tb-chip--red">Blocked</span> : null}
        {task.overdue ? <span className="tb-chip tb-chip--red">Overdue</span> : null}
        {task.doneByClient ? <span className="tb-chip tb-chip--purple">Done by client</span> : null}
        <span>{task.assigneeName ?? task.role ?? ""}</span>
      </span>
    </button>
  );
}

/** One client's team board. */
export function TeamBoard({ clientId }: { clientId: string }) {
  const { me } = useMe();
  const [data, setData] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("steps");
  const [who, setWho] = useState<"all" | "me" | "unassigned">("all");
  const [hideDone, setHideDone] = useState(false);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chat, setChat] = useState<{ id: number; role: string; body: string; createdAt: string }[]>([]);

  useEffect(() => {
    try { const v = window.localStorage.getItem(VIEW_KEY) as View | null; if (v === "steps" || v === "columns" || v === "categories") setView(v); } catch {}
  }, []);
  function pickView(v: View) {
    setView(v);
    try { window.localStorage.setItem(VIEW_KEY, v); } catch {}
  }

  const load = useCallback(async () => {
    const { status, data: d } = await teamFetch<Board>(`/api/admin/team/clients/${clientId}`);
    if (status === 200 && d.ok) { setData(d); setError(null); }
    else setError(d.error ?? "Could not load the board.");
    // The client's "Ask Jesse" panel, if their product has one (empty otherwise).
    const c = await teamFetch<{ messages: { id: number; role: string; body: string; createdAt: string }[] }>(`/api/admin/team/clients/${clientId}/assistant`);
    if (c.status === 200 && c.data.ok) setChat(c.data.messages);
  }, [clientId]);
  useEffect(() => { void load(); }, [load]);

  async function start() {
    if (!data) return;
    if (!window.confirm(`Start a team board for ${data.client.name}? It copies ${data.productNow?.tasks ?? "the"} team tasks from ${data.productNow?.name} ${data.productNow?.version} (${data.productNow?.variant}).`)) return;
    const { status, data: d } = await teamFetch(`/api/admin/team/clients/${clientId}`, { method: "POST" });
    if (status === 200 && d.ok) await load();
    else setError(d.error ?? "Could not start the board.");
  }

  async function moveTask(taskId: number, status: BoardTask["status"]) {
    const task = data?.tasks.find((t) => t.id === taskId);
    if (!task || task.storedStatus === status) return;
    const { status: code, data: d } = await teamFetch(`/api/admin/team/tasks/${taskId}`, { method: "PATCH", json: { status, expectedUpdatedAt: task.updatedAt } });
    if (code !== 200 || !d.ok) setError(d.error ?? "Could not move the task.");
    await load();
  }

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.tasks.filter((t) => {
      if (hideDone && t.status === "complete") return false;
      if (who === "me" && t.assigneeEmail !== me?.email) return false;
      if (who === "unassigned" && t.assigneeEmail) return false;
      if (q && !`${t.title} ${t.category} ${t.role} ${t.assigneeName ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, who, hideDone, me]);

  if (error && !data) return <main className="tb-main"><p className="tb-error">{error}</p></main>;
  if (!data) return <main className="tb-main"><p className="tb-faint">Loading…</p></main>;

  const { client, board, progress } = data;
  const portalLink = `${typeof window === "undefined" ? "" : window.location.origin}/portal/${client.portalToken}`;
  const openTask = data.tasks.find((t) => t.id === openId) ?? null;
  const stageName = new Map(data.stages.map((s) => [s.id, s.name]));
  const steps = data.stages.flatMap((s) => s.steps);

  return (
    <main className="tb-main">
      <div className="tb-card tb-head">
        <div>
          <a href="/admin/board" className="tb-faint" style={{ fontSize: 12.5, textDecoration: "none" }}>← Board</a>
          <h1 className="tb-h1" style={{ marginTop: 6 }}>{client.name}</h1>
          <div className="tb-muted">
            {client.companyName ? `${client.companyName} · ` : ""}{client.label} · Day {client.day} / {client.totalDays}
            {client.journeyState !== "active" ? ` · ${client.journeyState}` : ""} · opened their portal {timeAgo(client.lastOpenedAt)}
          </div>
          <div className="tb-progress">
            <div>
              <div className="tb-faint" style={{ fontSize: 12 }}>Client steps {progress.clientSteps.done} / {progress.clientSteps.total}</div>
              <div className="tb-bar tb-bar--client" style={{ marginTop: 6 }}><i style={{ width: `${pct(progress.clientSteps.done, progress.clientSteps.total)}%` }} /></div>
            </div>
            <div>
              <div className="tb-faint" style={{ fontSize: 12 }}>Team tasks {progress.team.done} / {progress.team.total}</div>
              <div className="tb-bar" style={{ marginTop: 6 }}><i style={{ width: `${pct(progress.team.done, progress.team.total)}%` }} /></div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <button type="button" className="tb-btn tb-btn--small" onClick={() => navigator.clipboard.writeText(portalLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); })}>
            {copied ? "Copied" : "Copy portal link"}
          </button>
          {board ? <span className="tb-faint" style={{ fontSize: 12 }}>{board.productName} {board.productVersion} · {board.variant}</span> : null}
        </div>
      </div>

      {error ? <p className="tb-error">{error}</p> : null}

      {!board ? (
        <div className="tb-card" style={{ padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>No team board yet</h2>
          {data.startBlocked ? (
            <p className="tb-muted" style={{ margin: 0 }}>{data.startBlocked}</p>
          ) : (
            <>
              <p className="tb-muted" style={{ margin: "0 0 14px" }}>
                Starting copies {data.productNow?.tasks} team tasks from {data.productNow?.name} {data.productNow?.version} ({data.productNow?.variant}). Later edits to the product don&apos;t change this board.
              </p>
              <button type="button" className="tb-btn tb-btn--primary" onClick={() => void start()}>Start board</button>
            </>
          )}
        </div>
      ) : (
        <div className="tb-two">
          <div>
            <div className="tb-toolbar">
              <div className="tb-seg" role="group" aria-label="View">
                {(["steps", "columns", "categories"] as View[]).map((v) => (
                  <button key={v} type="button" aria-pressed={view === v} onClick={() => pickView(v)}>
                    {v === "steps" ? "By client step" : v === "columns" ? "Columns" : "Categories"}
                  </button>
                ))}
              </div>
              <div className="tb-seg" role="group" aria-label="Whose tasks">
                {(["all", "me", "unassigned"] as const).map((w) => (
                  <button key={w} type="button" aria-pressed={who === w} onClick={() => setWho(w)}>{w === "all" ? "Everyone" : w === "me" ? "Mine" : "Unassigned"}</button>
                ))}
              </div>
              <label className="tb-muted" style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 13 }}>
                <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> Hide done
              </label>
              <input className="tb-input" style={{ maxWidth: 220 }} placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button type="button" className="tb-btn tb-btn--small" style={{ marginLeft: "auto" }} onClick={() => setAdding((a) => !a)}>+ Add task</button>
            </div>

            {adding ? <AddTask clientId={clientId} stages={data.stages} roles={data.roles} onDone={async () => { setAdding(false); await load(); }} onError={setError} /> : null}

            {view === "columns" ? (
              <div className="tb-cols">
                {COLUMNS.map((col) => {
                  const items = filtered.filter((t) => t.status === col.status);
                  return (
                    <div
                      key={col.status}
                      className={`tb-card tb-col${overCol === col.status ? " tb-col--over" : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setOverCol(col.status); }}
                      onDragLeave={() => setOverCol(null)}
                      onDrop={(e) => { e.preventDefault(); setOverCol(null); const id = Number(e.dataTransfer.getData("text/plain")); if (id) void moveTask(id, col.status); }}
                    >
                      <div className="tb-col-head"><span>{col.label}</span><span>{items.length}</span></div>
                      {items.map((t) => <TaskCard key={t.id} task={t} draggable={!t.doneByClient} onOpen={() => setOpenId(t.id)} />)}
                      {items.length === 0 ? <div className="tb-empty" style={{ fontSize: 13 }}>Nothing here</div> : null}
                    </div>
                  );
                })}
              </div>
            ) : view === "categories" ? (
              <div>
                {Array.from(new Set(filtered.map((t) => t.category || "Other"))).map((cat) => {
                  const items = filtered.filter((t) => (t.category || "Other") === cat);
                  return (
                    <section key={cat} className="tb-card tb-stage">
                      <div className="tb-stage-head">
                        <span className="tb-stage-name">{cat}</span>
                        <span className="tb-faint" style={{ fontSize: 12.5 }}>{items.filter((t) => t.status === "complete").length} / {items.length} done</span>
                      </div>
                      <div className="tb-rows" style={{ paddingLeft: 0 }}>{items.map((t) => <TaskRow key={t.id} task={t} onOpen={() => setOpenId(t.id)} />)}</div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div>
                {data.stages.map((stage) => {
                  const stageTasks = filtered.filter((t) => t.stageId === stage.id);
                  const loose = stageTasks.filter((t) => !t.stepId || !stage.steps.some((s) => s.id === t.stepId));
                  if (stage.steps.length === 0 && stageTasks.length === 0) return null;
                  const all = data.tasks.filter((t) => t.stageId === stage.id || stage.steps.some((s) => s.id === t.stepId));
                  return (
                    <section key={stage.id} className="tb-card tb-stage">
                      <div className="tb-stage-head">
                        <span className="tb-stage-name">{stage.name}{stage.teamOnly ? <span className="tb-chip" style={{ marginLeft: 8 }}>Team only</span> : null}</span>
                        <span className="tb-faint" style={{ fontSize: 12.5 }}>
                          {stage.ongoing ? "Ongoing" : stage.dayStart === stage.dayEnd ? `Day ${stage.dayStart}` : `Days ${stage.dayStart}–${stage.dayEnd}`} · team {all.filter((t) => t.status === "complete").length} / {all.length}
                        </span>
                      </div>
                      {stage.steps.map((step) => {
                        const behind = filtered.filter((t) => t.stepId === step.id);
                        return (
                          <div key={step.id} className="tb-step">
                            <div className="tb-step-head">
                              <span className={`tb-tick${step.done ? " tb-tick--done" : ""}`} title={step.done ? "Client has done this" : "Client hasn't done this yet"}>{step.done ? "✓" : ""}</span>
                              <span style={{ fontWeight: 550 }}>{step.title}</span>
                              <span className="tb-faint" style={{ fontSize: 12 }}>{step.done ? "client done" : "client to do"}{step.uploads ? ` · ${step.uploads} file${step.uploads === 1 ? "" : "s"}` : ""}{step.note ? " · has a note" : ""}</span>
                            </div>
                            {behind.length ? <div className="tb-rows">{behind.map((t) => <TaskRow key={t.id} task={t} onOpen={() => setOpenId(t.id)} />)}</div> : step.clientOnly ? <div className="tb-rows tb-faint" style={{ fontSize: 12.5 }}>Client only, no team task.</div> : null}
                          </div>
                        );
                      })}
                      {loose.length ? (
                        <div className="tb-step">
                          <div className="tb-step-head"><span className="tb-faint" style={{ fontSize: 12.5 }}>Team work in this stage</span></div>
                          <div className="tb-rows">{loose.map((t) => <TaskRow key={t.id} task={t} onOpen={() => setOpenId(t.id)} />)}</div>
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="tb-card tb-feed">
            <div className="tb-label">Activity</div>
            {data.events.length === 0 ? <div className="tb-faint" style={{ fontSize: 13 }}>Nothing yet.</div> : null}
            {data.events.slice(0, 30).map((e) => (
              <div key={e.id} className="tb-feed-item">
                <strong style={{ fontWeight: 600 }}>{e.actorName}</strong> <span className="tb-muted">{eventText(e, data.tasks, data.members)}</span>
                <div className="tb-faint" style={{ fontSize: 11.5 }}>{timeAgo(e.createdAt)}</div>
              </div>
            ))}
            {chat.length ? (
              <>
                <div className="tb-label" style={{ marginTop: 18 }}>Ask Jesse chat</div>
                <div className="tb-faint" style={{ fontSize: 12, marginBottom: 6 }}>What the client asked in their portal, and what the assistant answered. Reply to requests from their task.</div>
                {chat.slice(-30).map((m) => (
                  <div key={m.id} className="tb-feed-item">
                    <strong style={{ fontWeight: 600 }}>{m.role === "client" ? (m.body.startsWith("Request: ") ? "Client request" : "Client") : m.role === "team" ? "Team reply" : "Assistant"}</strong>{" "}
                    <span className="tb-muted" style={{ whiteSpace: "pre-wrap" }}>{m.role === "client" && m.body.startsWith("Request: ") ? m.body.slice(9) : m.body}</span>
                    <div className="tb-faint" style={{ fontSize: 11.5 }}>{timeAgo(m.createdAt)}</div>
                  </div>
                ))}
              </>
            ) : null}
          </aside>
        </div>
      )}

      {openTask ? (
        <TeamTaskDrawer
          task={openTask}
          members={data.members}
          stageName={stageName.get(openTask.stageId) ?? openTask.stageId}
          stepTitle={steps.find((s) => s.id === openTask.stepId)?.title ?? null}
          stepDone={steps.find((s) => s.id === openTask.stepId)?.done ?? false}
          onClose={() => setOpenId(null)}
          onChanged={load}
        />
      ) : null}
    </main>
  );
}

function AddTask({ clientId, stages, roles, onDone, onError }: { clientId: string; stages: Stage[]; roles: string[]; onDone: () => Promise<void>; onError: (e: string) => void }) {
  const [title, setTitle] = useState("");
  const [stageId, setStageId] = useState(stages[0]?.id ?? "onboarding");
  const [stepId, setStepId] = useState("");
  const [role, setRole] = useState("");
  const [priority, setPriority] = useState("normal");
  const [busy, setBusy] = useState(false);
  const stage = stages.find((s) => s.id === stageId);
  return (
    <form
      className="tb-card"
      style={{ padding: 14, marginBottom: 14, display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr 1.4fr 1fr 1fr auto", alignItems: "end" }}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { status, data } = await teamFetch(`/api/admin/team/clients/${clientId}/tasks`, { method: "POST", json: { title, stageId, stepId: stepId || null, role, priority } });
        setBusy(false);
        if (status === 200 && data.ok) await onDone();
        else onError(data.error ?? "Could not add the task.");
      }}
    >
      <div><label className="tb-label">New task</label><input className="tb-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" autoFocus /></div>
      <div><label className="tb-label">Stage</label><select className="tb-select" value={stageId} onChange={(e) => { setStageId(e.target.value); setStepId(""); }}>{stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div><label className="tb-label">Behind client step</label><select className="tb-select" value={stepId} onChange={(e) => setStepId(e.target.value)}><option value="">None (team work)</option>{stage?.steps.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
      <div><label className="tb-label">Role</label><select className="tb-select" value={role} onChange={(e) => setRole(e.target.value)}><option value="">Any</option>{roles.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
      <div><label className="tb-label">Priority</label><select className="tb-select" value={priority} onChange={(e) => setPriority(e.target.value)}>{["low", "normal", "high", "critical"].map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
      <button type="submit" className="tb-btn tb-btn--primary" disabled={busy || !title.trim()}>Add</button>
    </form>
  );
}
