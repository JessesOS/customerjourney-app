"use client";

import { StatusChip, TaskDisplayStatus } from "@/app/components/portal/StatusChip";

function StatusDot({ status }: { status: TaskDisplayStatus }) {
  if (status === "done") {
    return (
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "var(--pj-done)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4 10-12" />
        </svg>
      </span>
    );
  }
  const ring =
    status === "your-turn" ? "var(--pj-act)" : status === "with-us" ? "var(--pj-withus)" : "#dbd2c2";
  const width = status === "up-next" || status === "locked" ? 1.5 : 2;
  return (
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: `${width}px solid ${ring}`,
        flexShrink: 0,
      }}
    />
  );
}

export function TaskRow({
  title,
  subtitle,
  status,
  onStart,
  onView,
}: {
  title: string;
  subtitle?: string;
  status: TaskDisplayStatus;
  onStart?: () => void;
  onView?: () => void;
}) {
  const isDone = status === "done";
  const isTurn = status === "your-turn";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 20px",
        background: isTurn ? "#fbf3ec" : "transparent",
      }}
    >
      <StatusDot status={status} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: isDone ? 450 : 550,
            color: isDone ? "var(--pj-faint)" : "var(--pj-ink)",
            textDecoration: isDone ? "line-through" : "none",
            textDecorationColor: "#d8cdbc",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 12, color: "var(--pj-muted)", marginTop: 1 }}>{subtitle}</div>
        ) : null}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        {isDone ? (
          onView ? (
            <button
              type="button"
              onClick={onView}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 12.5,
                fontWeight: 550,
                color: "var(--pj-faint)",
                fontFamily: "var(--font-space-grotesk), sans-serif",
                padding: 0,
              }}
            >
              View
            </button>
          ) : null
        ) : isTurn ? (
          <>
            <StatusChip status="your-turn" />
            <button
              type="button"
              onClick={onStart}
              style={{
                background: "var(--pj-act)",
                color: "var(--pj-act-ink)",
                fontWeight: 650,
                fontSize: 12.5,
                border: "none",
                borderRadius: "var(--pj-radius-pill)",
                padding: "7px 16px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-space-grotesk), sans-serif",
              }}
            >
              Start
            </button>
          </>
        ) : (
          <StatusChip status={status} />
        )}
      </div>
    </div>
  );
}
