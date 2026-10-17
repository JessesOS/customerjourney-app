"use client";

import { useCallback, useEffect, useState } from "react";
import { teamFetch, timeAgo } from "@/app/components/admin/teamClient";

type OverviewClient = {
  id: string;
  name: string;
  companyName: string;
  label: string;
  day: number;
  totalDays: number;
  journeyState: string;
  boardStarted: boolean;
  startBlocked: string | null;
  clientSteps: { done: number; total: number };
  nextStep: { id: string; title: string } | null;
  team: { done: number; total: number };
  flags: { blocked: number; overdue: number; stuck: number; unassignedNow: number };
  lastOpenedAt: string | null;
  lastActivityAt: string | null;
  daysSinceActivity: number | null;
};

function pct(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

/** Every client and what needs attention, worst first. */
export function TeamOverview() {
  const [clients, setClients] = useState<OverviewClient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { status, data } = await teamFetch<{ clients: OverviewClient[] }>("/api/admin/team/overview");
    if (status === 200 && data.ok) { setClients(data.clients); setError(null); }
    else setError(data.error ?? "Could not load the board.");
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function start(c: OverviewClient) {
    if (!window.confirm(`Start a team board for ${c.name} (${c.label})? It copies the team tasks for their product.`)) return;
    setStarting(c.id);
    const { status, data } = await teamFetch(`/api/admin/team/clients/${c.id}`, { method: "POST" });
    setStarting(null);
    if (status === 200 && data.ok) window.location.href = `/admin/clients/${c.id}/board`;
    else setError(data.error ?? "Could not start the board.");
  }

  const started = clients?.filter((c) => c.boardStarted) ?? [];
  const notStarted = clients?.filter((c) => !c.boardStarted) ?? [];

  return (
    <main className="tb-main">
      <h1 className="tb-h1">Board</h1>
      <p className="tb-sub">Every client, with what needs attention first.</p>
      {error ? <p className="tb-error">{error}</p> : null}
      {!clients ? <p className="tb-faint">Loading…</p> : null}

      {clients && started.length === 0 ? <div className="tb-card tb-empty">No team boards yet. Start one below.</div> : null}
      <div className="tb-ov">
        {started.map((c) => {
          const quiet = c.daysSinceActivity !== null && c.daysSinceActivity >= 3 && c.nextStep;
          return (
            <a key={c.id} href={`/admin/clients/${c.id}/board`} className="tb-card tb-ov-row" style={{ textDecoration: "none" }}>
              <div>
                <div className="tb-ov-name">{c.name}</div>
                <div className="tb-faint" style={{ fontSize: 12.5 }}>{c.label} · Day {c.day} / {c.totalDays}{c.journeyState !== "active" ? ` · ${c.journeyState}` : ""}</div>
              </div>
              <div>
                <div className="tb-faint" style={{ fontSize: 12 }}>Client steps {c.clientSteps.done} / {c.clientSteps.total}</div>
                <div className="tb-bar tb-bar--client" style={{ margin: "6px 0" }}><i style={{ width: `${pct(c.clientSteps.done, c.clientSteps.total)}%` }} /></div>
                <div className="tb-muted" style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nextStep ? `Next: ${c.nextStep.title}` : "All client steps done"}</div>
              </div>
              <div>
                <div className="tb-faint" style={{ fontSize: 12 }}>Team tasks {c.team.done} / {c.team.total}</div>
                <div className="tb-bar" style={{ margin: "6px 0" }}><i style={{ width: `${pct(c.team.done, c.team.total)}%` }} /></div>
                <div className="tb-faint" style={{ fontSize: 12.5 }}>Client active {timeAgo(c.lastActivityAt)}</div>
              </div>
              <div className="tb-flags">
                {c.flags.blocked ? <span className="tb-chip tb-chip--red">{c.flags.blocked} blocked</span> : null}
                {c.flags.overdue ? <span className="tb-chip tb-chip--red">{c.flags.overdue} overdue</span> : null}
                {c.flags.stuck ? <span className="tb-chip tb-chip--gold">{c.flags.stuck} stuck</span> : null}
                {c.flags.unassignedNow ? <span className="tb-chip tb-chip--blue">{c.flags.unassignedNow} unassigned now</span> : null}
                {quiet ? <span className="tb-chip tb-chip--purple">Client quiet {c.daysSinceActivity} days</span> : null}
                {!c.flags.blocked && !c.flags.overdue && !c.flags.stuck && !c.flags.unassignedNow && !quiet ? <span className="tb-chip tb-chip--teal">On track</span> : null}
              </div>
              <span className="tb-btn tb-btn--small">Open</span>
            </a>
          );
        })}
      </div>

      {notStarted.length ? (
        <>
          <h2 className="tb-label" style={{ margin: "28px 0 10px" }}>No team board yet</h2>
          <div className="tb-ov">
            {notStarted.map((c) => (
              <div key={c.id} className="tb-card tb-ov-row">
                <div>
                  <div className="tb-ov-name">{c.name}</div>
                  <div className="tb-faint" style={{ fontSize: 12.5 }}>{c.label} · Day {c.day} / {c.totalDays}</div>
                </div>
                <div className="tb-faint" style={{ fontSize: 12.5 }}>Client steps {c.clientSteps.done} / {c.clientSteps.total}</div>
                <div className="tb-faint" style={{ fontSize: 12.5 }}>Opened {timeAgo(c.lastOpenedAt)}</div>
                <div className="tb-faint" style={{ fontSize: 12.5 }}>{c.startBlocked ?? ""}</div>
                {c.startBlocked ? (
                  <a className="tb-btn tb-btn--small" href={`/admin/clients/${c.id}/board`}>View</a>
                ) : (
                  <button type="button" className="tb-btn tb-btn--small tb-btn--primary" disabled={starting === c.id} onClick={() => void start(c)}>
                    {starting === c.id ? "Starting…" : "Start board"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </main>
  );
}
