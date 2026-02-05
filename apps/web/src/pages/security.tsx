import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "../src/lib/analytics";

const securityPoints = [
  {
    title: "SOC2-lite posture",
    detail: "Security-first infrastructure with audit-ready controls and operational transparency.",
  },
  {
    title: "Role-based access",
    detail: "RBAC with scoped permissions and change tracking.",
  },
  {
    title: "Audit logs",
    detail: "Full trail of Genesis recommendations, approvals, and actions.",
  },
  {
    title: "Billing security",
    detail: "Stripe-secure billing with metered usage visibility.",
  },
];

export default function SecurityPage() {
  useEffect(() => {
    trackEvent("security_view");
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="section-subtitle">Security</p>
            <h1 className="hero-title">Security that earns enterprise trust.</h1>
            <p className="hero-copy">
              Infæmous Freight Enterprise delivers a SOC2-lite readiness posture with audit trails,
              RBAC, and data visibility across operations.
            </p>
            <div className="hero-actions">
              <Link href="/docs" className="btn btn-tertiary">
                View docs
              </Link>
              <Link href="/login" className="btn btn-secondary">
                Request Demo
              </Link>
            </div>
          </div>
          <div className="hero-card">
            <h3>Security Signals</h3>
            <p>Continuous monitoring keeps risk transparent and actionable.</p>
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label">Audit logs</div>
                <div className="metric-value">Always on</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Uptime target</div>
                <div className="metric-value">99.9%</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">RBAC coverage</div>
                <div className="metric-value">Full</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Controls & safeguards</h2>
          <p className="section-subtitle">
            Everything Genesis does remains visible, reviewable, and exportable.
          </p>
          <div className="grid grid-3" style={{ marginTop: "24px" }}>
            {securityPoints.map((point) => (
              <div key={point.title} className="card">
                <h3>{point.title}</h3>
                <p>{point.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container callout">
          <h2 className="section-title">Need a security review?</h2>
          <p className="section-subtitle">
            Share your questionnaire and the team will respond with governance documentation,
            policies, and audit mappings.
          </p>
          <div className="hero-actions" style={{ marginTop: "24px" }}>
            <Link href="/login" className="btn btn-secondary">
              Request Demo
            </Link>
            <Link
              href="/signup"
              className="btn btn-primary"
              onClick={() => trackEvent("security_start_free")}
            >
              Start Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
