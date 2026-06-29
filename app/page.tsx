"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

const revenueBands = [
  { label: "Under $500K", value: "under-500", score: 0, note: "Low priority fit" },
  { label: "$500K-$1M", value: "500-1m", score: 1, note: "Worth checking" },
  { label: "$1M-$2M", value: "1m-2m", score: 3, note: "Core fit" },
  { label: "$2M+", value: "2m-plus", score: 4, note: "Ideal fit" },
];

const staffBands = [
  { label: "1-2", value: "1-2", score: 0 },
  { label: "3-4", value: "3-4", score: 1 },
  { label: "5-10", value: "5-10", score: 3 },
  { label: "11+", value: "11-plus", score: 4 },
];

function getResult(revenue: string, staff: string, hasCoach: string) {
  const revenueScore = revenueBands.find((band) => band.value === revenue)?.score ?? 0;
  const staffScore = staffBands.find((band) => band.value === staff)?.score ?? 0;

  if (hasCoach === "yes") {
    return {
      label: "Not the right fit right now",
      detail:
        "If you already have a business coach, Strategize usually recommends taking this conversation back to your current advisor.",
      score: "Review",
    };
  }

  if (revenueScore + staffScore >= 6) {
    return {
      label: "Strong fit for a savings review",
      detail:
        "You look like the type of established business where revenue leakage, staffing costs, and missed buying-group savings can add up quickly.",
      score: "High fit",
    };
  }

  if (revenueScore + staffScore >= 3) {
    return {
      label: "Possible fit",
      detail:
        "There may still be useful savings or missed revenue to uncover. A strategist can check whether the numbers justify a deeper review.",
      score: "Medium fit",
    };
  }

  return {
    label: "Early stage",
    detail:
      "The review may be less valuable until the business has more revenue, staff, or operating complexity.",
    score: "Low fit",
  };
}

export default function Home() {
  const [revenue, setRevenue] = useState("1m-2m");
  const [staff, setStaff] = useState("5-10");
  const [hasCoach, setHasCoach] = useState("no");

  const result = useMemo(
    () => getResult(revenue, staff, hasCoach),
    [revenue, staff, hasCoach],
  );

  return (
    <main className="funnel-page">
      <header className="landing-header">
        <Image
          alt="Strategize"
          height={96}
          priority
          src="/strategize-transparent.png"
          width={300}
        />
        <a href="#check">Check my numbers</a>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Free business savings check</p>
          <h1>Could your business be missing revenue or overpaying quietly?</h1>
          <p className="hero-intro">
            Answer three quick questions to see whether a Strategize advisor should review
            your revenue, staffing, and savings opportunities.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#check">Start the check</a>
            <span>Takes less than 60 seconds</span>
          </div>
        </div>

        <div className="result-preview" aria-label="Savings review preview">
          <span>Common review areas</span>
          <div>
            <strong>Revenue leakage</strong>
            <p>Underpriced work, weak conversion, or low output per person.</p>
          </div>
          <div>
            <strong>Cost pressure</strong>
            <p>Wage ratios, supplier terms, and missed buying-group savings.</p>
          </div>
          <div>
            <strong>Follow-up plan</strong>
            <p>Qualified businesses are passed to a local strategist.</p>
          </div>
        </div>
      </section>

      <section className="calculator-section" id="check">
        <div className="section-heading">
          <p>Quick calculator</p>
          <h2>Find out if a savings review is worth a conversation.</h2>
        </div>

        <div className="calculator-grid">
          <form className="calculator-card">
            <fieldset>
              <legend>Annual revenue</legend>
              <div className="option-grid">
                {revenueBands.map((band) => (
                  <label key={band.value} className={revenue === band.value ? "selected" : ""}>
                    <input
                      checked={revenue === band.value}
                      name="revenue"
                      onChange={() => setRevenue(band.value)}
                      type="radio"
                    />
                    <span>{band.label}</span>
                    <small>{band.note}</small>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>How many staff do you have?</legend>
              <div className="segmented">
                {staffBands.map((band) => (
                  <button
                    className={staff === band.value ? "active" : ""}
                    key={band.value}
                    onClick={() => setStaff(band.value)}
                    type="button"
                  >
                    {band.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Are you currently working with a business coach?</legend>
              <div className="coach-toggle">
                <button
                  className={hasCoach === "no" ? "active" : ""}
                  onClick={() => setHasCoach("no")}
                  type="button"
                >
                  No
                </button>
                <button
                  className={hasCoach === "yes" ? "active" : ""}
                  onClick={() => setHasCoach("yes")}
                  type="button"
                >
                  Yes
                </button>
              </div>
            </fieldset>
          </form>

          <aside className="score-card">
            <p>Your result</p>
            <strong>{result.score}</strong>
            <h3>{result.label}</h3>
            <span>{result.detail}</span>

            <div className="lead-form" aria-label="Lead details">
              <label>
                Name
                <input placeholder="Your name" />
              </label>
              <label>
                Phone
                <input placeholder="Best contact number" />
              </label>
              <label>
                Email
                <input placeholder="you@example.co.nz" />
              </label>
              <label>
                Location
                <input placeholder="City or region" />
              </label>
              <button type="button">Request my review</button>
            </div>
          </aside>
        </div>
      </section>

      <section className="trust-section">
        <div>
          <p>What happens next</p>
          <h2>No long questionnaire. No generic report.</h2>
        </div>
        <ul>
          <li>A local strategist checks whether you meet the review criteria.</li>
          <li>Qualified businesses are contacted by phone or email for follow-up.</li>
          <li>If you already have a coach, you will not be pushed into a duplicate process.</li>
        </ul>
      </section>
    </main>
  );
}
