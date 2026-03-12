import React from "react";
import { Badge } from "@/components/pricing/Badge";
import { PricingButton } from "@/components/pricing/PricingButton";

const starterCheckoutLink = "https://buy.stripe.com/28EdRa5yA2Fs6kuanZcV210";
const professionalCheckoutLink = "https://buy.stripe.com/9B66oIe56eoaeR0gMncV211";

const starterFeatures = [
  "Dispatch board",
  "Load tracking",
  "Invoicing lite",
  "Basic AI assistance",
  "1 user included",
] as const;

const professionalFeatures = [
  "Everything in Starter",
  "Advanced route optimization",
  "Predictive ETAs",
  "Billing automation",
  "API access",
  "Role-based access",
  "Priority support",
  "3 users included",
] as const;

const enterpriseFeatures = [
  "Enterprise controls",
  "Advanced AI automation",
  "Custom integrations",
  "Dedicated onboarding",
  "SLA options",
  "Minimum monthly platform spend",
] as const;

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2">
            <Badge>Infæmous Freight</Badge>
            <Badge>Commercial Engine Live</Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Pricing</h1>
          <p className="mt-3 max-w-2xl text-white/70">
            Starter, Professional, and Enterprise plans built for owner-operators, growing fleets,
            and logistics networks.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <PricingTierCard
            name="Starter"
            priceLabel="$49 / month"
            audience="For owner-operators and small fleets."
            includes={starterFeatures}
            addOns={["Additional user: $15 / month", "Truck tracking: $5 / truck / month"]}
            ctaHref={starterCheckoutLink}
            ctaLabel="Start with Starter"
          />

          <PricingTierCard
            name="Professional"
            priceLabel="$149 / month"
            audience="For growing fleets and dispatch teams."
            includes={professionalFeatures}
            addOns={[
              "Additional user: $25 / month",
              "Truck tracking: $7 / truck / month",
              "Weather intelligence: $29 / month",
            ]}
            ctaHref={professionalCheckoutLink}
            ctaLabel="Upgrade to Professional"
            mostPopular
          />

          <EnterpriseCard />
        </div>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black">How activation works</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-white/80">
            <li>Customer completes Stripe Checkout.</li>
            <li>Subscription is created.</li>
            <li>Webhook fires and tenant is provisioned.</li>
            <li>Organization ID is generated and dashboard unlocks.</li>
            <li>Onboarding flow begins.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}

function PricingTierCard(props: {
  name: string;
  priceLabel: string;
  audience: string;
  includes: readonly string[];
  addOns: readonly string[];
  ctaHref: string;
  ctaLabel: string;
  mostPopular?: boolean;
}) {
  const { name, priceLabel, audience, includes, addOns, ctaHref, ctaLabel, mostPopular } = props;

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

      <div className="mt-4 text-4xl font-black">{priceLabel}</div>
      <p className="mt-3 text-sm text-white/70">{audience}</p>

      <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-white/80">Includes</h4>
      <ul className="mt-3 space-y-2 text-sm text-white/80">
        {includes.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-white/60">•</span> {line}
          </li>
        ))}
      </ul>

      <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-white/80">Add-ons</h4>
      <ul className="mt-3 space-y-2 text-sm text-white/80">
        {addOns.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-white/60">•</span> {line}
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
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black">Enterprise</h3>
        <Badge>Contact Sales</Badge>
      </div>

      <div className="mt-4 text-4xl font-black">Custom</div>
      <p className="mt-3 text-sm text-white/70">
        For large fleets, brokerages, and logistics networks.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
        <p>$499 / month platform fee</p>
        <p>$2,500 minimum monthly spend</p>
        <p>Usage-based AI automation</p>
      </div>

      <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-white/80">Includes</h4>
      <ul className="mt-3 space-y-2 text-sm text-white/80">
        {enterpriseFeatures.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-white/60">•</span> {line}
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-3">
        <PricingButton href="/book-demo">Book a Demo</PricingButton>
        <PricingButton href="/contact-sales" variant="secondary">
          Contact Sales
        </PricingButton>
      </div>
    </div>
  );
}
