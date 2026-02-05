import Head from "next/head";
import Link from "next/link";

export default function BillingPage() {
  return (
    <>
      <Head>
        <title>Billing State - Infamous Freight</title>
      </Head>
      <div className="page">
        <section className="hero">
          <div className="container hero-inner">
            <div>
              <p className="section-subtitle">Billing Governance</p>
              <h1 className="hero-title">Billing State</h1>
              <p className="hero-copy">
                Billing status is authoritative via Stripe webhooks. Active subscriptions unlock AI
                automation; past due pauses automation.
              </p>
              <div className="hero-actions">
                <Link href="/dashboard" className="btn btn-secondary">
                  Back to Dashboard
                </Link>
                <Link href="/pricing" className="btn btn-primary">
                  View Pricing
                </Link>
              </div>
            </div>
            <div className="hero-card">
              <h3>Enterprise invoicing</h3>
              <p>
                Invoice-first billing with kill-switch enforcement. Gate self-serve checkout behind
                the <code>enable_checkout</code> feature flag.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
