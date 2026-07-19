"use client";

import { JourneyStage } from "@/lib/onboardingJourney";

function dayLabel(start: number, end: number) {
  return start === end ? `Day ${start}` : `Days ${start}–${end}`;
}

function StageIcon({ status, index }: { status: JourneyStage["status"]; index: number }) {
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
  // Solid card-coloured fill so the dotted journey path doesn't run through the ring.
  return <span style={{ ...iconBase, border: "1.5px solid #c0b6a5", color: "var(--pj-upnext)", fontSize: 11, background: "#fbf6ee" }}>{index}</span>;
}

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
}: {
  stages: JourneyStage[];
  overallPercent: number;
  onSelectStage: (stageId: string) => void;
}) {
  return (
    <div
      style={{
        width: 292,
        flexShrink: 0,
        background: "var(--pj-card-grad)",
        border: "1px solid #efe5d4",
        borderRadius: 24,
        boxShadow: "var(--pj-shadow-card)",
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
          borderLeft: "2px dotted #cbbc9f",
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
            <StageIcon status={stage.status} index={i + 1} />
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
                <div style={{ marginTop: 8, height: 4, width: 150, borderRadius: 4, background: "#dcd3c4", overflow: "hidden" }}>
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
