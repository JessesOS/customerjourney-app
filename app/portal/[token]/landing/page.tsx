import { getMilestoneContent, getPortalClientByToken } from "@/lib/portalClientStore";
import { notFound } from "next/navigation";

/**
 * The client's actual landing page, rendered from the structured content the
 * AI generated off their website (virtual slot "landing-page"). This is the
 * page bd-g2 asks them to approve — a real page, not a wall of copy. Buttons
 * are inert in preview; the live build wires real forms/numbers at launch.
 */

type LandingContent = {
  hero?: { headline?: string; subheadline?: string; cta?: string };
  trust?: string[];
  services?: { name?: string; benefit?: string }[];
  why?: string[];
  how?: { step?: string; detail?: string }[];
  finalCta?: { line?: string; button?: string };
};

const ink = "#1d1a15";
const paper = "#faf7f1";
const act = "#c05e2e";

function Cta({ label }: { label?: string }) {
  return (
    <span style={{ display: "inline-block", background: act, color: "#fff", fontWeight: 700, fontSize: 16, padding: "14px 30px", borderRadius: 999, boxShadow: "0 6px 18px rgba(192,94,46,0.35)" }}>
      {label ?? "Get a fast quote"}
    </span>
  );
}

export default async function LandingPreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const client = await getPortalClientByToken(token);
  if (!client) notFound();

  const raw = await getMilestoneContent(client.id, "landing-page");
  let content: LandingContent | null = null;
  try {
    content = raw ? (JSON.parse(raw) as LandingContent) : null;
  } catch {
    content = null;
  }

  const business = client.companyName || client.name;

  if (!content?.hero) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: paper, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: ink, padding: 24 }}>
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, marginBottom: 10 }}>Your landing page is being drafted</h1>
          <p style={{ fontSize: 14.5, color: "#6b6459", lineHeight: 1.5 }}>The team is generating it from your website now — check back in a few minutes.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: paper, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: ink }}>
      {/* preview ribbon */}
      <div style={{ background: ink, color: "#fff", textAlign: "center", fontSize: 12.5, padding: "8px 16px" }}>
        Preview of your landing page — buttons go live at launch
      </div>

      {/* hero */}
      <section style={{ background: `linear-gradient(160deg, ${ink} 0%, #3a3126 100%)`, color: "#fff", padding: "72px 24px 64px", textAlign: "center" }}>
        <div style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.75, marginBottom: 18, fontWeight: 650 }}>{business}</div>
        <h1 style={{ fontSize: "clamp(30px, 5.4vw, 52px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.12, maxWidth: 780, margin: "0 auto 18px" }}>{content.hero.headline}</h1>
        {content.hero.subheadline && <p style={{ fontSize: 17.5, opacity: 0.85, maxWidth: 620, margin: "0 auto 30px", lineHeight: 1.5 }}>{content.hero.subheadline}</p>}
        <Cta label={content.hero.cta} />
      </section>

      {/* trust strip */}
      {content.trust && content.trust.length > 0 && (
        <section style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px 40px", padding: "22px 24px", background: "#fff", borderBottom: "1px solid #ece6db" }}>
          {content.trust.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#4c463c" }}>
              <span style={{ color: act, fontSize: 16 }}>✓</span> {t}
            </div>
          ))}
        </section>
      )}

      {/* services */}
      {content.services && content.services.length > 0 && (
        <section style={{ maxWidth: 980, margin: "0 auto", padding: "56px 24px 8px" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.015em", textAlign: "center", marginBottom: 30 }}>How we can help</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
            {content.services.map((s, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #ece6db", borderRadius: 16, padding: "22px 22px" }}>
                <div style={{ fontWeight: 750, fontSize: 16.5, marginBottom: 7 }}>{s.name}</div>
                <div style={{ fontSize: 14, color: "#6b6459", lineHeight: 1.5 }}>{s.benefit}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* why + how */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 36 }}>
        {content.why && content.why.length > 0 && (
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Why {business}</h3>
            {content.why.map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 11, fontSize: 14.5, lineHeight: 1.5, color: "#4c463c" }}>
                <span style={{ color: act, fontWeight: 800 }}>✓</span> {w}
              </div>
            ))}
          </div>
        )}
        {content.how && content.how.length > 0 && (
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>How it works</h3>
            {content.how.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 30, height: 30, borderRadius: 99, background: act, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{h.step}</div>
                  <div style={{ fontSize: 13.5, color: "#6b6459", lineHeight: 1.5 }}>{h.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* final CTA */}
      {content.finalCta && (
        <section style={{ background: ink, color: "#fff", textAlign: "center", padding: "52px 24px 60px" }}>
          <p style={{ fontSize: 20, fontWeight: 700, maxWidth: 640, margin: "0 auto 24px", lineHeight: 1.4 }}>{content.finalCta.line}</p>
          <Cta label={content.finalCta.button} />
        </section>
      )}
    </main>
  );
}
