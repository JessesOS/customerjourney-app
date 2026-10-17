"use client";

import { useCallback, useEffect, useState } from "react";
import { STATUS_LABEL, teamFetch, useMe } from "@/app/components/admin/teamClient";

type MyTask = {
  id: number;
  title: string;
  role: string;
  status: string;
  blockedReason: string;
  overdue: boolean;
  dueWindow: string;
  updatedAt: string;
  clientId: string;
  clientName: string;
};

/** The signed-in person's open tasks across every client, plus unclaimed ones in their roles. */
export function MyTasks() {
  const { me } = useMe();
  const [mine, setMine] = useState<MyTask[] | null>(null);
  const [claimable, setClaimable] = useState<MyTask[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { status, data } = await teamFetch<{ mine: MyTask[]; claimable: MyTask[] }>("/api/admin/team/my-tasks");
    if (status === 200 && data.ok) { setMine(data.mine); setClaimable(data.claimable); setError(null); }
    else setError(data.error ?? "Could not load your tasks.");
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function take(t: MyTask) {
    if (!me) return;
    const { status, data } = await teamFetch(`/api/admin/team/tasks/${t.id}`, { method: "PATCH", json: { assigneeEmail: me.email, expectedUpdatedAt: t.updatedAt } });
    if (status !== 200 || !data.ok) setError(data.error ?? "Could not take the task.");
    await load();
  }

  const row = (t: MyTask, action?: React.ReactNode) => (
    <div key={t.id} className="tb-card" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", padding: "12px 14px" }}>
      <div>
        <a href={`/admin/clients/${t.clientId}/board`} style={{ textDecoration: "none", fontWeight: 550 }}>{t.title}</a>
        <div className="tb-task-meta" style={{ marginTop: 4 }}>
          <span>{t.clientName}</span>
          <span>· {STATUS_LABEL[t.status] ?? t.status}</span>
          {t.dueWindow ? <span>· {t.dueWindow}</span> : null}
          {t.blockedReason ? <span className="tb-chip tb-chip--red">Blocked</span> : null}
          {t.overdue ? <span className="tb-chip tb-chip--red">Overdue</span> : null}
          {t.role ? <span className="tb-chip">{t.role}</span> : null}
        </div>
      </div>
      {action}
    </div>
  );

  return (
    <main className="tb-main" style={{ maxWidth: 900 }}>
      <h1 className="tb-h1">My tasks</h1>
      <p className="tb-sub">Your open tasks across every client, most urgent first.</p>
      {error ? <p className="tb-error">{error}</p> : null}
      {!mine ? <p className="tb-faint">Loading…</p> : null}
      {mine && mine.length === 0 ? <div className="tb-card tb-empty">Nothing assigned to you.</div> : null}
      <div style={{ display: "grid", gap: 8 }}>{mine?.map((t) => row(t))}</div>

      {claimable.length ? (
        <>
          <h2 className="tb-label" style={{ margin: "28px 0 10px" }}>Unclaimed in your roles</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {claimable.map((t) => row(t, <button type="button" className="tb-btn tb-btn--small tb-btn--primary" onClick={() => void take(t)}>Take it</button>))}
          </div>
        </>
      ) : null}
      {me && me.roles.length === 0 ? <p className="tb-faint" style={{ marginTop: 20, fontSize: 13 }}>You have no roles yet, so no unclaimed tasks show here. An admin can add roles on the Team page.</p> : null}
    </main>
  );
}
