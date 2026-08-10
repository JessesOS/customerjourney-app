"use client";

import { useEffect, useState } from "react";
import { JourneyStage } from "@/lib/onboardingJourney";

/** One-shot confetti rain for the journey-complete moment. Pure CSS pieces in
    theme colours; clears itself after the show. */
function Confetti() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  const colors = ["var(--pj-act)", "var(--pj-done)", "#e0c56e", "#d98a66", "#7fb5a3"];
  const pieces = Array.from({ length: 70 }, (_, i) => {
    const left = (i * 137.5) % 100;
    const delay = ((i * 53) % 200) / 100;
    const duration = 2.6 + ((i * 89) % 180) / 100;
    const size = 6 + ((i * 31) % 8);
    const color = colors[i % colors.length];
    const rotate = (i * 47) % 360;
    return { left, delay, duration, size, color, rotate, round: i % 3 === 0 };
  });
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 60 }}>
      <style>{`@keyframes pj-confetti-fall { 0% { transform: translateY(-6vh) rotate(0deg); opacity: 1 } 85% { opacity: 1 } 100% { transform: translateY(106vh) rotate(720deg); opacity: 0 } }`}</style>
      {pieces.map((c, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${c.left}%`,
            width: c.size,
            height: c.round ? c.size : c.size * 0.45,
            borderRadius: c.round ? 99 : 2,
            background: c.color,
            transform: `rotate(${c.rotate}deg)`,
            animation: `pj-confetti-fall ${c.duration}s cubic-bezier(0.25,0.4,0.45,1) ${c.delay}s both`,
          }}
        />
      ))}
    </div>
  );
}

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
          background: "radial-gradient(circle at 32% 28%, var(--pj-done-hi) 0%, var(--pj-done) 72%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 22px",
          boxShadow: "var(--pj-shadow-badge)",
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4 10-12" />
        </svg>
      </div>
      {!nextStage && <Confetti />}
      <h3 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 34, fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 10px" }}>
        {nextStage ? `${stageName} complete.` : "That's the whole journey. You're live."}
      </h3>
      <p style={{ color: "var(--pj-muted)", fontSize: 15, margin: "0 0 30px" }}>
        {nextStage
          ? `${totalTasks} of ${totalTasks} tasks done — that's everything we need from you for this stage. Nice work.`
          : "Every stage, every task, done. Your system is live, your team is trained, and from here we're in your corner month after month."}
      </p>

      {nextStage ? (
        <div
          style={{
            background: "var(--pj-card-grad)",
            border: "1px solid var(--pj-card-line)",
            borderRadius: 24,
            padding: "24px 26px",
            textAlign: "left",
            boxShadow: "var(--pj-shadow-card)",
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 700, color: "var(--pj-act)", marginBottom: 10 }}>
            Up next · Stage {nextIndex} of {totalStages}{dayLabel ? ` · ${dayLabel}` : ""}
          </div>
          <div style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 6px" }}>{nextStage.name}</div>
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
        <div style={{ background: "var(--pj-card-grad, var(--pj-card))", border: "1px solid var(--pj-card-line, var(--pj-line))", borderRadius: 24, padding: "26px 28px", boxShadow: "var(--pj-shadow-card)" }}>
          <div style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em" }}>Welcome to the other side. 🎉</div>
          <p style={{ fontSize: 13.5, color: "var(--pj-muted)", margin: "10px 0 0", lineHeight: 1.55 }}>
            Onboarding is officially behind you — from here it&apos;s monthly check-ins, real leads, and your AI answering every call.
            This portal stays yours: your bookings, your approvals, and your team&apos;s next steps all live here.
          </p>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 28 }}>
        <button
          type="button"
          onClick={onContinue}
          style={{
            background: "var(--pj-btn-grad)",
            color: "var(--pj-act-ink)",
            fontWeight: 650,
            fontSize: 14,
            border: "none",
            borderRadius: "var(--pj-radius-pill)",
            padding: "12px 24px",
            cursor: "pointer",
            boxShadow: "var(--pj-shadow-btn)",
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
