"use client";

import { CSSProperties } from "react";

export type TaskDisplayStatus = "done" | "your-turn" | "with-us" | "up-next" | "locked";

const MAP: Record<TaskDisplayStatus, { label: string; fill: string; ink: string; dot: string }> = {
  done: { label: "Done", fill: "var(--pj-done-fill)", ink: "var(--pj-done)", dot: "✓" },
  "your-turn": { label: "Your turn", fill: "var(--pj-act-fill)", ink: "var(--pj-act)", dot: "●" },
  "with-us": { label: "With us", fill: "var(--pj-withus-fill)", ink: "var(--pj-withus)", dot: "●" },
  "up-next": { label: "Up next", fill: "var(--pj-upnext-fill)", ink: "var(--pj-upnext)", dot: "○" },
  locked: { label: "Locked", fill: "var(--pj-upnext-fill)", ink: "var(--pj-upnext)", dot: "🔒" },
};

export function StatusChip({ status, style }: { status: TaskDisplayStatus; style?: CSSProperties }) {
  const s = MAP[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-ibm-plex-mono), monospace",
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 700,
        borderRadius: "var(--pj-radius-pill)",
        padding: "4px 11px",
        whiteSpace: "nowrap",
        background: s.fill,
        color: s.ink,
        ...style,
      }}
    >
      <span aria-hidden style={{ fontSize: status === "locked" ? 9 : 10 }}>{s.dot}</span>
      {s.label}
    </span>
  );
}
