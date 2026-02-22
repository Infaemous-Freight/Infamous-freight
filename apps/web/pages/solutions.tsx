import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "../src/lib/analytics";

const solutionBlocks = [
  {
    title: "Dispatch",
    description: "Suggested match and reroute decisions with Genesis AI confidence and impact.",
    bullets: [
      "Map + list view for full coverage",
      "One-click assign, reroute, message driver",
      "AI-driven exception triage",
    ],
  },
  {
    title: "Fleet",
    description: "Live availability, health, and safety monitoring without noisy dashboards.",
    bullets: [
      "Driver status pills and readiness",
      "Maintenance visibility",
      "Predictive utilization planning",
    ],
  },
  {
    title: "Billing",
    description: "Auto-invoicing, disputes queue, and Stripe metering summary in one view.",
    bullets: [
      "Time-to-invoice acceleration",
      "Exception handling workflows",
      "Revenue tracking across teams",
    ],
  },
  {
    title: "Insurance",
    description: "Transparent coverage workflows with step-based claims and risk scoring.",
    bullets: [
      "Coverage status at load level",
      "Claims workflow stepper",
      "Explainable risk scoring",
    ],
  },
];

export default function SolutionsPage(): React.ReactElement {
  useEffect(() => {
    trackEvent("solutions_view");
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="section-subtitle">Solutions</p>
            <h1 className="hero-title">Every operations team, unified.</h1>
            <p className="hero-copy">
              Dispatch, fleet, billing, and insurance all run on the same intelligence layer—Genesis
              AI.
            </p>
            <div className="hero-actions">
              <Link href="/pricing" className="btn btn-secondary">
                View pricing
              </Link>
              <Link
                href="/signup"
                className="btn btn-primary"
                onClick={() => trackEvent("solutions_start_free")}
              >
                Start Free
              </Link>
            </div>
          </div>
          <div className="hero-card">
            <h3>Genesis Recommendations</h3>
            <p>
              Every suggestion ships with reasoning, impact, and action buttons that keep operators
              in control.
            </p>
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label">Loads at risk</div>
                <div className="metric-value">7</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Recommended actions</div>
                <div className="metric-value">14</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Potential savings</div>
                <div className="metric-value">$18k</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Solutions by function</h2>
          <p className="section-subtitle">
            Purpose-built modules that still share one system of record.
          </p>
          <div className="grid grid-3" style={{ marginTop: "24px" }}>
            {solutionBlocks.map((block) => (
              <div key={block.title} className="card">
                <h3>{block.title}</h3>
                <p>{block.description}</p>
                <div className="pricing-list">
                  {block.bullets.map((bullet) => (
                    <div key={bullet}>• {bullet}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
