"use client";

import { StatusChip } from "@/app/components/portal/StatusChip";

/**
 * The single hero card at the top of the content pane. When there is an
 * actionable ("your turn") task it presents it with the one primary button on
 * the screen. When the client is waiting on the team, it says so calmly.
 */
export function UpNextCard({
  title,
  desc,
  actionable,
  onStart,
}: {
  title: string;
  desc: string;
  actionable: boolean;
  onStart?: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--pj-card-grad)",
        border: "1px solid #efe5d4",
        borderRadius: 24,
        padding: "24px 26px",
        boxShadow: "var(--pj-shadow-card)",
        marginBottom: 30,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fontWeight: 650,
          color: "var(--pj-faint)",
          marginBottom: 10,
        }}
      >
        {actionable ? "Up next for you" : "In progress"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <StatusChip status={actionable ? "your-turn" : "with-us"} />
          <div style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-0.01em", marginTop: 8 }}>{title}</div>
          <div style={{ fontSize: 13.5, color: "var(--pj-muted)", marginTop: 3, maxWidth: "52ch" }}>{desc}</div>
        </div>
        {actionable ? (
          <button
            type="button"
            onClick={onStart}
            style={{
              marginLeft: "auto",
              background: "var(--pj-btn-grad)",
              color: "var(--pj-act-ink)",
              fontWeight: 650,
              fontSize: 14,
              border: "none",
              borderRadius: "var(--pj-radius-pill)",
              padding: "12px 24px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: "var(--pj-shadow-btn)",
              fontFamily: "var(--font-body), sans-serif",
            }}
          >
            Start this task →
          </button>
        ) : null}
      </div>
    </div>
  );
}
