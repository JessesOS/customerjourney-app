"use client";

import { useMemo, useState } from "react";
import { ProjectChat } from "./components/ProjectChat";

type TaskOwner = "chris" | "jesse";

type TaskItem = {
  id: string;
  owner: TaskOwner;
  title: string;
  detail: string;
  completed: boolean;
};

const heroFacts = [
  { value: "5-25", label: "staff sweet spot", tone: "neutral" },
  { value: "$875", label: "benchmark value", tone: "gold" },
  { value: "$100K+", label: "gap story", tone: "red" },
  { value: "1 in 5", label: "conversion", tone: "neutral" },
  { value: "Free", label: "Business Gap Analysis", tone: "teal" },
];

const statusCards = [
  {
    label: "Project Health",
    title: "AT RISK",
    detail: "3 items blocking creative - all on the client side.",
    tone: "gold",
  },
  {
    label: "Blockers",
    title: "3",
    meta: "open - gating creative",
    badge: "All on Chris",
    bullets: [
      "Send anonymised benchmark screenshots",
      "Confirm offer language for market",
      "Pick first 3 trade segments",
    ],
    tone: "red",
  },
  {
    label: "Current Stage",
    title: "Onboarding",
    progress: "02 / 07",
    next: "Next - Strategy",
    eta: "Jul 4 - 6 days",
    tone: "teal",
  },
];

const summaryMetrics = [
  { label: "Awaiting Client", value: "4", detail: "items on Chris", tone: "gold" },
  { label: "Awaiting You", value: "2", detail: "items on Jesse", tone: "teal" },
  { label: "Open Actions", value: "6/8", detail: "2 done", tone: "neutral" },
  { label: "Days to Launch", value: "41", detail: "target Aug 8", tone: "gold" },
];

const deliveryPipeline = [
  { label: "Pre-onboarding", status: "done" },
  { label: "Onboarding", status: "current" },
  { label: "Strategy", status: "next" },
  { label: "Creative", status: "later" },
  { label: "Build", status: "later" },
  { label: "Launch", status: "later" },
  { label: "Optimise", status: "later" },
];

const outstandingColumns = [
  {
    title: "Blocking Now",
    count: 3,
    tone: "red",
    items: [
      {
        title: "Send anonymised benchmark screenshots",
        detail: "Gates the gap-analysis creative. Hard blocker.",
        owner: "Chris",
        initials: "CM",
        age: "4d",
      },
      {
        title: "Confirm offer language for market",
        detail: "Final wording Chris is comfortable running.",
        owner: "Chris",
        initials: "CM",
        age: "2d",
      },
      {
        title: "Pick first 3 trade segments",
        detail: "Electricians, plumbers, flooring, tyres...",
        owner: "Chris",
        initials: "CM",
        age: "2d",
      },
    ],
  },
  {
    title: "Awaiting Client",
    count: 1,
    tone: "gold",
    items: [
      {
        title: "Approve gap-analysis video concept",
        detail: "Chris-led on-screen teaser direction.",
        owner: "Chris",
        initials: "CM",
        age: "1d",
      },
    ],
  },
  {
    title: "On You",
    count: 2,
    tone: "teal",
    items: [
      {
        title: "Draft two video scripts",
        detail: "Gap analysis + testimonial-led proof.",
        owner: "Jesse",
        initials: "JA",
        age: "1d",
      },
      {
        title: "Map Meta + Google traffic routes",
        detail: "Cold/warm + high-intent search.",
        owner: "Jesse",
        initials: "JA",
        age: "3d",
      },
    ],
  },
];

const initialTasks: TaskItem[] = [
  {
    id: "chris-1",
    owner: "chris",
    title: "Send anonymised benchmark screenshots",
    detail: "Gates the gap-analysis creative. Hard blocker.",
    completed: false,
  },
  {
    id: "chris-2",
    owner: "chris",
    title: "Confirm offer language for market",
    detail: "Final wording Chris is comfortable running.",
    completed: false,
  },
  {
    id: "chris-3",
    owner: "chris",
    title: "Pick first 3 trade segments",
    detail: "Electricians, plumbers, flooring, tyres...",
    completed: false,
  },
  {
    id: "chris-4",
    owner: "chris",
    title: "Approve gap-analysis video concept",
    detail: "Chris-led on-screen teaser direction.",
    completed: false,
  },
  {
    id: "jesse-1",
    owner: "jesse",
    title: "Draft two video scripts",
    detail: "Gap analysis + testimonial-led proof.",
    completed: false,
  },
  {
    id: "jesse-2",
    owner: "jesse",
    title: "Stand up GHL two-step funnel",
    detail: "Native lead-form alternative staged.",
    completed: true,
  },
  {
    id: "jesse-3",
    owner: "jesse",
    title: "Define CRM disqualifiers",
    detail: "One-person, no staff, low turnover, dupes.",
    completed: true,
  },
  {
    id: "jesse-4",
    owner: "jesse",
    title: "Map Meta + Google traffic routes",
    detail: "Cold/warm + high-intent search.",
    completed: false,
  },
];

const systemSteps = [
  {
    id: "01",
    title: "Traffic",
    detail: "Meta cold/warm campaigns and Google high-intent search routes.",
    tone: "teal",
  },
  {
    id: "02",
    title: "Lead Capture",
    detail: "Native lead forms or a focused two-step GHL landing funnel.",
    tone: "gold",
  },
  {
    id: "03",
    title: "TradeAI CRM",
    detail: "Source tags, opportunity card, pipeline entry, first SMS + email.",
    tone: "teal",
  },
  {
    id: "04",
    title: "AI Nurture",
    detail: "Polite follow-up cadence across SMS and email until engagement.",
    tone: "teal",
  },
  {
    id: "05",
    title: "Qualification",
    detail: "Pain, motivation, service fit, address, timezone, phone + email.",
    tone: "red",
  },
  {
    id: "06",
    title: "Booked Consult",
    detail: "Calendar read, specific slots offered, appointment locked in.",
    tone: "gold",
  },
  {
    id: "07",
    title: "Human Handoff",
    detail: "AI shuts down, CRM moves to booked, rep reviews notes and calls.",
    tone: "paper",
  },
];

const timelineStages = [
  {
    date: "Jun 20",
    title: "Pre-onboarding",
    detail: "Access + scope agreed",
    status: "done",
  },
  {
    date: "Jun 28",
    title: "Onboarding",
    detail: "Workspace + CRM live",
    status: "current",
  },
  {
    date: "Jul 4",
    title: "Strategy",
    detail: "Offer + segments lock",
    status: "later",
  },
  {
    date: "Jul 14",
    title: "Creative",
    detail: "Scripts + gap teaser",
    status: "later",
  },
  {
    date: "Jul 24",
    title: "Build",
    detail: "Funnel + automations",
    status: "later",
  },
  {
    date: "Aug 8",
    title: "Launch",
    detail: "Meta + Google live",
    status: "later",
  },
  {
    date: "Ongoing",
    title: "Optimise",
    detail: "Qualify + tune",
    status: "later",
  },
];

const decisions = [
  {
    date: "Jun 27",
    text: "Lead with the benchmark gap-analysis offer - not subsidies or grants.",
  },
  {
    date: "Jun 27",
    text: "Start in Christchurch / Canterbury before any national rollout.",
  },
  {
    date: "Jun 27",
    text: "Qualify only owners with staff (5-25), real turnover and strategic pain.",
  },
  {
    date: "Jun 26",
    text: "Keep proprietary benchmark numbers out of the ad creative.",
  },
];

const latestMovement = [
  {
    text: "Onboarding kicked off - shared workspace and CRM access granted.",
    tone: "teal",
  },
  {
    text: "GHL two-step landing funnel drafted and staged.",
    tone: "teal",
  },
  {
    text: "CRM disqualifiers defined (one-person, no staff, low turnover, dupes).",
    tone: "teal",
  },
  {
    text: "Blocked on Chris for anonymised benchmark proof assets.",
    tone: "red",
  },
];

export default function Home() {
  const [tasks, setTasks] = useState(initialTasks);

  const taskGroups = useMemo(
    () => ({
      chris: tasks.filter((task) => task.owner === "chris"),
      jesse: tasks.filter((task) => task.owner === "jesse"),
    }),
    [tasks],
  );

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function openProjectChat() {
    window.dispatchEvent(new CustomEvent("open-project-chat"));
  }

  return (
    <main className="strategy-room">
      <header className="topbar">
        <a className="brand-lockup" href="#status" aria-label="Strategize and RT Digital">
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-mark-inner" />
          </span>
          <span className="brand-word">Strategize</span>
          <span className="brand-separator">×</span>
          <span className="brand-word">RT Digital</span>
        </a>

        <nav className="topnav" aria-label="Section navigation">
          <a href="#status">Status</a>
          <a href="#outstanding">Outstanding</a>
          <a href="#plan">Plan</a>
          <a href="#timeline">Timeline</a>
          <a href="#system">System</a>
          <a href="#offer">Offer</a>
        </nav>

        <div className="topbar-actions">
          <button
            className="nav-pill nav-pill-teal nav-pill-button"
            onClick={openProjectChat}
            type="button"
          >
            <span className="pill-dot" />
            Ask AI
          </button>
          <a className="nav-pill nav-pill-gold" href="#status">
            <span className="pill-dot" />
            At Risk · 3 Blockers
          </a>
        </div>
      </header>
      <section className="status-section page-section" id="status">
        <div className="section-header section-header-inline">
          <div>
            <p className="section-kicker">Live Status · Client Dashboard</p>
            <h2>Where the project stands, right now.</h2>
          </div>
          <span className="updated-stamp">Updated today · 28 Jun 2026</span>
        </div>

        <div className="status-grid">
          {statusCards.map((card) => (
            <article className={`status-card status-${card.tone}`} key={card.label}>
              <div className="status-card-top">
                <p>{card.label}</p>
                {card.badge ? <span className="inline-badge">{card.badge}</span> : null}
              </div>

              <div className="status-card-body">
                <div className="status-title-row">
                  <h3>{card.title}</h3>
                  {card.meta ? <span>{card.meta}</span> : null}
                  {card.progress ? <span>{card.progress}</span> : null}
                </div>

                {card.detail ? <p>{card.detail}</p> : null}

                {card.bullets ? (
                  <ul className="status-bullets">
                    {card.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}

                {card.next ? (
                  <>
                    <div className="progress-bar">
                      <span style={{ width: "40%" }} />
                    </div>
                    <div className="status-footer">
                      <span>{card.next}</span>
                      <span>{card.eta}</span>
                    </div>
                  </>
                ) : null}

                {card.label === "Project Health" ? (
                  <div className="health-legend">
                    <span className="legend legend-teal">On Track</span>
                    <span className="legend legend-gold">At Risk</span>
                    <span className="legend legend-red">Blocked</span>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <div className="summary-metric-grid">
          {summaryMetrics.map((metric) => (
            <article className={`summary-card summary-${metric.tone}`} key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>{metric.detail}</span>
            </article>
          ))}
        </div>

        <div className="pipeline-wrap">
          <p className="pipeline-label">Delivery Pipeline</p>
          <div className="pipeline-row">
            {deliveryPipeline.map((stage) => (
              <div className={`pipeline-step pipeline-${stage.status}`} key={stage.label}>
                <span className="pipeline-bullet" />
                <span>{stage.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hero-panel hero-followup">
        <p className="section-kicker centered">Shared Client Dashboard · Strategize × RT Digital</p>
        <h1>
          Clarify the offer, shape the campaign, and move trade owners from ad
          click to booked consult.
        </h1>

        <div className="hero-buttons">
          <a className="button-primary" href="#plan">
            Open Working Plan
          </a>
          <button className="button-secondary hero-button" onClick={openProjectChat} type="button">
            Ask AI Chat
          </button>
          <a className="button-secondary" href="#system">
            View System Map
          </a>
        </div>

        <div className="hero-facts" aria-label="Pilot summary facts">
          {heroFacts.map((fact) => (
            <div className={`fact-pill fact-${fact.tone}`} key={`followup-${fact.label}`}>
              <strong>{fact.value}</strong>
              <span>{fact.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="outstanding-section page-section" id="outstanding">
        <div className="section-header">
          <p className="section-kicker">Outstanding</p>
          <h2>What&apos;s blocking, and who&apos;s holding it.</h2>
        </div>

        <div className="outstanding-grid">
          {outstandingColumns.map((column) => (
            <article className={`outstanding-column tone-${column.tone}`} key={column.title}>
              <div className="outstanding-column-head">
                <h3>{column.title}</h3>
                <span>{column.count}</span>
              </div>

              <div className="outstanding-list">
                {column.items.map((item) => (
                  <article className="outstanding-card" key={item.title}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <div className="outstanding-meta">
                      <span className="owner-badge">{item.initials}</span>
                      <span>{item.owner}</span>
                      <span>{item.age}</span>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="working-plan-section page-section" id="plan">
        <div className="section-header section-header-split">
          <div>
            <p className="section-kicker">Working Plan</p>
            <h2>What happens next, and who owns what.</h2>
          </div>
          <span className="section-pill">Working Draft Checklist</span>
        </div>

        <div className="task-grid">
          {(["chris", "jesse"] as TaskOwner[]).map((owner) => {
            const items = taskGroups[owner];
            const complete = items.filter((item) => item.completed).length;

            return (
              <article className="task-panel" key={owner}>
                <div className="task-panel-head">
                  <h3>{owner === "chris" ? "Chris action items" : "Jesse action items"}</h3>
                  <span>
                    {complete}/{items.length} complete
                  </span>
                </div>

                <div className="task-list">
                  {items.map((item) => (
                    <label
                      className={`task-row ${item.completed ? "task-complete" : ""}`}
                      key={item.id}
                    >
                      <input
                        checked={item.completed}
                        onChange={() => toggleTask(item.id)}
                        type="checkbox"
                      />
                      <span className="checkbox-ui" aria-hidden="true" />
                      <span className="task-copy">
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="timeline-section page-section" id="timeline">
        <div className="section-header">
          <p className="section-kicker">Timeline</p>
          <h2>From kickoff to launch.</h2>
        </div>

        <div className="timeline-rail">
          {timelineStages.map((stage) => (
            <article className={`timeline-node timeline-${stage.status}`} key={stage.title}>
              <span className="timeline-dot" />
              <p>{stage.date}</p>
              <h3>{stage.title}</h3>
              <span>{stage.detail}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="movement-section page-section">
        <div className="movement-grid">
          <article>
            <div className="section-header">
              <p className="section-kicker">Decisions Log</p>
              <h2>What we&apos;ve locked.</h2>
            </div>

            <div className="decision-list">
              {decisions.map((decision) => (
                <article className="decision-item" key={`${decision.date}-${decision.text}`}>
                  <span className="decision-dot" />
                  <div>
                    <p>{decision.date}</p>
                    <h3>{decision.text}</h3>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article>
            <div className="section-header">
              <p className="section-kicker section-kicker-gold">What Changed This Week</p>
              <h2>Latest movement.</h2>
            </div>

            <div className="movement-list">
              {latestMovement.map((item) => (
                <article className={`movement-card movement-${item.tone}`} key={item.text}>
                  <span className="movement-dot" />
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="system-section page-section" id="system">
        <div className="section-header">
          <p className="section-kicker">System Map</p>
          <h2>Lead to booked consult.</h2>
        </div>

        <div className="system-grid">
          {systemSteps.map((step) => (
            <article className="system-card" key={step.id}>
              <span className={`system-index system-${step.tone}`}>{step.id}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="offer-section page-section" id="offer">
        <div className="offer-layout">
          <article className="offer-copy">
            <p className="section-kicker">Offer Lab</p>
            <h2>The campaign should sell the size of the hidden gap.</h2>
            <p className="offer-body">
              Chris already has the conversion asset: a benchmark process that compares a
              business to its category and makes profit leakage tangible. The creative job
              is to compress that moment for Meta - without giving away the proprietary
              numbers.
            </p>
          </article>

          <article className="territory-panel">
            <div className="territory-head">
              <span>Creative Territory</span>
              <strong>Gap Analysis Teaser</strong>
            </div>
            <div className="territory-row territory-hot">
              <span>Productivity per person</span>
              <strong>$200K missing</strong>
            </div>
            <div className="territory-row">
              <span>Wage ratio</span>
              <strong>$116K over line</strong>
            </div>
            <div className="territory-row">
              <span>Marketing spend</span>
              <strong>$64K above benchmark</strong>
            </div>
            <div className="territory-quote">
              <p>
                &ldquo;Most owners know they&apos;re busy. Fewer know whether they&apos;re first,
                last, or in the middle. A simple benchmark shows the gap in dollars.&rdquo;
              </p>
            </div>
          </article>
        </div>
      </section>

      <ProjectChat />
    </main>
  );
}
