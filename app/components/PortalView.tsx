"use client";

import type { BridgeClient, LiveBridgePayload, PipelineStage, StatusCard } from "@/lib/liveScaleBridge";
import { OnboardingJourney } from "@/app/components/OnboardingJourney";

const toneColor: Record<string, string> = {
  teal: "#00b8a0",
  gold: "#f5a623",
  red: "#e53935",
  neutral: "#6b7280",
};

const toneBg: Record<string, string> = {
  teal: "#f0fdfb",
  gold: "#fffbf0",
  red: "#fff5f5",
  neutral: "#f9fafb",
};

function HealthBadge({ tone, title }: { tone: string; title: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.05em",
        background: toneBg[tone] ?? "#f9fafb",
        color: toneColor[tone] ?? "#6b7280",
        border: `1px solid ${toneColor[tone] ?? "#e5e7eb"}`,
      }}
    >
      {title}
    </span>
  );
}

function StatCard({ card }: { card: StatusCard }) {
  const color = toneColor[card.tone] ?? "#6b7280";
  const bg = toneBg[card.tone] ?? "#f9fafb";

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid #e5e7eb`,
        borderTop: `3px solid ${color}`,
        borderRadius: 8,
        padding: "20px 24px",
        flex: 1,
        minWidth: 200,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
        {card.label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.1, marginBottom: 4 }}>
        {card.title}
      </div>
      {card.detail && (
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{card.detail}</div>
      )}
      {card.eta && (
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{card.eta}</div>
      )}
      {card.bullets && card.bullets.length > 0 && (
        <ul style={{ margin: "8px 0 0", padding: "0 0 0 16px" }}>
          {card.bullets.map((b) => (
            <li key={b} style={{ fontSize: 13, color: "#374151", marginBottom: 3 }}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Pipeline({ stages }: { stages: PipelineStage[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
      {stages.map((stage, i) => {
        const isDone = stage.status === "done";
        const isCurrent = stage.status === "current";
        const isNext = stage.status === "next";
        const color = isDone ? "#00b8a0" : isCurrent ? "#f5a623" : "#d1d5db";
        const textColor = isDone ? "#00b8a0" : isCurrent ? "#92400e" : isNext ? "#6b7280" : "#9ca3af";

        return (
          <div key={stage.label} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 80 }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: isDone ? "#00b8a0" : isCurrent ? "#f5a623" : "#f3f4f6",
                  border: `2px solid ${color}`,
                  margin: "0 auto 6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: isDone || isCurrent ? "#fff" : "#9ca3af",
                  fontWeight: 700,
                }}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <div style={{ fontSize: 11, fontWeight: isCurrent ? 700 : 500, color: textColor, whiteSpace: "nowrap" }}>
                {stage.label}
              </div>
            </div>
            {i < stages.length - 1 && (
              <div style={{ height: 2, flex: 1, background: isDone ? "#00b8a0" : "#e5e7eb", marginBottom: 22, minWidth: 8 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActionItem({ title, detail, actionLabel, actionUrl }: {
  title: string;
  detail?: string;
  actionLabel?: string;
  actionUrl?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{title}</div>
        {detail && <div style={{ fontSize: 13, color: "#6b7280" }}>{detail}</div>}
      </div>
      {actionLabel && actionUrl && (
        <a
          href={actionUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flexShrink: 0,
            padding: "6px 14px",
            background: "#f5a623",
            color: "#fff",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}

export function PortalView({ client, bridge }: { client: BridgeClient; bridge: LiveBridgePayload }) {
  const clientItems = bridge.workingPlanItems.filter((t) => t.owner === "chris");
  const internalItems = bridge.workingPlanItems.filter((t) => t.owner === "jesse");
  const healthCard = bridge.statusCards.find((c) => c.label === "Project Health");

  return (
    <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      {/* Top bar */}
      <div style={{ background: "#111827", color: "#fff", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{client.companyName ?? client.name}</span>
          <span style={{ color: "#6b7280", margin: "0 10px" }}>·</span>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>Project Portal</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {healthCard && <HealthBadge tone={healthCard.tone} title={healthCard.title} />}
          <span style={{ fontSize: 12, color: "#6b7280" }}>{bridge.updatedStamp}</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* 30-day onboarding journey — primary content */}
        <OnboardingJourney />

        {/* What RT Digital is building (secondary, collapsed by default in future pass) */}
        {clientItems.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "24px 28px", marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
              Action Required
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>These items are waiting on you.</p>
            {clientItems.map((item) => (
              <ActionItem key={item.id} title={item.title} detail={item.detail} />
            ))}
          </div>
        )}

        {/* What we're working on */}
        {internalItems.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "24px 28px", marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#00b8a0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
              What We're Working On
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>RT Digital's current focus items.</p>
            {internalItems.map((item) => (
              <ActionItem key={item.id} title={item.title} detail={item.detail} />
            ))}
          </div>
        )}

        {/* Recent movement */}
        {bridge.latestMovement.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "24px 28px" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
              Recent Activity
            </h2>
            {bridge.latestMovement.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < bridge.latestMovement.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: toneColor[item.tone] ?? "#9ca3af", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#374151" }}>{item.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
