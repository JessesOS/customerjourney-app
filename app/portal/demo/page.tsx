import { OnboardingJourney } from "@/app/components/OnboardingJourney";

export default function PortalDemoPage() {
  return (
    <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ background: "#111827", color: "#fff", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Chris McBreen</span>
          <span style={{ color: "#6b7280", margin: "0 10px" }}>·</span>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>Project Portal (Demo Data)</span>
        </div>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 700,
            background: "#f0fdfb",
            color: "#00b8a0",
            border: "1px solid #00b8a0",
          }}
        >
          ON TRACK
        </span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <OnboardingJourney />
      </div>
    </div>
  );
}
