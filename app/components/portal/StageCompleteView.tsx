"use client";

import { JourneyStage } from "@/lib/onboardingJourney";

/**
 * The payoff screen shown the moment a client approves the final task in a
 * stage. Banks the momentum (endowed progress) and previews the next stage —
 * "what we're doing" vs "what you'll approve" — so the quiet "with us" stretch
 * ahead never reads as silence.
 */
export function StageCompleteView({
  stageName,
  totalTasks,
  nextStage,
  nextIndex,
  totalStages,
  onContinue,
  onBackToJourney,
}: {
  stageName: string;
  totalTasks: number;
  nextStage?: JourneyStage;
  nextIndex: number;
  totalStages: number;
  onContinue: () => void;
  onBackToJourney: () => void;
}) {
  const dayLabel = nextStage
    ? nextStage.dayStart === nextStage.dayEnd
      ? `Day ${nextStage.dayStart}`
      : `Days ${nextStage.dayStart}–${nextStage.dayEnd}`
    : "";
  const approvals = nextStage ? nextStage.milestones.filter((m) => m.hasEditableContent) : [];

  return (
    <section style={{ maxWidth: 620, margin: "0 auto", padding: "56px 32px 80px", textAlign: "center", animation: "viewIn 0.45s cubic-bezier(0.2,0.7,0.2,1)" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--pj-done)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 22px",
          boxShadow: "0 14px 34px -16px rgba(95,122,78,.55)",
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4 10-12" />
        </svg>
      </div>
      <h3 style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: 34, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 10px" }}>
        {stageName} complete.
      </h3>
      <p style={{ color: "var(--pj-muted)", fontSize: 15, margin: "0 0 30px" }}>
        {totalTasks} of {totalTasks} tasks done — that&apos;s everything we need from you for this stage. Nice work.
      </p>

      {nextStage ? (
        <div
          style={{
            background: "var(--pj-card)",
            border: "1px solid var(--pj-line)",
            borderRadius: "var(--pj-radius-card)",
            padding: "24px 26px",
            textAlign: "left",
            boxShadow: "0 14px 36px -26px rgba(60,46,32,.45)",
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 700, color: "var(--pj-act)", marginBottom: 10 }}>
            Up next · Stage {nextIndex} of {totalStages}{dayLabel ? ` · ${dayLabel}` : ""}
          </div>
          <div style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: 22, fontWeight: 600, margin: "0 0 6px" }}>{nextStage.name}</div>
          {nextStage.blurb ? <p style={{ fontSize: 13.5, color: "var(--pj-muted)", margin: "0 0 16px" }}>{nextStage.blurb}</p> : null}

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {nextStage.statusNotes.length > 0 ? (
              <div style={{ flex: 1, minWidth: 200 }}>
                <h5 style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700, color: "var(--pj-faint)", margin: "0 0 8px" }}>What we&apos;re doing</h5>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--pj-muted)" }}>
                  {nextStage.statusNotes.map((n) => (
                    <li key={n} style={{ marginBottom: 5 }}>{n}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {approvals.length > 0 ? (
              <div style={{ flex: 1, minWidth: 200 }}>
                <h5 style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700, color: "var(--pj-faint)", margin: "0 0 8px" }}>What you&apos;ll approve</h5>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--pj-ink)" }}>
                  {approvals.map((m) => (
                    <li key={m.id} style={{ marginBottom: 5 }}>{m.title}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-line)", borderRadius: "var(--pj-radius-card)", padding: "24px 26px" }}>
          <div style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: 20, fontWeight: 600 }}>You&apos;re all the way through. 🎉</div>
          <p style={{ fontSize: 13.5, color: "var(--pj-muted)", margin: "8px 0 0" }}>Every stage of your onboarding journey is complete.</p>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 28 }}>
        <button
          type="button"
          onClick={onContinue}
          style={{
            background: "var(--pj-act)",
            color: "var(--pj-act-ink)",
            fontWeight: 650,
            fontSize: 14,
            border: "none",
            borderRadius: "var(--pj-radius-pill)",
            padding: "12px 24px",
            cursor: "pointer",
            boxShadow: "0 8px 20px -10px rgba(38,32,25,.26)",
            fontFamily: "var(--font-body), sans-serif",
          }}
        >
          {nextStage ? `Continue to ${nextStage.name} →` : "Back to your journey →"}
        </button>
        {nextStage ? (
          <button
            type="button"
            onClick={onBackToJourney}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--pj-muted)", fontFamily: "var(--font-body), sans-serif" }}
          >
            Back to your journey
          </button>
        ) : null}
      </div>
    </section>
  );
}
