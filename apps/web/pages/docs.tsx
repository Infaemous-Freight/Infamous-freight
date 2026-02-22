import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "../src/lib/analytics";

const docsSections = [
  "Genesis AI command palette",
  "Dispatch + fleet workflows",
  "Billing + insurance integrations",
  "Security and audit logging",
];

export default function DocsPage(): React.ReactElement {
  useEffect(() => {
    trackEvent("docs_view");
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="section-subtitle">Docs</p>
            <h1 className="hero-title">Operator docs, not fluff.</h1>
            <p className="hero-copy">
              Everything needed to configure Genesis, onboard teams, and keep audits clean.
            </p>
            <div className="hero-actions">
              <Link href="/pricing" className="btn btn-secondary">
                View pricing
              </Link>
              <Link
                href="/signup"
                className="btn btn-primary"
                onClick={() => trackEvent("docs_start_free")}
              >
                Start Free
              </Link>
            </div>
          </div>
          <div className="hero-card">
            <h3>Documentation map</h3>
            <div className="pricing-list">
              {docsSections.map((item) => (
                <div key={item}>• {item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
