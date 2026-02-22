import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "../src/lib/analytics";

const highlights = [
  {
    title: "Genesis AI Dispatch",
    description: "Autonomous matching, routing, and exception handling with transparent reasoning.",
  },
  {
    title: "Fleet Control Center",
    description: "Live availability, driver performance, and on-time risk signals in one view.",
  },
  {
    title: "Billing + Insurance Engine",
    description: "Auto-invoicing, metered AI usage, and embedded coverage for every load.",
  },
];

const capabilities = [
  "Command palette for one-click operational moves",
  "KPI stat cards with deltas and alerts",
  "Audit logs + RBAC for regulated fleets",
  "Genesis recommendations with Impact + Confidence",
];

export default function ProductPage(): React.ReactElement {
  useEffect(() => {
    trackEvent("product_view");
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="section-subtitle">Product</p>
            <h1 className="hero-title">One operational stack for every freight decision.</h1>
            <p className="hero-copy">
              Infæmous Freight Enterprise connects dispatch, fleet, billing, and insurance into a
              single AI-native operating system.
            </p>
            <div className="hero-actions">
              <Link
                href="/signup"
                className="btn btn-primary"
                onClick={() => trackEvent("product_start_free")}
              >
                Start Free
              </Link>
              <Link href="/pricing" className="btn btn-secondary">
                View pricing
              </Link>
            </div>
          </div>
          <div className="hero-card">
            <h3>Genesis Command</h3>
            <p>
              Execute structured actions with reasoning summaries, confidence scores, and auditable
              trails.
            </p>
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label">Confidence</div>
                <div className="metric-value">94</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Margin Impact</div>
                <div className="metric-value">+12%</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Risk Reduced</div>
                <div className="metric-value">-18%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Core capabilities</h2>
          <p className="section-subtitle">
            Designed for operations leaders who need speed, transparency, and control at every
            layer.
          </p>
          <div className="grid grid-3" style={{ marginTop: "24px" }}>
            {highlights.map((item) => (
              <div key={item.title} className="card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
          <div className="grid" style={{ marginTop: "32px" }}>
            {capabilities.map((item) => (
              <div key={item} className="card">
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container callout">
          <h2 className="section-title">Ready to activate Genesis?</h2>
          <p className="section-subtitle">
            Get a personalized demo with your routes, fleet, and billing flows.
          </p>
          <div className="hero-actions" style={{ marginTop: "24px" }}>
            <Link href="/login" className="btn btn-secondary">
              Request Demo
            </Link>
            <Link href="/signup" className="btn btn-primary">
              Start Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
