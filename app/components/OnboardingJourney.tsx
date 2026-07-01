"use client";

import { useState } from "react";
import {
  journeyCurrentDay,
  journeyProgressPercent,
  journeyStages,
  journeyTotalDays,
  type JourneyStage,
  type MilestoneStatus,
} from "@/lib/onboardingJourney";

const teal = "#00b8a0";
const gold = "#f5a623";
const grey = "#9ca3af";

function MilestoneRow({ title, detail, status }: { title: string; detail: string; status: MilestoneStatus }) {
  const dotColor = status === "done" ? teal : status === "current" ? gold : "#e5e7eb";
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: status === "upcoming" ? "#fff" : dotColor,
          border: `2px solid ${dotColor}`,
          flexShrink: 0,
          marginTop: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "#fff",
          fontWeight: 700,
        }}
      >
        {status === "done" ? "✓" : ""}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: status === "upcoming" ? "#9ca3af" : "#111827" }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{detail}</div>
      </div>
    </div>
  );
}

function StageCard({ stage, expanded, onToggle }: { stage: JourneyStage; expanded: boolean; onToggle: () => void }) {
  const isDone = stage.status === "done";
  const isCurrent = stage.status === "current";
  const isLocked = stage.status === "locked";

  const accent = isDone ? teal : isCurrent ? gold : grey;
  const dayLabel =
    stage.dayStart === stage.dayEnd ? `Day ${stage.dayStart}` : `Days ${stage.dayStart}-${stage.dayEnd}`;

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${isCurrent ? gold : "#e5e7eb"}`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: 10,
        marginBottom: 12,
        opacity: isLocked ? 0.6 : 1,
        boxShadow: isCurrent ? "0 4px 14px rgba(245,166,35,0.15)" : "none",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "transparent",
          border: "none",
          cursor: isLocked ? "default" : "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isLocked && <span style={{ fontSize: 14 }}>🔒</span>}
          {isDone && <span style={{ fontSize: 14, color: teal }}>✓</span>}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: isLocked ? "#9ca3af" : "#111827" }}>
              {stage.name}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>{dayLabel}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isCurrent && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#92400e",
                background: "#fffbf0",
                border: `1px solid ${gold}`,
                borderRadius: 99,
                padding: "2px 10px",
              }}
            >
              IN PROGRESS
            </span>
          )}
          {!isLocked && <span style={{ color: "#9ca3af", fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>}
        </div>
      </button>

      {expanded && !isLocked && (
        <div style={{ padding: "0 20px 20px" }}>
          {stage.milestones.map((m) => (
            <MilestoneRow key={m.id} title={m.title} detail={m.detail} status={m.status} />
          ))}
          {stage.statusNotes.length > 0 && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "#f9fafb", borderRadius: 6 }}>
              {stage.statusNotes.map((note) => (
                <div key={note} style={{ fontSize: 12, color: "#6b7280", display: "flex", gap: 6, marginBottom: 2 }}>
                  <span style={{ color: teal }}>●</span> {note}
                </div>
              ))}
            </div>
          )}
          {isCurrent && (
            <button
              style={{
                marginTop: 16,
                padding: "10px 20px",
                background: gold,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Continue →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function OnboardingJourney() {
  const [expandedId, setExpandedId] = useState<string>(
    journeyStages.find((s) => s.status === "current")?.id ?? journeyStages[0].id,
  );

  const progress = journeyProgressPercent();

  return (
    <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Progress header */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "24px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
            Day {journeyCurrentDay} of {journeyTotalDays}
          </div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>{progress}% through onboarding</div>
        </div>
        <div style={{ height: 8, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${teal}, ${gold})`,
              borderRadius: 99,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Stage list */}
      {journeyStages.map((stage) => (
        <StageCard
          key={stage.id}
          stage={stage}
          expanded={expandedId === stage.id}
          onToggle={() => {
            if (stage.status === "locked") return;
            setExpandedId(expandedId === stage.id ? "" : stage.id);
          }}
        />
      ))}
    </div>
  );
}
