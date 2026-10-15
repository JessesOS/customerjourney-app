"use client";

import { useCallback, useEffect, useState } from "react";
import { buildJourneyStages } from "@/lib/onboardingJourney";
import { buildRespondJourneyStages } from "@/lib/respondJourney";
import { buildBssJourneyStages } from "@/lib/bssJourney";
import type { ClientType, JourneyStage } from "@/lib/journeyEngine";

/**
 * The team's checklist for one client: every task in their journey, grouped
 * by stage, ticked when done. Tasks the team does are marked "Team"; ticking
 * them is the only way they get done. Ticking a client's own task here marks
 * it done for them too, so use that only when they've done it another way.
 */
function stagesFor(clientType: ClientType): JourneyStage[] {
  const none = new Set<string>();
  if (clientType === "respond") return buildRespondJourneyStages(none, 1);
  if (clientType === "bss") return buildBssJourneyStages(none, 1);
  return buildJourneyStages(none, 1, clientType);
}

export function AdminTaskChecklist({ clientId, clientType, adminToken, onChanged }: { clientId: string; clientType: ClientType; adminToken?: string; onChanged?: () => void }) {
  const [done, setDone] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const headers: HeadersInit = { "Content-Type": "application/json", ...(adminToken ? { "x-admin-token": adminToken } : {}) };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/portal-clients/${clientId}/milestones`, { headers: adminToken ? { "x-admin-token": adminToken } : {}, cache: "no-store" });
      const payload = (await res.json()) as { ok: boolean; completed?: string[]; error?: string };
      if (!payload.ok) throw new Error(payload.error ?? "Could not load tasks.");
      setDone(new Set(payload.completed ?? []));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load tasks.");
    }
  }, [clientId, adminToken]);

  useEffect(() => { void load(); }, [load]);

  async function toggle(milestoneId: string, next: boolean) {
    setBusy(milestoneId);
    setError("");
    try {
      const res = await fetch(`/api/admin/portal-clients/${clientId}/milestones`, { method: "POST", headers, body: JSON.stringify({ milestoneId, done: next }) });
      const payload = (await res.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error ?? "Could not update the task.");
      setDone((prev) => {
        const s = new Set(prev ?? []);
        if (next) s.add(milestoneId); else s.delete(milestoneId);
        return s;
      });
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the task.");
    } finally {
      setBusy(null);
    }
  }

  const stages = stagesFor(clientType);
  const total = stages.reduce((n, s) => n + s.milestones.length, 0);
  const count = done ? stages.reduce((n, s) => n + s.milestones.filter((m) => done.has(m.id)).length, 0) : 0;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(252,250,246,0.4)" }}>Tasks</div>
        <div style={{ fontSize: 12, color: "rgba(252,250,246,0.5)" }}>{done ? `${count} of ${total} done` : "Loading…"}</div>
      </div>
      {error ? <p style={{ color: "#ff9a90", fontSize: 13, margin: "0 0 8px" }}>{error}</p> : null}
      {done ? (
        <div style={{ display: "grid", gap: 12 }}>
          {stages.map((stage) => (
            <div key={stage.id}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(252,250,246,0.75)", marginBottom: 4 }}>{stage.name}</div>
              {stage.milestones.map((m) => {
                const isDone = done.has(m.id);
                return (
                  <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 13, color: isDone ? "rgba(252,250,246,0.5)" : "#fcfaf6", cursor: busy ? "wait" : "pointer" }}>
                    <input type="checkbox" checked={isDone} disabled={busy === m.id} onChange={(e) => void toggle(m.id, e.target.checked)} />
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(252,250,246,0.4)", minWidth: 56 }}>{m.id}</span>
                    <span style={{ textDecoration: isDone ? "line-through" : "none" }}>{m.title}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: m.awaitingTeam ? "#b9a3ff" : "rgba(252,250,246,0.45)", whiteSpace: "nowrap" }}>{m.awaitingTeam ? "Team" : "Client"}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
