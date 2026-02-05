import Head from "next/head";
import Link from "next/link";

const used = 120;
const included = 500;
const pct = Math.round((used / included) * 100);

export default function UsagePage() {
  return (
    <>
      <Head>
        <title>AI Usage - Infamous Freight</title>
      </Head>
      <div className="page">
        <section className="hero">
          <div className="container hero-inner">
            <div>
              <p className="section-subtitle">AI Governance</p>
              <h1 className="hero-title">AI Usage</h1>
              <p className="hero-copy">
                Alerts trigger at 80%. Hard caps enforce at 200% of included usage for the billing
                cycle.
              </p>
              <div className="hero-actions">
                <Link href="/dashboard" className="btn btn-secondary">
                  Back to Dashboard
                </Link>
                <Link href="/dashboard/billing" className="btn btn-primary">
                  Billing State
                </Link>
              </div>
            </div>
            <div className="hero-card">
              <h3>This month</h3>
              <div className="metric-value" style={{ fontSize: "2rem" }}>
                {used} / {included}
              </div>
              <div className="helper-text">{pct}% used</div>
              <div
                className="progress-bar"
                style={{
                  marginTop: "16px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "999px",
                  overflow: "hidden",
                  height: "10px",
                }}
              >
                <div
                  style={{
                    height: "10px",
                    width: `${Math.min(100, pct)}%`,
                    background: "#111",
                  }}
                />
              </div>
              <div className="helper-text" style={{ marginTop: "12px" }}>
                Server enforces billing + feature flags + usage cap.
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
