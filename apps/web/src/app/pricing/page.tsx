import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BILLING } from "@/config/billing";

function annualPrice(monthly: number) {
  const discounted = monthly * (1 - BILLING.annualDiscountPct / 100);
  return Math.round(discounted * 100) / 100;
}

function env(name: string) {
  return process.env[name] ?? "";
}

export default function PricingPage() {
  const t = BILLING.tiers;

  const operatorHref = env(t.operator.stripeLinkEnv) || `/billing/checkout?tier=${t.operator.key}`;
  const fleetHref = env(t.fleet.stripeLinkEnv) || `/billing/checkout?tier=${t.fleet.key}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-12">
        <div className="mb-4 inline-flex items-center gap-2">
          <Badge>Infæmous Freight</Badge>
          <Badge>Hybrid Pricing</Badge>
          <Badge>Metered AI</Badge>
        </div>

        <h1 className="text-4xl font-black tracking-tight">AI-Powered Freight Operations</h1>
        <p className="mt-3 max-w-2xl text-white/70">
          Seat subscriptions + usage-based AI billing + enterprise invoicing.
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
          name={t.operator.name}
          priceMonthly={t.operator.priceMonthly}
          aiIncluded={t.operator.aiIncluded}
          aiOverage={t.operator.aiOverage}
          bullets={t.operator.bullets}
          ctaHref={operatorHref}
          ctaLabel="Start Operating"
        />

        <TierCard
          name={t.fleet.name}
          priceMonthly={t.fleet.priceMonthly}
          aiIncluded={t.fleet.aiIncluded}
          aiOverage={t.fleet.aiOverage}
          bullets={t.fleet.bullets}
          ctaHref={fleetHref}
          ctaLabel="Run Your Fleet"
          mostPopular
        />

        <EnterpriseCard />
      </div>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-xl font-black">AI usage model (transparent)</h2>
        <p className="mt-2 text-white/70">
          Alerts at 80%. Hard cap at 200% unless upgraded. Usage is visible in-app.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ComparisonBox label="Operator included" value={`${t.operator.aiIncluded} actions`} />
          <ComparisonBox label="Fleet included" value={`${t.fleet.aiIncluded} actions`} />
          <ComparisonBox label="Enterprise included" value={`${t.enterprise.aiIncluded} actions`} />
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">{BILLING.addOns.intelligence.name}</h2>
            <Badge>${BILLING.addOns.intelligence.priceMonthly}/mo</Badge>
          </div>
          <p className="mt-2 text-white/70">
            Premium weather + risk + delay intelligence for Fleet and Enterprise.
          </p>

          <ul className="mt-5 space-y-2 text-sm text-white/80">
            {BILLING.addOns.intelligence.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-white/60">•</span> {b}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <Button href="/billing/checkout?tier=fleet&addon=intelligence" variant="secondary">
              Add to Fleet / Enterprise
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black">Enterprise billing (invoice-first)</h2>
          <p className="mt-2 text-white/70">
            Contract + Stripe invoices (ACH preferred). Optional onboarding fee. Minimum monthly
            spend applies.
          </p>
          <div className="mt-6 grid gap-3">
            <Button href="/contact-sales">Contact Sales</Button>
            {(process.env.STRIPE_LINK_ENTERPRISE_MIN && (
              <Button href={process.env.STRIPE_LINK_ENTERPRISE_MIN} variant="secondary">
                (Internal) Minimum Spend Link
              </Button>
            )) || (
              <Button href="/contact-sales" variant="secondary">
                Request Quote
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-xl font-black">FAQ</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 text-sm">
          <FAQ
            q="What is an AI action?"
            a="A billable AI operation: dispatch decision, route optimization, report generation, etc."
          />
          <FAQ
            q="Do you warn before overages?"
            a="Yes—alerts trigger at 80% usage in the dashboard."
          />
          <FAQ
            q="What happens at the hard cap?"
            a="AI automation pauses at 200% of included usage unless you upgrade or approve higher limits."
          />
          <FAQ
            q="How does Enterprise billing work?"
            a="Invoice-first with contract terms. ACH preferred."
          />
        </div>
      </section>
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
      className={`rounded-3xl border ${mostPopular ? "border-white/25" : "border-white/10"} bg-white/5 p-8`}
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
          Annual equivalent: ${annualPrice(priceMonthly)}/seat (-{BILLING.annualDiscountPct}%)
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
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-white/60">•</span> {b}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button href={ctaHref}>{ctaLabel}</Button>
      </div>
    </div>
  );
}

function EnterpriseCard() {
  const t = BILLING.tiers.enterprise;
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black">{t.name}</h3>
        <Badge>Invoice-First</Badge>
      </div>

      <div className="mt-4">
        <div className="text-4xl font-black">
          ${t.priceMonthly}
          <span className="text-base font-semibold text-white/60">+/seat</span>
        </div>
        <div className="mt-1 text-xs text-white/60">
          Minimum monthly spend: ${t.minimumMonthlySpend?.toLocaleString()} • Contract required
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="text-xs text-white/60">AI allowance</div>
        <div className="mt-1 text-sm font-semibold">
          {t.aiIncluded.toLocaleString()} actions included
        </div>
        <div className="mt-1 text-xs text-white/70">
          Overage: ${t.aiOverage.toFixed(3)}/action • Alert: 80% • Hard cap: 200%
        </div>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-white/80">
        {t.bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-white/60">•</span> {b}
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-3">
        <Button href="/contact-sales">Contact Sales</Button>
        <Button href="/contact-sales" variant="secondary">
          Request Quote
        </Button>
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
