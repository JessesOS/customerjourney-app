import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { portalClients } from "@/db/schema";
import { agreementFor } from "@/lib/agreementStore";
import { portalJourneyFor } from "@/lib/productRegistry";
import { verifySignLink } from "@/lib/signLink";
import { SigningPanel } from "./SigningPanel";

// The public signing page (2026-10-27, replacing the per-client Vercel pages):
// the client reads their agreement and signs it before they get their portal.
// Same text, same record and same step-1 tick as the portal, so the two can't
// drift. Reached only by the signing link the team copies from the board.

export const metadata = { title: "Agreement", robots: { index: false, follow: false } };

export default async function SignPage({ params }: { params: Promise<{ id: string; sig: string }> }) {
  const { id, sig } = await params;
  if (!(await verifySignLink(id, sig))) notFound();
  const client = (await getDb().select().from(portalClients).where(eq(portalClients.id, id)).limit(1))[0];
  const agreement = client ? agreementFor(client.clientType) : null;
  if (!client || !agreement) notFound();
  const journey = portalJourneyFor(client.clientType);

  return (
    <main className="sg">
      <style>{`
        .sg { --pj-ink:#14141a; --pj-muted:#55555f; --pj-faint:#8a8a94; --pj-line:#e3e1dc; --pj-card:#fff; --pj-act:#5b3fd6; --pj-act-ink:#fff;
              --pj-act-fill:rgba(91,63,214,.08); --pj-btn-grad:linear-gradient(135deg,#6a4cf0,#4f35c4); --pj-shadow-btn:0 8px 24px rgba(79,53,196,.28);
              --pj-radius-sm:12px; --pj-radius-pill:999px; --font-body: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
              min-height:100vh; background:#f6f4ef; color:var(--pj-ink); font-family:var(--font-body); padding:48px 20px 80px; }
        .sg-wrap { max-width:760px; margin:0 auto; }
        .sg-brand { font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--pj-faint); font-weight:650; }
        .sg h1 { font-size:32px; letter-spacing:-.02em; margin:10px 0 6px; }
        .sg-sub { color:var(--pj-muted); font-size:15px; line-height:1.55; margin:0 0 8px; max-width:60ch; }
        .sg-done { margin-top:18px; padding:14px 18px; border-radius:12px; background:#eaf6ee; border:1px solid #b9dfc6; color:#1f5b33; font-size:14.5px; }
        .sg-foot { margin-top:40px; font-size:12px; color:var(--pj-faint); }
        @media (max-width:640px){ .sg { padding:28px 16px 60px; } .sg h1 { font-size:26px; } }
      `}</style>
      <div className="sg-wrap">
        <div className="sg-brand">All Convos AI · {journey.brandName ?? journey.wordmark}</div>
        <h1>Your agreement</h1>
        <p className="sg-sub">Read it all, then accept it at the bottom. Pressing Accept is your signature: we record your name, position, email, the date and time and this exact text, and email you a copy straight away.</p>
        <SigningPanel endpoint={`/api/sign/${id}/${sig}`} agreement={agreement} />
        <p className="sg-foot">All Convos AI · {agreement.title}</p>
      </div>
    </main>
  );
}
