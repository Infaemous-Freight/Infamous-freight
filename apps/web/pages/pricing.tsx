import React from "react";
import { BILLING } from "@/config/billing";
import { Badge } from "@/components/pricing/Badge";
import { PricingButton } from "@/components/pricing/PricingButton";

function annualPrice(monthly: number) {
  const discounted = monthly * (1 - BILLING.annualDiscountPct / 100);
  return Math.round(discounted * 100) / 100;
}

export default function PricingPage() {
  const tiers = BILLING.tiers;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2">
            <Badge>Infæmous Freight</Badge>
            <Badge>AI Monetization Ready</Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tight">AI-Powered Freight Operations</h1>
          <p className="mt-3 max-w-2xl text-white/70">
            Seat subscriptions + usage-based AI billing + enterprise invoicing — built for dispatch,
            fleets, and logistics automation.
          </p>

          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2">
            <div className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">
              Monthly
            </div>
            <div className="px-4 py-2 text-sm text-white/70">
              Annual{" "}
              <span className="ml-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">
                Save {BILLING.annualDiscountPct}%
              </span>
            </div>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <TierCard
            name={tiers.operator.name}
            priceMonthly={tiers.operator.priceMonthly}
            aiIncluded={tiers.operator.aiIncluded}
            aiOverage={tiers.operator.aiOverage}
            bullets={tiers.operator.bullets}
            ctaHref={tiers.operator.stripeLink}
            ctaLabel="Start Operating"
          />

          <TierCard
            name={tiers.fleet.name}
            priceMonthly={tiers.fleet.priceMonthly}
            aiIncluded={tiers.fleet.aiIncluded}
            aiOverage={tiers.fleet.aiOverage}
            bullets={tiers.fleet.bullets}
            ctaHref={tiers.fleet.stripeLink}
            ctaLabel="Run Your Fleet"
            mostPopular
          />

          <EnterpriseCard />
        </div>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black">AI usage model (transparent)</h2>
          <p className="mt-2 text-white/70">
            Includes a monthly AI action allowance. Overage is billed automatically. Alerts at 80%.
            Hard cap at 200% unless upgraded.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ComparisonBox
              label="Operator included"
              value={`${tiers.operator.aiIncluded} actions`}
            />
            <ComparisonBox label="Fleet included" value={`${tiers.fleet.aiIncluded} actions`} />
            <ComparisonBox
              label="Enterprise included"
              value={`${tiers.enterprise.aiIncluded} actions`}
            />
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{BILLING.addOns.intelligence.name}</h2>
              <Badge>$299/mo</Badge>
            </div>
            <p className="mt-2 text-white/70">
              Premium operational intelligence layer for risk, delay prediction, and routing
              signals.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-white/80">
              {BILLING.addOns.intelligence.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="text-white/60">•</span> {bullet}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <PricingButton href="/contact-sales" variant="secondary">
                Add to Fleet / Enterprise
              </PricingButton>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-xl font-black">Enterprise billing (invoice-first)</h2>
            <p className="mt-2 text-white/70">
              Contract + Stripe invoices (ACH preferred). Optional onboarding fee. Minimum monthly
              spend applies.
            </p>
            <div className="mt-6 grid gap-3">
              <PricingButton href="/contact-sales">Contact Sales</PricingButton>
              <PricingButton href={tiers.enterprise.stripeMinimumSpendLink} variant="secondary">
                (Internal) Minimum Spend Link
              </PricingButton>
            </div>
            <div className="mt-5 text-xs text-white/60">
              Note: Enterprise is intentionally not self-serve.
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black">FAQ</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 text-sm">
            <FAQ
              q="What is an AI action?"
              a="A billable AI operation: dispatch decision, route optimization, report generation, coaching summary, etc."
            />
            <FAQ
              q="Do you warn before overages?"
              a="Yes—alerts trigger at 80% usage in the dashboard + email/SMS if enabled."
            />
            <FAQ
              q="What happens at the hard cap?"
              a="AI automation pauses at 200% of included usage unless you upgrade or approve higher limits."
            />
            <FAQ
              q="How does Enterprise billing work?"
              a="Invoice-first with contract terms. ACH preferred. You can still attach usage billing."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function TierCard(props: {
  name: string;
  priceMonthly: number;
  aiIncluded: number;
  aiOverage: number;
  bullets: string[];
  ctaHref: string;
  ctaLabel: string;
  mostPopular?: boolean;
}) {
  const { name, priceMonthly, aiIncluded, aiOverage, bullets, ctaHref, ctaLabel, mostPopular } =
    props;

  return (
    <div
      className={`rounded-3xl border ${
        mostPopular ? "border-white/25" : "border-white/10"
      } bg-white/5 p-8`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black">{name}</h3>
        {mostPopular ? <Badge>Most Popular</Badge> : null}
      </div>

      <div className="mt-4">
        <div className="text-4xl font-black">
          ${priceMonthly}
          <span className="text-base font-semibold text-white/60">/seat</span>
        </div>
        <div className="mt-1 text-xs text-white/60">
          Annual equivalent: ${annualPrice(priceMonthly)}/seat (-
          {BILLING.annualDiscountPct}%)
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="text-xs text-white/60">AI allowance</div>
        <div className="mt-1 text-sm font-semibold">
          {aiIncluded.toLocaleString()} actions included
        </div>
        <div className="mt-1 text-xs text-white/70">
          Overage: ${aiOverage.toFixed(3)}/action • Alert: 80% • Hard cap: 200%
        </div>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-white/80">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span className="text-white/60">•</span> {bullet}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <PricingButton href={ctaHref}>{ctaLabel}</PricingButton>
      </div>
    </div>
  );
}

function EnterpriseCard() {
  const tier = BILLING.tiers.enterprise;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black">{tier.name}</h3>
        <Badge>Invoice-First</Badge>
      </div>

      <div className="mt-4">
        <div className="text-4xl font-black">
          ${tier.priceMonthly}
          <span className="text-base font-semibold text-white/60">+/seat</span>
        </div>
        <div className="mt-1 text-xs text-white/60">
          Minimum monthly spend: $2,500 • Contract required
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="text-xs text-white/60">AI allowance</div>
        <div className="mt-1 text-sm font-semibold">
          {tier.aiIncluded.toLocaleString()} actions included
        </div>
        <div className="mt-1 text-xs text-white/70">
          Overage: ${tier.aiOverage.toFixed(3)}/action • Alert: 80% • Hard cap: 200%
        </div>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-white/80">
        {tier.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span className="text-white/60">•</span> {bullet}
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-3">
        <PricingButton href="/contact-sales">Contact Sales</PricingButton>
        <PricingButton href={tier.stripeMinimumSpendLink} variant="secondary">
          (Internal) Minimum Spend Link
        </PricingButton>
      </div>
    </div>
  );
}

function ComparisonBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-lg font-black">{value}</div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <div className="font-bold">{q}</div>
      <div className="mt-2 text-white/70">{a}</div>
    </div>
  );
}
