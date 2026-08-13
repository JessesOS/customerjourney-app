"use client";

/**
 * "Move fast, save $200" engagement popup — one-time, per client, shown
 * right after the welcome dismisses (before Stage 1). Copy deliberately
 * keeps the internal $3,000/30-days value logic OFF the client's screen —
 * that's our reasoning for the offer, not something to lecture a client
 * with; the credit is the whole message. Token-driven so it reskins across
 * every theme and the handoff design without changes.
 */
export function IncentiveModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pj-incentive-title"
      style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "var(--pj-scrim)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 440,
          width: "100%",
          background: "var(--pj-card-grad)",
          border: "1px solid var(--pj-card-line)",
          borderRadius: 28,
          padding: "36px 32px 32px",
          textAlign: "center",
          boxShadow: "var(--pj-shadow-modal)",
          position: "relative",
          animation: "viewIn 0.35s cubic-bezier(0.2,0.7,0.2,1)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{ position: "absolute", top: 16, right: 16, width: 28, height: 28, borderRadius: "50%", border: "none", background: "var(--pj-well)", color: "var(--pj-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-act)", marginBottom: 14 }}>
          A little incentive
        </div>

        <div
          style={{
            width: 76,
            height: 76,
            margin: "0 auto 18px",
            borderRadius: "50%",
            background: "var(--pj-btn-grad)",
            boxShadow: "var(--pj-shadow-btn)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading), sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: "var(--pj-act-ink)",
            letterSpacing: "-0.02em",
          }}
        >
          $200
        </div>

        <h2 id="pj-incentive-title" style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
          Move fast, save $200.
        </h2>

        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--pj-muted)", margin: "0 0 26px", maxWidth: "38ch", marginLeft: "auto", marginRight: "auto" }}>
          The sooner you&apos;re set up, the sooner you&apos;re seeing results — so we&apos;re backing that. Finish onboarding within <b style={{ color: "var(--pj-ink)" }}>15 days</b> and we&apos;ll credit <b style={{ color: "var(--pj-ink)" }}>$200</b> straight off your call charges. Call it our way of matching your hustle.
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: "var(--pj-btn-grad)",
            color: "var(--pj-act-ink)",
            fontWeight: 650,
            fontSize: 14.5,
            border: "none",
            borderRadius: 999,
            padding: "13px 34px",
            cursor: "pointer",
            boxShadow: "var(--pj-shadow-btn)",
            fontFamily: "var(--font-body), sans-serif",
          }}
        >
          Let&apos;s go →
        </button>
      </div>
    </div>
  );
}
