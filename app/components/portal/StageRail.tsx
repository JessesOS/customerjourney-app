"use client";

import { JourneyStage } from "@/lib/onboardingJourney";

function dayLabel(start: number, end: number) {
  return start === end ? `Day ${start}` : `Days ${start}–${end}`;
}

function StageIcon({ status, index, ringFill }: { status: JourneyStage["status"]; index: number; ringFill: string }) {
  if (status === "done") {
    return (
      <span style={{ ...iconBase, background: "var(--pj-done)", color: "#fff" }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4 10-12" />
        </svg>
      </span>
    );
  }
  if (status === "current") {
    return <span style={{ ...iconBase, border: "2px solid var(--pj-act)", color: "var(--pj-act)", fontWeight: 700, fontSize: 10, background: "var(--pj-act-fill)" }}>{index}</span>;
  }
  // Solid surface-coloured fill so the dotted journey path doesn't run through the ring.
  return <span style={{ ...iconBase, border: "1.5px solid var(--pj-ring)", color: "var(--pj-upnext)", fontSize: 11, background: ringFill }}>{index}</span>;
}

/** Review variants for the journey card treatment — switchable from the
 *  demo-page toggle. "deepframe" also darkens the surrounding frame
 *  (applied by ClientPortalExperience). */
export type RailVariant = "deepframe" | "card3d" | "flat" | "baseline";

const CARD_STYLES: Record<RailVariant, React.CSSProperties> = {
  // Standard card; the FRAME darkens around it (see ClientPortalExperience).
  deepframe: {
    background: "linear-gradient(180deg, #fffdf8 0%, #fbf5ea 100%)",
    border: "1px solid #e7dac4",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 26px 48px -22px rgba(126,94,60,0.45), 0 3px 10px rgba(126,94,60,0.08)",
  },
  // Shipped baseline: same card on the pale frame.
  baseline: {
    background: "linear-gradient(180deg, #fffdf8 0%, #fbf5ea 100%)",
    border: "1px solid #e7dac4",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 26px 48px -22px rgba(126,94,60,0.45), 0 3px 10px rgba(126,94,60,0.08)",
  },
  // Heavy float: visible tan border + deep hover shadow.
  card3d: {
    background: "linear-gradient(180deg, #fffdf8 0%, #fbf5ea 100%)",
    border: "1px solid #d9c7a8",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 34px 64px -24px rgba(126,94,60,0.55), 0 5px 16px rgba(126,94,60,0.13)",
  },
  // Flat tonal zone: deeper sand, no lift at all.
  flat: {
    background: "#f2e8d8",
    border: "1px solid #e6d9c1",
    boxShadow: "none",
  },
};

const RING_FILL: Record<RailVariant, string> = {
  deepframe: "#fdf9f1",
  baseline: "#fdf9f1",
  card3d: "#fdf9f1",
  flat: "#f2e8d8",
};

const iconBase: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  marginTop: 1,
};

export function StageRail({
  stages,
  overallPercent,
  onSelectStage,
  variant = "deepframe",
  cool = false,
}: {
  stages: JourneyStage[];
  overallPercent: number;
  onSelectStage: (stageId: string) => void;
  variant?: RailVariant;
  /** Cool theme uses one var-driven card treatment; the A/B/C/D review
   *  variants above are warm-look exploration only. */
  cool?: boolean;
}) {
  const cardStyle: React.CSSProperties = cool
    ? {
        background: "var(--pj-rail-card-grad)",
        border: "1px solid var(--pj-rail-card-line)",
        boxShadow: "var(--pj-rail-card-shadow)",
      }
    : CARD_STYLES[variant];
  const ringFill = cool ? "var(--pj-rail-ring-fill)" : RING_FILL[variant];
  return (
    <div
      style={{
        width: 292,
        flexShrink: 0,
        ...cardStyle,
        borderRadius: 24,
        padding: "24px 18px",
        position: "relative",
        alignSelf: "flex-start",
        margin: "24px 0 32px 24px",
      }}
    >
      {/* Dotted journey path connecting the stage markers (reference: the
          winding Customer Journey map). Sits behind the stage buttons; the
          markers carry solid fills so the path never crosses a ring. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 40,
          top: 72,
          bottom: 100,
          width: 0,
          borderLeft: "2px dotted var(--pj-path)",
        }}
      />
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fontWeight: 650,
          color: "var(--pj-act)",
          margin: "2px 10px 14px",
        }}
      >
        Your journey
      </div>

      {stages.map((stage, i) => {
        const done = stage.milestones.filter((m) => m.status === "done").length;
        const total = stage.milestones.length;
        const isActive = stage.status === "current";
        const isLocked = stage.status === "locked";
        const pct = total ? Math.round((done / total) * 100) : 0;
        const sub =
          stage.status === "done"
            ? `All ${total} tasks done · ${dayLabel(stage.dayStart, stage.dayEnd)}`
            : isActive
              ? `${done} of ${total} tasks done · ${dayLabel(stage.dayStart, stage.dayEnd)}`
              : `${dayLabel(stage.dayStart, stage.dayEnd)}`;
        return (
          <button
            type="button"
            key={stage.id}
            onClick={() => onSelectStage(stage.id)}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              padding: "13px 12px",
              marginTop: i === 0 ? 0 : 2,
              borderRadius: "var(--pj-radius-sm)",
              position: "relative",
              border: "none",
              background: isActive ? "var(--pj-act-fill)" : "transparent",
              fontFamily: "var(--font-body), sans-serif",
            }}
          >
            {isActive ? (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  top: 11,
                  bottom: 11,
                  width: 3,
                  borderRadius: 3,
                  background: "var(--pj-act)",
                }}
              />
            ) : null}
            <StageIcon status={stage.status} index={i + 1} ringFill={ringFill} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: isLocked ? 500 : 650,
                  fontSize: 14,
                  letterSpacing: "-0.01em",
                  color: isLocked ? "var(--pj-upnext)" : "var(--pj-ink)",
                }}
              >
                {stage.name}
              </div>
              <div style={{ fontSize: 12, color: isLocked ? "var(--pj-faint)" : "var(--pj-muted)", marginTop: 2 }}>{sub}</div>
              {isActive ? (
                <div style={{ marginTop: 8, height: 4, width: 150, borderRadius: 4, background: "var(--pj-line)", overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", width: `${pct}%`, background: "var(--pj-act)", borderRadius: 4 }} />
                </div>
              ) : null}
            </div>
          </button>
        );
      })}

      <div
        style={{
          margin: "22px 10px 0",
          paddingTop: 18,
          borderTop: "1px solid var(--pj-line)",
          fontSize: 12,
          color: "var(--pj-muted)",
        }}
      >
        Overall: <b style={{ color: "var(--pj-ink)" }}>{overallPercent}%</b> of the journey complete
      </div>
    </div>
  );
}
