"use client";

import { useCallback, useEffect, useState } from "react";
import type { AgreementContent } from "@/lib/journeyTypes";

/**
 * The agreement on its step (AT Network first, Jesse 2026-10-21): the portal is
 * the signature. The client reads the full text, ticks, types the entity, their
 * full name and email, and accepts. The server stores the exact text, version,
 * time and IP address; the client gets a printable copy. A newer version than
 * the one accepted asks for a new acceptance.
 */

type Acceptance = { id: number; version: string; entity: string; signerName: string; acceptedAt: string };

export function AgreementAccept({
  portalToken,
  agreement,
  onAccepted,
  endpoint,
  askPosition,
  fullText,
}: {
  portalToken?: string;
  agreement: AgreementContent;
  onAccepted?: (note: string) => void;
  /** The API to read and sign through. Default: the portal's. The signing page passes its own. */
  endpoint?: string;
  /** Also ask for the signer's position (the signing page). */
  askPosition?: boolean;
  /** Show the whole agreement on the page instead of a scroll box (the signing page). */
  fullText?: boolean;
}) {
  const [hash, setHash] = useState<string | null>(null);
  const [acceptances, setAcceptances] = useState<Acceptance[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [entity, setEntity] = useState(agreement.entity ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = endpoint ?? `/api/portal/${portalToken}/agreement`;
  const [position, setPosition] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(base);
      const data = (await res.json()) as { ok: boolean; hash: string; version: string; acceptances: Acceptance[] };
      if (data.ok) { setHash(data.hash); setAcceptances(data.acceptances); }
    } catch {}
  }, [base]);
  useEffect(() => { void load(); }, [load]);

  const current = [...acceptances].reverse().find((a) => a.version === agreement.version);
  const ready = agreed && entity.trim() && name.trim().split(/\s+/).length >= 2 && /\S+@\S+\.\S+/.test(email.trim()) && hash && (!askPosition || position.trim());

  async function accept() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: agreement.version, hash, entity, signerName: name, signerEmail: email, agreed, ...(askPosition ? { position } : {}) }),
      });
      const data = (await res.json()) as { ok: boolean; note?: string; error?: string };
      if (!data.ok) { setError(data.error ?? "Couldn't record that. Try again."); return; }
      await load();
      onAccepted?.(data.note ?? "");
    } catch {
      setError("Connection hiccup. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const field = { width: "100%", marginTop: 6, padding: "11px 13px", borderRadius: "var(--pj-radius-sm)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", color: "var(--pj-ink)", fontFamily: "var(--font-body), system-ui, sans-serif", fontSize: 14, outline: "none" } as const;
  const label = { display: "block", marginTop: 14, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)" } as const;

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ maxHeight: fullText ? undefined : 420, overflowY: fullText ? undefined : "auto", borderRadius: "var(--pj-radius-sm)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", padding: "18px 20px" }} tabIndex={0} aria-label="The agreement">
        <div style={{ fontWeight: 700, fontSize: 16 }}>{agreement.title}</div>
        <div style={{ fontSize: 12, color: "var(--pj-faint)", marginTop: 2 }}>Version {agreement.version}</div>
        {agreement.sections.map((s) => (
          <div key={s.heading} style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 650, fontSize: 14 }}>{s.heading}</div>
            {s.paragraphs.map((p, i) => <p key={i} style={{ fontSize: 14, lineHeight: 1.6, margin: "6px 0 0", color: "var(--pj-ink)" }}>{p}</p>)}
          </div>
        ))}
      </div>

      {acceptances.length > 0 && (
        <div style={{ marginTop: 14, fontSize: 13, color: "var(--pj-muted)" }}>
          {acceptances.map((a) => (
            <div key={a.id} style={{ marginTop: 4 }}>
              <span style={{ color: "var(--pj-act)", fontWeight: 600 }}>Accepted</span> version {a.version} for {a.entity} by {a.signerName}, {new Date(a.acceptedAt).toLocaleString()}.{" "}
              <a href={`${base}/${a.id}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--pj-act)" }}>View or print your copy</a>
            </div>
          ))}
        </div>
      )}

      {!current && (
        <div style={{ marginTop: 6 }}>
          {acceptances.length > 0 && <div style={{ marginTop: 12, fontSize: 13.5, fontWeight: 600 }}>The agreement has a new version. Please read it and accept it again.</div>}
          {!agreement.entity && (
            <>
              <label style={label} htmlFor="agr-entity">Company or entity you accept for</label>
              <input id="agr-entity" style={field} value={entity} maxLength={200} onChange={(e) => setEntity(e.target.value)} placeholder="Legal name of your business" />
            </>
          )}
          <label style={label} htmlFor="agr-name">Your full name</label>
          <input id="agr-name" style={field} value={name} maxLength={200} autoComplete="name" onChange={(e) => setName(e.target.value)} placeholder="First and last name" />
          {askPosition && (
            <>
              <label style={label} htmlFor="agr-position">Your position</label>
              <input id="agr-position" style={field} value={position} maxLength={200} autoComplete="organization-title" onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Director" />
            </>
          )}
          <label style={label} htmlFor="agr-email">Your email</label>
          <input id="agr-email" type="email" style={field} value={email} maxLength={200} autoComplete="email" onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 16, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 3, width: 17, height: 17 }} />
            <span>I have read and accept the agreement on behalf of {entity.trim() || "[company or entity]"}.</span>
          </label>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--pj-faint)" }}>
            Typing your name and accepting is your signature. We record your name, {askPosition ? "position, " : ""}email, the date and time, the agreement version and your IP address. You can view and print your copy straight after.
          </div>
          {error && <div style={{ marginTop: 10, fontSize: 13, color: "#c0392b" }}>{error}</div>}
          <button
            type="button"
            disabled={!ready || busy}
            onClick={() => void accept()}
            style={{ marginTop: 18, background: ready ? "var(--pj-btn-grad)" : "var(--pj-act-fill)", color: ready ? "var(--pj-act-ink)" : "var(--pj-act)", fontFamily: "var(--font-body), sans-serif", fontWeight: 650, fontSize: 15, border: "none", borderRadius: "var(--pj-radius-pill)", padding: "12px 24px", cursor: ready ? "pointer" : "default", boxShadow: ready ? "var(--pj-shadow-btn)" : "none" }}
          >
            {busy ? "Recording…" : "Accept and sign"} <span style={{ fontSize: 17 }}>→</span>
          </button>
        </div>
      )}
    </div>
  );
}
