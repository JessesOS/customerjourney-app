"use client";

import { useCallback, useEffect, useState } from "react";
import { teamFetch, timeAgo } from "@/app/components/admin/teamClient";

// The client's agreement acceptances on their board (AT Network first,
// 2026-10-21), with a link to each printable record. Nothing for products
// without an agreement.

type Row = { id: number; version: string; entity: string; signerName: string; signerEmail: string; ip: string; acceptedAt: string; recordUrl: string };
type View = { enabled: boolean; currentVersion?: string; acceptances: Row[] };

export function AdminAgreement({ clientId }: { clientId: string }) {
  const [view, setView] = useState<View | null>(null);
  const [form, setForm] = useState<{ entity: string; signerName: string; signerEmail: string; acceptedAt: string; source: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = `/api/admin/team/clients/${clientId}/agreement`;
  const load = useCallback(async () => {
    const { status, data } = await teamFetch<View>(url);
    if (status === 200 && data.ok) setView(data);
  }, [url]);
  useEffect(() => { void load(); }, [load]);
  if (!view?.enabled) return null;
  const signed = view.acceptances.some((a) => a.version === view.currentVersion);

  // The client signed before getting their link: record it here, and the step arrives done.
  async function record() {
    if (!form) return;
    setError(null);
    const { data } = await teamFetch(url, { method: "POST", json: form });
    if (!data.ok) { setError(data.error ?? "Could not record it."); return; }
    setForm(null);
    await load();
  }

  return (
    <>
      <div className="tb-label" style={{ marginTop: 18 }}>Agreement</div>
      <div className="tb-faint" style={{ fontSize: 12, marginBottom: 6 }}>
        Current version {view.currentVersion}: {signed ? "accepted" : "not accepted yet"}. Email and PDF copies come later.
      </div>
      {!signed && !form ? (
        <button type="button" className="tb-btn" style={{ marginBottom: 8 }} onClick={() => setForm({ entity: "", signerName: "", signerEmail: "", acceptedAt: new Date().toISOString().slice(0, 16), source: "Signed agreement page" })}>
          Record a signed acceptance
        </button>
      ) : null}
      {form ? (
        <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
          <input placeholder="Entity (legal name)" value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })} />
          <input placeholder="Signer's full name" value={form.signerName} onChange={(e) => setForm({ ...form, signerName: e.target.value })} />
          <input placeholder="Signer's email" type="email" value={form.signerEmail} onChange={(e) => setForm({ ...form, signerEmail: e.target.value })} />
          <input type="datetime-local" value={form.acceptedAt} onChange={(e) => setForm({ ...form, acceptedAt: e.target.value })} aria-label="When they accepted" />
          <input placeholder="Where they signed (e.g. the agreement page)" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="tb-btn" onClick={() => void record()}>Record and tick the step</button>
            <button type="button" className="tb-btn" onClick={() => setForm(null)}>Cancel</button>
          </div>
          {error ? <div className="tb-faint" style={{ color: "#c0392b", fontSize: 12 }}>{error}</div> : null}
        </div>
      ) : null}
      {view.acceptances.map((a) => (
        <div key={a.id} className="tb-feed-item">
          <strong style={{ fontWeight: 600 }}>{a.signerName}</strong> <span className="tb-muted">for {a.entity}, version {a.version}</span>
          <div className="tb-faint" style={{ fontSize: 11.5 }}>{a.signerEmail} · IP {a.ip || "n/a"} · {timeAgo(a.acceptedAt)}</div>
          <a href={a.recordUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5 }}>Open the record</a>
        </div>
      ))}
    </>
  );
}
