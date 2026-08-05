"use client";

import { useState } from "react";
import type { AskItem } from "@/lib/askAi";

/**
 * "Ask about your journey" — Imprint-style example-question chips with
 * scripted answers, shown in the chat-bubble shell a live assistant will
 * inherit later. The mini orb ties the answer to the same identity as the
 * stage narrator. Free-form input is deliberately absent (no backend yet);
 * the teaser line is honest about that.
 */
export function AskChips({ items, stageKey }: { items: AskItem[]; stageKey: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (items.length === 0) return null;
  const open = openIdx !== null ? items[openIdx] : null;

  return (
    <div key={stageKey} style={{ marginTop: 34 }}>
      <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)", marginBottom: 12 }}>
        Ask about your journey
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((item, i) => {
          const active = openIdx === i;
          return (
            <button
              key={item.q}
              type="button"
              onClick={() => setOpenIdx(active ? null : i)}
              aria-expanded={active}
              style={{
                border: `1px solid ${active ? "var(--pj-act)" : "var(--pj-line)"}`,
                background: active ? "var(--pj-act-fill)" : "var(--pj-card)",
                color: active ? "var(--pj-act)" : "var(--pj-muted)",
                fontWeight: 550,
                fontSize: 12.5,
                borderRadius: 999,
                padding: "8px 14px",
                cursor: "pointer",
                fontFamily: "var(--font-body), sans-serif",
                transition: "border-color 140ms ease, color 140ms ease, background 140ms ease",
              }}
            >
              {item.q}
            </button>
          );
        })}
      </div>
      {open ? (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 14, maxWidth: 620 }}>
          <span style={{ position: "relative", width: 26, height: 26, flexShrink: 0, display: "block", marginTop: 2 }} aria-hidden>
            <span className="pj-orb-ring" />
            <span className="pj-orb-core" style={{ inset: 4 }} />
          </span>
          <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-card-line)", borderRadius: "4px 16px 16px 16px", padding: "12px 16px" }}>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--pj-ink)" }}>{open.a}</p>
          </div>
        </div>
      ) : null}
      <p style={{ margin: "12px 0 0", fontSize: 11.5, color: "var(--pj-faint)" }}>
        Soon you&apos;ll be able to ask anything here — for now, tap a question, or reach the team any time.
      </p>
    </div>
  );
}
