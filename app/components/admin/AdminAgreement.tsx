"use client";

import { useEffect, useState } from "react";
import { teamFetch, timeAgo } from "@/app/components/admin/teamClient";

// The client's agreement acceptances on their board (AT Network first,
// 2026-10-21), with a link to each printable record. Nothing for products
// without an agreement.

type Row = { id: number; version: string; entity: string; signerName: string; signerEmail: string; ip: string; acceptedAt: string; recordUrl: string };
type View = { enabled: boolean; currentVersion?: string; acceptances: Row[] };

export function AdminAgreement({ clientId }: { clientId: string }) {
  const [view, setView] = useState<View | null>(null);
  useEffect(() => {
    void teamFetch<View>(`/api/admin/team/clients/${clientId}/agreement`).then(({ status, data }) => { if (status === 200 && data.ok) setView(data); });
  }, [clientId]);
  if (!view?.enabled) return null;
  const signed = view.acceptances.some((a) => a.version === view.currentVersion);

  return (
    <>
      <div className="tb-label" style={{ marginTop: 18 }}>Agreement</div>
      <div className="tb-faint" style={{ fontSize: 12, marginBottom: 6 }}>
        Current version {view.currentVersion}: {signed ? "accepted" : "not accepted yet"}. Email and PDF copies come later.
      </div>
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
