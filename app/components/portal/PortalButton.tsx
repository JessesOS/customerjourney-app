"use client";

import { CSSProperties, ReactNode, useState } from "react";

type Variant = "primary" | "outline" | "ghost";

const gold = "#f5a623";
const text = "#eef1f6";

const base: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 9,
  cursor: "pointer",
  fontFamily: "var(--font-space-grotesk), sans-serif",
  transition:
    "background 140ms ease, border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease",
};

const variants: Record<Variant, { rest: CSSProperties; hover: CSSProperties }> = {
  // Filled gold — the single primary action on a view (e.g. "Continue Stage")
  primary: {
    rest: {
      background: gold,
      color: "#1c1300",
      fontWeight: 600,
      fontSize: 15,
      border: "none",
      borderRadius: 12,
      padding: "13px 24px",
    },
    hover: {
      boxShadow: "0 8px 24px rgba(245,166,35,0.28)",
      transform: "translateY(-1px)",
    },
  },
  // Neutral pill — supporting actions (e.g. "Watch the walkthrough")
  ghost: {
    rest: {
      background: "rgba(255,255,255,0.04)",
      color: text,
      fontWeight: 500,
      fontSize: 14,
      border: "1px solid rgba(255,255,255,0.14)",
      borderRadius: 99,
      padding: "8px 18px",
    },
    hover: {
      background: "rgba(255,255,255,0.08)",
      borderColor: "rgba(255,255,255,0.24)",
    },
  },
  // Gold-outlined pill — low-emphasis / opt-in actions (e.g. "Skip ahead")
  outline: {
    rest: {
      background: "transparent",
      color: gold,
      fontFamily: "var(--font-ibm-plex-mono), monospace",
      fontSize: 12,
      border: "1px solid rgba(245,166,35,0.4)",
      borderRadius: 99,
      padding: "8px 14px",
    },
    hover: {
      background: "rgba(245,166,35,0.1)",
      borderColor: "rgba(245,166,35,0.7)",
    },
  },
};

export function PortalButton({
  variant = "primary",
  onClick,
  children,
  style,
  title,
}: {
  variant?: Variant;
  onClick?: () => void;
  children: ReactNode;
  style?: CSSProperties;
  title?: string;
}) {
  const [hover, setHover] = useState(false);
  const v = variants[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...v.rest, ...(hover ? v.hover : null), ...style }}
    >
      {children}
    </button>
  );
}
