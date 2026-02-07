import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GetStaticProps } from "next";
import StripeSubscriptionCheckout from "../components/StripeSubscriptionCheckout";
import { trackEvent } from "../src/lib/analytics";

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(
  /\/api\/?$/,
  "",
);

type Plan = {
  key: string;
  label: string;
  priceId?: string;
};

type PricingProps = {
  initialPlans: Plan[];
  initialConfigured: boolean;
};

const planCopy = [
  {
    key: "operator",
    name: "Operator",
    price: "$19/seat",
    cadence: "per month",
    description: "Ideal for lean operator teams.",
    features: [
      "Seat-based access",
      "Company-level billing",
      "RBAC + audit logs",
      "AI governance controls",
    ],
    metered: "100 AI actions included • $0.01/action overage",
  },
  {
    key: "fleet",
    name: "Fleet",
    price: "$49/seat",
    cadence: "per month",
    description: "For growing fleets running daily ops.",
    features: [
      "500 AI actions included",
      "AI usage alerts + hard cap",
      "Billing kill-switches",
      "Feature flag controls",
    ],
    metered: "500 AI actions included • $0.008/action overage",
    featured: true,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "$149+/seat",
    cadence: "invoice-first",
    description: "Enterprise invoicing with custom terms.",
    features: [
      "2,000 AI actions included",
      "SSO + compliance controls",
      "Priority onboarding",
      "Dedicated success",
    ],
    metered: "2,000 AI actions included • $0.005/action overage",
  },
];

export default function Pricing({ initialPlans, initialConfigured }: PricingProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans || []);
  const [configured, setConfigured] = useState(initialConfigured || false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [seats, setSeats] = useState<number>(5);
  const [addOns, setAddOns] = useState<string[]>([]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string>("");

  // Client-side refresh (optional, for real-time updates)
  useEffect(() => {
    fetch(`${apiBase}/api/stripe/plans`)
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.plans || []);
        setConfigured(!!d.configured);
      })
      .catch(() => setErr("Failed to load plans"));
  }, []);

  useEffect(() => {
    trackEvent("pricing_view");
  }, []);

  const availablePlanKeys = new Set(plans.map((plan) => plan.key));

  async function checkout(planKey: string) {
    trackEvent("pricing_checkout", { plan: planKey });
    setBusy(planKey);
    setErr(null);
    setClientSecret(null);
    setActivePlan(planKey);
    try {
      // Use dev token if no auth yet
      const token = localStorage.getItem("genesisToken") || "dev-token";
      const res = await fetch(`${apiBase}/api/stripe/subscription`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-id": "demo-user",
        },
        body: JSON.stringify({
          plan: planKey,
          seats,
          addOns,
          tenantId: "demo-tenant",
          customerEmail: customerEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Checkout failed");
      if (!data.clientSecret) {
        throw new Error("Stripe client secret missing.");
      }
      setClientSecret(data.clientSecret);
    } catch (e: any) {
      setErr(e?.message ?? "Checkout failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="section-subtitle">Pricing</p>
            <h1 className="hero-title">Three tiers. One enterprise stack.</h1>
            <p className="hero-copy">
              Company-level billing, RBAC, audit logs, and AI governance with metered usage, alerts,
              and hard caps.
            </p>
          </div>
          <div className="hero-card">
            <h3>Metered transparency</h3>
            <p>
              AI calls, tracking events, and invoices are metered and visible in every billing
              summary.
            </p>
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label">AI actions</div>
                <div className="metric-value">Metered</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Tracking events</div>
                <div className="metric-value">Metered</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Invoices</div>
                <div className="metric-value">Metered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Plans</h2>
          <p className="section-subtitle">
            Choose a plan, seat count, and optional add-ons. Stripe checkout is enabled when billing
            is configured.
          </p>
          {err ? (
            <div className="status-message error" style={{ marginTop: "16px" }}>
              <strong>Error:</strong> {err}
            </div>
          ) : null}

          <div className="pricing-grid" style={{ marginTop: "24px" }}>
            {planCopy.map((tier) => (
              <section
                key={tier.key}
                className={`card pricing-card${tier.featured ? " is-featured" : ""}`}
              >
                {tier.featured ? <span className="pricing-badge">Most chosen</span> : null}
                <h3>{tier.name}</h3>
                <p className="pricing-meta">{tier.description}</p>
                <div className="metric-value" style={{ fontSize: "2rem" }}>
                  {tier.price}
                </div>
                <div className="pricing-meta">{tier.cadence}</div>
                <div className="pricing-list">
                  {tier.features.map((feature) => (
                    <div key={feature}>• {feature}</div>
                  ))}
                </div>
                <div className="metered">Metered: {tier.metered}</div>
                {tier.key === "enterprise" ? (
                  <Link href="/dashboard/billing" className="btn btn-secondary">
                    Request invoice
                  </Link>
                ) : (
                  <button
                    onClick={() => checkout(tier.key)}
                    disabled={
                      busy === tier.key ||
                      (availablePlanKeys.size > 0 && !availablePlanKeys.has(tier.key))
                    }
                    className={`btn ${tier.featured ? "btn-primary" : "btn-secondary"}`}
                    aria-disabled={
                      busy === tier.key ||
                      (availablePlanKeys.size > 0 && !availablePlanKeys.has(tier.key))
                    }
                  >
                    {busy === tier.key ? "Preparing..." : "Start plan"}
                  </button>
                )}
                {busy === tier.key ? (
                  <div className="helper-text">Creating checkout session…</div>
                ) : null}
                {tier.key !== "enterprise" &&
                availablePlanKeys.size > 0 &&
                !availablePlanKeys.has(tier.key) ? (
                  <div className="helper-text">Unavailable in current billing setup.</div>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card">
            <h2 className="section-title">Intelligence Add-On — $299/mo</h2>
            <p className="section-subtitle">
              Weather disruption modeling, delay prediction, and route risk scoring.
            </p>
            <div className="helper-text">Enabled by feature flag and billing state.</div>
            <div style={{ marginTop: "16px" }}>
              <Link
                href="/dashboard/billing"
                className="btn btn-primary"
                onClick={() => trackEvent("pricing_intelligence_addon_cta_clicked")}
              >
                Manage Intelligence Add-On in billing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Billing setup</h2>
          <p className="section-subtitle">
            Use the configuration panel to match seats, add-ons, and billing email before checkout.
          </p>
          <div className="card" style={{ marginTop: "24px" }}>
            <div className="form-grid">
              <div className="form-control">
                <label htmlFor="seat-count">Seat count</label>
                <input
                  id="seat-count"
                  type="number"
                  min={1}
                  max={500}
                  value={seats}
                  onChange={(event) => setSeats(Number(event.target.value))}
                />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Add-ons</div>
                <label className="form-control" style={{ marginTop: "8px" }}>
                  <span>
                    <input
                      type="checkbox"
                      checked={addOns.includes("voice")}
                      onChange={(event) => {
                        setAddOns((prev) =>
                          event.target.checked
                            ? [...prev, "voice"]
                            : prev.filter((item) => item !== "voice"),
                        );
                      }}
                    />{" "}
                    Voice commands (per seat)
                  </span>
                </label>
                <label className="form-control">
                  <span>
                    <input
                      type="checkbox"
                      checked={addOns.includes("white_label")}
                      onChange={(event) => {
                        setAddOns((prev) =>
                          event.target.checked
                            ? [...prev, "white_label"]
                            : prev.filter((item) => item !== "white_label"),
                        );
                      }}
                    />{" "}
                    White-label (flat)
                  </span>
                </label>
                <label className="form-control">
                  <span>
                    <input
                      type="checkbox"
                      checked={addOns.includes("analytics_export")}
                      onChange={(event) => {
                        setAddOns((prev) =>
                          event.target.checked
                            ? [...prev, "analytics_export"]
                            : prev.filter((item) => item !== "analytics_export"),
                        );
                      }}
                    />{" "}
                    Analytics export (flat)
                  </span>
                </label>
                <label className="form-control">
                  <span>
                    <input
                      type="checkbox"
                      checked={addOns.includes("intelligence")}
                      onChange={(event) => {
                        setAddOns((prev) =>
                          event.target.checked
                            ? [...prev, "intelligence"]
                            : prev.filter((item) => item !== "intelligence"),
                        );
                      }}
                    />{" "}
                    Intelligence add-on ($299/mo)
                  </span>
                </label>
                <div className="helper-text">
                  AI actions are metered and billed monthly when enabled.
                </div>
              </div>
              <div className="form-control">
                <label htmlFor="billing-email">Billing email</label>
                <input
                  id="billing-email"
                  type="email"
                  placeholder="billing@yourcompany.com"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="helper-text" style={{ marginTop: "12px" }}>
            Stripe configured: <strong>{configured ? "YES" : "NO"}</strong> •{" "}
            <Link href="/account/billing">Manage Billing</Link>
          </div>
        </div>
      </section>

      {clientSecret ? (
        <section className="section">
          <div className="container">
            <div className="card">
              <h2 className="section-title">Complete your subscription</h2>
              <p className="section-subtitle">
                Selected plan: <strong>{activePlan ? activePlan : "custom"}</strong>
              </p>
              <StripeSubscriptionCheckout clientSecret={clientSecret} />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

/**
 * ISR (Incremental Static Regeneration)
 * - Page is pre-rendered at build time
 * - Revalidates every 60 seconds
 * - Serves stale content while regenerating
 */
export const getStaticProps: GetStaticProps = async () => {
  try {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(
      /\/api\/?$/,
      "",
    );
    const res = await fetch(`${apiUrl}/api/stripe/plans`, {
      headers: { "User-Agent": "Next.js-ISR" },
    });

    if (!res.ok) {
      throw new Error(`API responded with ${res.status}`);
    }

    const data = await res.json();

    return {
      props: {
        initialPlans: data.plans || [],
        initialConfigured: !!data.configured,
      },
      // Revalidate every 60 seconds (ISR)
      revalidate: 60,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("ISR: Failed to fetch plans, using fallback", error);

    // Fallback to empty state on error
    return {
      props: {
        initialPlans: [],
        initialConfigured: false,
      },
      revalidate: 60,
    };
  }
};
