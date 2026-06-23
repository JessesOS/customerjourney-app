import { CollaborationHub } from "./components/CollaborationHub";
import { defaultChecklistItems, projectStages } from "@/lib/collaboration";

const meetingSignals = [
  {
    label: "Client reality",
    text: "Chris is not buying a generic AI campaign. He is testing whether a serious creative and automation partner can protect his reputation with high-value trade clients.",
  },
  {
    label: "Market focus",
    text: "Start in Christchurch / Canterbury, where eight strategists can service demand and where proof will determine whether the model expands nationally.",
  },
  {
    label: "Lead quality",
    text: "The campaign must filter for owners with staff, turnover, and real strategic pain. Volume without qualification is the failure mode.",
  },
  {
    label: "Creative anchor",
    text: "The strongest offer is not a subsidy. It is a benchmark-led profit leakage story that makes an owner feel the size of the hidden gap.",
  },
];

const systemSteps = [
  {
    title: "Traffic",
    detail: "Meta cold/warm campaigns and Google high-intent search routes.",
    accent: "teal",
  },
  {
    title: "Lead Capture",
    detail: "Native lead forms or a focused two-step GHL landing funnel.",
    accent: "gold",
  },
  {
    title: "TradeAI CRM",
    detail: "Source tags, opportunity card, pipeline entry, first SMS and email.",
    accent: "ink",
  },
  {
    title: "AI Nurture",
    detail: "Polite follow-up cadence across SMS and email until engagement.",
    accent: "teal",
  },
  {
    title: "Qualification",
    detail: "Pain, motivation, service fit, address, timezone, phone and email.",
    accent: "red",
  },
  {
    title: "Booked Consult",
    detail: "Calendar read, specific time slots offered, appointment locked in.",
    accent: "gold",
  },
  {
    title: "Human Handoff",
    detail: "AI shuts down, CRM moves to booked, rep reviews notes and calls.",
    accent: "ink",
  },
];

const offerAngles = [
  {
    title: "Productivity Gap",
    prompt: "Are your people producing what the top performers in your trade produce?",
    proof: "A benchmark snapshot can turn revenue-per-person into a visible missing-dollar figure.",
  },
  {
    title: "Margin & Pricing",
    prompt: "If your gross margin is off by a few points, how much profit is leaking every year?",
    proof: "Use red-line variance moments from anonymised reports, not abstract coaching language.",
  },
  {
    title: "Wage Leakage",
    prompt: "Are staff costs quietly sitting above the industry line?",
    proof: "Chris called out wage overspend as a common red item and a strong emotional trigger.",
  },
  {
    title: "Buying Group Savings",
    prompt: "Are you missing $15K-$25K because you are outside the right buying group?",
    proof: "A secondary A/B route that may work as a practical savings hook.",
  },
  {
    title: "Subsidies & Grants",
    prompt: "Could a wage subsidy or regional business partner grant create enough reason to start the conversation?",
    proof: "Chris sees this as weaker and less exciting, but it can remain a comparison angle against the stronger gap-analysis offer.",
  },
  {
    title: "Testimonial Proof",
    prompt: "Let clients describe the moment the gap became impossible to ignore.",
    proof: "Use anonymised interviews or category-safe proof where confidentiality matters.",
  },
];

const nextWorkshop = [
  "Confirm the exact offer language Chris is comfortable putting in market.",
  "Collect anonymised benchmark screenshots or a white-labelled sample report.",
  "Choose the first three trade segments to test: electricians, plumbers, flooring, tyres, or other transactional trades.",
  "Define disqualifiers up front: one-person businesses, no staff, insufficient turnover, duplicate existing contacts.",
  "Draft two video scripts: Chris on-screen gap analysis and testimonial-led proof.",
];

function Metric({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: "red" | "gold";
}) {
  return (
    <div className={`metric ${tone ? `metric-${tone}` : ""}`}>
      <span>{value}</span>
      <p>{label}</p>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Strategize growth workspace home">
          <img src="/strategize-logo-cropped.png" alt="Strategize" />
        </a>
        <nav aria-label="Workspace navigation">
          <a href="#working-plan">Plan</a>
          <a href="#brief">Brief</a>
          <a href="#offer">Offer Lab</a>
          <a href="#system">System Map</a>
          <a href="#workshop">Next</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <img
            className="hero-logo"
            src="/strategize-logo-cropped.png"
            alt="Strategize"
          />
          <h1>
            A shared strategy room for the Canterbury pilot: clarify the offer,
            shape the campaign, and map how qualified trade-business owners move
            from ad click to booked consult.
          </h1>
          <div className="hero-actions" aria-label="Primary workspace actions">
            <a href="#working-plan">Open Working Plan</a>
            <a href="#offer">Open Offer Lab</a>
            <a href="#system">View System Map</a>
          </div>
        </div>

        <div className="hero-board" aria-label="Pilot snapshot">
          <div className="board-topline">
            <span>Canterbury pilot</span>
            <strong>Offer workshop + lead engine</strong>
          </div>
          <div className="board-grid">
            <Metric value="5-25" label="staff sweet spot" />
            <Metric value="$875" label="benchmark value signal" tone="gold" />
            <Metric value="$100K+" label="gap story potential" tone="red" />
            <Metric value="1 in 5" label="known conversion benchmark" />
          </div>
          <div className="gap-card">
            <div>
              <p>Lead magnet thesis</p>
              <h2>Free Business Gap Analysis</h2>
            </div>
            <span>Benchmark the gap</span>
          </div>
        </div>
      </section>

      <CollaborationHub
        initialItems={defaultChecklistItems}
        stages={projectStages}
      />

      <section className="meeting-brief section-band" id="brief">
        <div className="section-title">
          <p>Meeting Brief</p>
          <h2>What mattered most in the call</h2>
        </div>
        <div className="signals">
          {meetingSignals.map((signal) => (
            <article key={signal.label}>
              <span>{signal.label}</span>
              <p>{signal.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="offer-lab" id="offer">
        <div className="offer-copy">
          <p>Offer Lab</p>
          <h2>The campaign should sell the size of the hidden gap.</h2>
          <p>
            Chris already has a conversion asset: a benchmark process that
            compares a business against its category and makes profit leakage
            tangible. The creative job is to compress that moment for Meta
            without giving away the proprietary numbers.
          </p>
        </div>

        <div className="analysis-panel">
          <div className="panel-header">
            <span>Creative territory</span>
            <strong>Gap Analysis Teaser</strong>
          </div>
          <div className="variance-row high">
            <span>Productivity per person</span>
            <b>$200K missing</b>
          </div>
          <div className="variance-row">
            <span>Wage ratio</span>
            <b>$116K over line</b>
          </div>
          <div className="variance-row">
            <span>Marketing spend</span>
            <b>$64K above benchmark</b>
          </div>
          <div className="teaser-script">
            <p>
              “Most owners know they are busy. Fewer know whether they are
              first, last, or in the middle. A simple benchmark can show the
              gap in dollars.”
            </p>
          </div>
        </div>
      </section>

      <section className="campaigns">
        <div className="section-title">
          <p>Campaign Hypotheses</p>
          <h2>Six angles worth testing before we fall in love with one.</h2>
        </div>
        <div className="angle-list">
          {offerAngles.map((angle) => (
            <article key={angle.title}>
              <h3>{angle.title}</h3>
              <p>{angle.prompt}</p>
              <span>{angle.proof}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="system-map section-band" id="system">
        <div className="section-title">
          <p>System Map.</p>
          <h2>Lead to booked consult</h2>
        </div>
        <div className="flow">
          {systemSteps.map((step, index) => (
            <article className={`flow-step flow-${step.accent}`} key={step.title}>
              <div className="step-index">{String(index + 1).padStart(2, "0")}</div>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workshop section-band" id="workshop">
        <div className="section-title">
          <p>Next Workshop</p>
          <h2>Use the next 90 minutes to make the campaign concrete.</h2>
        </div>
        <ol>
          {nextWorkshop.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
