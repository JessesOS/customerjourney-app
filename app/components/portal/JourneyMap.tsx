"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { JourneyMapContent, JourneyMapJourney, JourneyMapStep } from "@/lib/journeyTypes";
import { MicButton } from "./MicButton";

/**
 * The customer journey map on an approval step (Jesse, 2026-10-18; BSS custom
 * first). An overview of how the journeys connect, then each journey as a
 * flow: where people come in, each step (with its messages, a small timeline,
 * branches, and anything still to confirm), and where it ends. A notes box per
 * journey, plus "Also running" and "Anything else", save as the client types
 * (a hidden form, content.notesFormId). The compiled notes go up through
 * onNotesChange, so approving the step carries them to the team board.
 */

const OWN_NOTES = [
  { id: "also_running", label: "Also running" },
  { id: "anything_else", label: "Anything else" },
];
const WHO: Record<NonNullable<JourneyMapStep["who"]>, string> = { you: "You", them: "Your lead", us: "Us" };
const CHANNEL: Record<string, string> = { email: "Email", text: "Text", alert: "Alert", page: "Page" };

export function JourneyMap({
  content,
  portalToken,
  readOnly = false,
  onNotesChange,
}: {
  content: JourneyMapContent;
  portalToken?: string;
  readOnly?: boolean;
  onNotesChange?: (compiled: string) => void;
}) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<{ field: string; status: "saving" | "saved" | "error" } | null>(null);
  const loaded = useRef(false);
  const timer = useRef<number | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const formUrl = portalToken ? `/api/portal/${portalToken}/form/${content.notesFormId}` : null;

  const labels = useMemo(
    () => [...content.journeys.map((j) => ({ id: j.id, label: j.title })), ...OWN_NOTES],
    [content.journeys],
  );
  const compile = (n: Record<string, string>) =>
    labels.filter((l) => n[l.id]?.trim()).map((l) => `${l.label}: ${n[l.id].trim()}`).join("\n\n");

  // Load what they've written before.
  useEffect(() => {
    if (!formUrl) { loaded.current = true; return; }
    fetch(formUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { responses?: Record<string, unknown> } | null) => {
        const saved: Record<string, string> = {};
        for (const [k, v] of Object.entries(d?.responses ?? {})) if (typeof v === "string") saved[k] = v;
        setNotes(saved);
        onNotesChange?.(compile(saved));
      })
      .catch(() => {})
      .finally(() => { loaded.current = true; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formUrl]);

  // Steps glide in as they scroll into view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Hidden only once this runs, so the map is never blank without it.
    root.classList.add("is-animated");
    const items = root.querySelectorAll(".jm-reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  function update(id: string, text: string) {
    const next = { ...notes, [id]: text };
    setNotes(next);
    onNotesChange?.(compile(next));
    if (!formUrl || !loaded.current) return;
    if (timer.current) window.clearTimeout(timer.current);
    setSaveState({ field: id, status: "saving" });
    timer.current = window.setTimeout(() => {
      fetch(formUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ responses: next }) })
        .then((r) => setSaveState({ field: id, status: r.ok ? "saved" : "error" }))
        .catch(() => setSaveState({ field: id, status: "error" }));
    }, 800);
  }

  const byId = Object.fromEntries(content.journeys.map((j, i) => [j.id, { j, n: i + 1 }]));
  const jump = (id: string) => document.getElementById(`jm-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const notesBox = (id: string, prompt: string) =>
    readOnly ? (
      notes[id]?.trim() ? (
        <div className="jm-notes is-read"><div className="jm-label">Your note</div><p>{notes[id]}</p></div>
      ) : null
    ) : (
      <div className="jm-notes">
        <label className="jm-label" htmlFor={`jm-note-${id}`}>{prompt}</label>
        <textarea
          id={`jm-note-${id}`}
          className="jm-textarea"
          rows={3}
          value={notes[id] ?? ""}
          placeholder="Optional. Leave it blank if it looks right."
          onChange={(e) => update(id, e.target.value)}
        />
        <div className="jm-notes-foot">
          <MicButton onText={(chunk) => update(id, `${notes[id] ?? ""} ${chunk}`.trim())} />
          <span className="jm-saved" aria-live="polite">
            {saveState?.field !== id ? "" : saveState.status === "saving" ? "Saving…" : saveState.status === "saved" ? "Saved" : "Couldn't save. Try again."}
          </span>
        </div>
      </div>
    );

  // The order the journeys connect in: webinar feeds the call, the call feeds onboarding.
  const call = byId.book_a_call;
  const webinar = byId.webinar;
  const clients = byId.new_clients;

  return (
    <section ref={rootRef} className="jm" aria-label={content.title}>
      {content.draftNote ? <div className="jm-draft">{content.draftNote}</div> : null}
      <h4 className="jm-title">{content.title}</h4>
      <p className="jm-intro">{content.intro}</p>

      {call && webinar && clients ? (
        <div className="jm-overview" role="group" aria-label="How the three journeys connect">
          <div className="jm-ov-in">
            <span className="jm-ov-kicker">Leads come in</span>
            <span className="jm-ov-sub">Website, socials, partners</span>
          </div>
          <span className="jm-ov-arrow" aria-hidden><i /></span>
          <div className="jm-ov-core">
            <button type="button" className="jm-ov-node is-purple is-main" onClick={() => jump(call.j.id)}>
              <span className="jm-ov-num">{call.n}</span>{call.j.title}
            </button>
            <span className="jm-ov-arrow is-down is-up" aria-hidden><i /></span>
            <button type="button" className="jm-ov-node is-orange" onClick={() => jump(webinar.j.id)}>
              <span className="jm-ov-num">{webinar.n}</span>{webinar.j.title}
            </button>
          </div>
          <span className="jm-ov-arrow" aria-hidden><i /></span>
          <button type="button" className="jm-ov-node is-teal" onClick={() => jump(clients.j.id)}>
            <span className="jm-ov-num">{clients.n}</span>{clients.j.title}
          </button>
        </div>
      ) : null}

      {content.journeys.map((j, i) => (
        <Journey key={j.id} journey={j} n={i + 1} whoLabels={content.whoLabels} notes={notesBox(j.id, "Anything to change in this journey?")} />
      ))}

      <div className="jm-block jm-reveal">
        <div className="jm-block-title">Also running in the background</div>
        <div className="jm-grid">
          {content.alsoRunning.map((a) => (
            <div key={a.title} className="jm-mini">
              <strong>{a.title}</strong>
              <span>{a.detail}</span>
            </div>
          ))}
        </div>
        {notesBox("also_running", "Anything to change here?")}
      </div>

      <div className="jm-block jm-reveal">
        <div className="jm-block-title">Rules every message follows</div>
        <ul className="jm-rules">
          {content.rules.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </div>

      <div className="jm-block jm-confirm jm-reveal">
        <div className="jm-block-title">Still to confirm</div>
        <p className="jm-muted">These don&apos;t stop you approving the map. We fill them in as your answers come through.</p>
        <ul className="jm-confirm-list">
          {content.toConfirm.map((c) => (
            <li key={c.question}><span>{c.question}</span><em>{c.where}</em></li>
          ))}
        </ul>
      </div>

      <div className="jm-block jm-reveal">{notesBox("anything_else", "Anything else you'd like to change?")}</div>
    </section>
  );
}

function Journey({ journey, n, notes, whoLabels }: { journey: JourneyMapJourney; n: number; notes: ReactNode; whoLabels?: Partial<Record<NonNullable<JourneyMapStep["who"]>, string>> }) {
  // A collapsed journey (AT Network's Phase 2 list, 2026-10-25) shows its header and one
  // button; the rest appears on tap. Journeys without the flag render exactly as before.
  const [open, setOpen] = useState(!journey.collapsed);
  return (
    <section
      id={`jm-${journey.id}`}
      className={`jm-journey is-${journey.accent}`}
      // A folded parking-lot journey (AT Network's Phase 2) sits in its own tinted block, so it reads as separate and not part of the plan above.
      style={journey.collapsed ? { background: "var(--pj-well, rgba(0,0,0,0.045))", border: "1px solid var(--pj-line)", borderRadius: 18, padding: "22px 24px", marginTop: 34 } : undefined}
    >
      <header className="jm-j-head jm-reveal">
        <span className="jm-j-num">{n}</span>
        <div>
          <div className="jm-j-title">{journey.title}</div>
          <div className="jm-j-tag">{journey.tagline}</div>
        </div>
      </header>
      {journey.collapsed && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          style={{ marginTop: 12, padding: "9px 16px", borderRadius: 999, border: "1px solid var(--pj-line)", background: "var(--pj-card)", color: "var(--pj-act)", font: "600 13px var(--font-body), sans-serif", cursor: "pointer" }}
        >
          Show the list ({journey.steps.length}) ↓
        </button>
      ) : null}
      {journey.collapsed && open ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-expanded={true}
          style={{ marginTop: 12, padding: "9px 16px", borderRadius: 999, border: "1px solid var(--pj-line)", background: "var(--pj-card)", color: "var(--pj-muted)", font: "600 13px var(--font-body), sans-serif", cursor: "pointer" }}
        >
          Hide the list ↑
        </button>
      ) : null}
      <div style={journey.collapsed && !open ? { display: "none" } : undefined}>
      <div className="jm-entries jm-reveal">
        <span className="jm-label">Where they come from</span>
        <div className="jm-chips">{journey.entries.map((e) => <span key={e} className="jm-chip">{e}</span>)}</div>
      </div>
      <ol className="jm-flow">
        {journey.steps.map((s, k) => (
          <li key={s.title} className="jm-step jm-reveal">
            <span className="jm-dot" aria-hidden>{k + 1}</span>
            <div className="jm-step-body">
              <div className="jm-step-title">
                {s.title}
                {s.who ? <span className="jm-who">{whoLabels?.[s.who] ?? WHO[s.who]}</span> : null}
              </div>
              <p className="jm-step-detail">{s.detail}</p>
              {s.messages?.length ? (
                <ul className="jm-messages">
                  {s.messages.map((m) => (
                    <li key={m.label}><span className={`jm-channel is-${m.channel}`}>{CHANNEL[m.channel]}</span>{m.label}</li>
                  ))}
                </ul>
              ) : null}
              {s.timeline ? <Timeline label={s.timeline.label} points={s.timeline.points} /> : null}
              {s.branches?.length ? (
                <div className="jm-branches">
                  {s.branches.map((b) => (
                    <div key={b.label} className={`jm-branch is-${b.tone ?? "neutral"}`}>
                      <strong>{b.label}</strong>
                      <span>{b.detail}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {s.pills ? (
                <div className="jm-entries">
                  <span className="jm-label">{s.pills.label}</span>
                  {(s.pills.groups ?? [{ label: "", items: s.pills.items ?? [] }]).map((g) => (
                    <div key={g.label || "all"} style={{ marginTop: 10 }}>
                      {g.label ? <div style={{ fontSize: 12.5, fontWeight: 650, color: "var(--pj-muted)" }}>{g.label}</div> : null}
                      <div className="jm-chips">{g.items.map((p) => <span key={p} className="jm-chip">{p}</span>)}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {s.pending ? (
                <div className="jm-pending">
                  <span className="jm-pending-tag">{s.pending.label ?? "To confirm"}</span>
                  <span>{s.pending.question}</span>
                  <em>{s.pending.whereLabel ?? "Answered in"}: {s.pending.where}</em>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <div className="jm-outcome jm-reveal"><span aria-hidden>✓</span>{journey.outcome}</div>
      {notes}
      </div>
    </section>
  );
}

function Timeline({ label, points }: { label: string; points: { at: string; label: string }[] }) {
  return (
    <div className="jm-timeline" role="group" aria-label={label}>
      <div className="jm-tl-label">{label}</div>
      <ol className="jm-tl" style={{ ["--jm-n" as string]: points.length }}>
        <span className="jm-tl-runner" aria-hidden />
        {points.map((p, i) => (
          <li key={`${p.at}-${p.label}`} className="jm-tl-point" style={{ ["--jm-i" as string]: i }}>
            <span className="jm-tl-dot" aria-hidden />
            <span className="jm-tl-at">{p.at}</span>
            <span className="jm-tl-what">{p.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
