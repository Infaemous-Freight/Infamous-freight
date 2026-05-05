import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';

type Cta = {
  label: string;
  href: string;
};

type Plan = {
  name: string;
  price: string;
  cadence?: string;
  tagline: string;
  features: string[];
  cta: Cta;
  secondaryCta?: Cta;
  highlighted?: boolean;
};

const stripeSubscriptionPlans: Plan[] = [
  {
    name: 'Starter',
    price: '$99',
    cadence: '/month',
    tagline: 'Perfect for small freight operations getting organized fast.',
    features: [
      'Up to 10 drivers',
      'Core dispatch workspace',
      'Quote, booking, and tracking tools',
      'Proof-of-delivery workflow',
      'Standard support',
    ],
    cta: {
      label: 'Start monthly',
      href: 'https://buy.stripe.com/aFa9AU0qScHh3dH1WLeME0b',
    },
    secondaryCta: {
      label: 'Pay yearly — $1,089/year',
      href: 'https://buy.stripe.com/4gMaEY4H87mXeWpcBpeME0e',
    },
  },
  {
    name: 'Professional',
    price: '$499',
    cadence: '/month',
    tagline: 'For growing freight companies that need stronger automation.',
    features: [
      'Up to 50 drivers',
      'Advanced dispatch and operations features',
      'SMS workflows',
      'API access',
      'Priority support',
    ],
    cta: {
      label: 'Start monthly',
      href: 'https://buy.stripe.com/cNi3cwgpQ8r1cOh58XeME0c',
    },
    secondaryCta: {
      label: 'Pay yearly — $5,389/year',
      href: 'https://buy.stripe.com/14A8wQ5Lc6iT01v7h5eME0f',
    },
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$2,000',
    cadence: '/month',
    tagline: 'For large enterprises running high-volume freight operations.',
    features: [
      'Unlimited drivers',
      'White-label options',
      'Custom integrations',
      'Dedicated support',
      'Enterprise operations setup',
    ],
    cta: {
      label: 'Start monthly',
      href: 'https://buy.stripe.com/7sY14o0qS8r115z30PeME0d',
    },
    secondaryCta: {
      label: 'Pay yearly — $21,600/year',
      href: 'https://buy.stripe.com/9B63cw6PgePp01vcBpeME0g',
    },
  },
];

const stripeAddOnPlans: Plan[] = [
  {
    name: 'AI Action Pack 2,000',
    price: '$50',
    tagline: 'One-time add-on for load recommendations, dispatch drafts, broker summaries, rate checks, and document workflow automation.',
    features: ['2,000 additional AI actions', 'One-time purchase', 'Works with active platform workflows'],
    cta: {
      label: 'Buy add-on',
      href: 'https://buy.stripe.com/4gMaEY0qSgXxg0t6d1eME0h',
    },
  },
  {
    name: 'AI Action Pack 10,000',
    price: '$200',
    tagline: 'One-time add-on for higher-volume dispatch automation, document workflows, broker checks, and rate intelligence.',
    features: ['10,000 additional AI actions', 'One-time purchase', 'Built for busier operations'],
    cta: {
      label: 'Buy add-on',
      href: 'https://buy.stripe.com/9B6cN67Tk22D15zdFteME0i',
    },
  },
  {
    name: 'AI Action Pack 50,000',
    price: '$750',
    tagline: 'One-time add-on for enterprise-level freight automation and high-volume AI workflows.',
    features: ['50,000 additional AI actions', 'One-time purchase', 'Best for high-volume teams'],
    cta: {
      label: 'Buy add-on',
      href: 'https://buy.stripe.com/8x200kddE22DbKd8l9eME0j',
    },
    highlighted: true,
  },
  {
    name: 'Document AI Pack 500',
    price: '$50',
    tagline: 'One-time add-on for AI document scans, including BOL/POD extraction, invoice field extraction, and paperwork automation.',
    features: ['500 additional AI document scans', 'BOL/POD extraction', 'Invoice field extraction'],
    cta: {
      label: 'Buy add-on',
      href: 'https://buy.stripe.com/dRm5kEc9Aaz97tX8l9eME0k',
    },
  },
  {
    name: 'Voice AI Minutes 1,000',
    price: '$200',
    tagline: 'One-time add-on for call automation, voice booking workflows, and dispatch phone assistance.',
    features: ['1,000 Voice AI minutes', 'Call automation', 'Dispatch phone assistance'],
    cta: {
      label: 'Buy add-on',
      href: 'https://buy.stripe.com/6oU8wQ7Tk36H9C50SHeME0l',
    },
  },
];

const isExternalHref = (href: string) => href.startsWith('http://') || href.startsWith('https://');

const ctaClassName = (highlighted?: boolean) =>
  `inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition ${
    highlighted
      ? 'bg-infamous-orange text-white hover:opacity-90'
      : 'border border-infamous-border bg-[#111] text-white hover:border-infamous-orange/50'
  }`;

const secondaryCtaClassName =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-infamous-border px-5 py-3 text-sm font-semibold text-gray-200 transition hover:border-infamous-orange/50 hover:text-white';

const PlanAction: React.FC<{ cta: Cta; highlighted?: boolean; secondary?: boolean }> = ({
  cta,
  highlighted,
  secondary,
}) => {
  const className = secondary ? secondaryCtaClassName : ctaClassName(highlighted);

  if (isExternalHref(cta.href)) {
    return (
      <a href={cta.href} target="_blank" rel="noreferrer" className={className}>
        {cta.label} <ArrowRight size={16} />
      </a>
    );
  }

  return (
    <Link to={cta.href} className={className}>
      {cta.label} <ArrowRight size={16} />
    </Link>
  );
};

const PlanCard: React.FC<{ plan: Plan }> = ({ plan }) => (
  <div
    className={`flex h-full flex-col rounded-3xl border bg-infamous-card p-6 ${
      plan.highlighted
        ? 'border-infamous-orange/60 shadow-[0_0_0_1px_rgba(255,123,0,0.25)]'
        : 'border-infamous-border'
    }`}
  >
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-lg font-bold">{plan.name}</h3>
      {plan.highlighted ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-infamous-orange/10 px-3 py-1 text-xs font-semibold text-infamous-orange">
          <Sparkles size={12} /> Recommended
        </span>
      ) : null}
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-4xl font-black tracking-tight">{plan.price}</span>
      {plan.cadence ? <span className="text-sm text-gray-500">{plan.cadence}</span> : null}
    </div>
    <p className="mt-3 text-sm leading-6 text-gray-400">{plan.tagline}</p>
    <ul className="mt-5 space-y-3 text-sm">
      {plan.features.map((feature) => (
        <li key={feature} className="flex gap-2 text-gray-300">
          <Check size={16} className="mt-0.5 flex-shrink-0 text-infamous-orange" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <div className="mt-auto pt-6 space-y-3">
      <PlanAction cta={plan.cta} highlighted={plan.highlighted} />
      {plan.secondaryCta ? <PlanAction cta={plan.secondaryCta} secondary /> : null}
    </div>
  </div>
);

const PricingPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-[#090909] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <Link to="/home" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft size={16} /> Back to Infamous Freight
        </Link>

        <header className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-orange">Pricing</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
            Stripe-backed pricing for freight operators ready to move faster.
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-300">
            Choose the Infamous Freight plan that matches your operation, then add AI action, document, or voice packs
            when your team needs more automation capacity. Payments are processed securely through Stripe.
          </p>
        </header>

        <section className="mb-16">
          <div className="mb-6 flex flex-col justify-between gap-2 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-orange">Platform plans</p>
              <h2 className="mt-2 text-2xl font-bold">Monthly or annual subscriptions.</h2>
            </div>
            <p className="max-w-md text-sm text-gray-400">
              Starter, Professional, and Enterprise use the live Stripe products and prices configured for Infamous Freight.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {stripeSubscriptionPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-6 flex flex-col justify-between gap-2 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-orange">AI add-ons</p>
              <h2 className="mt-2 text-2xl font-bold">One-time capacity packs for heavier workflows.</h2>
            </div>
            <p className="max-w-md text-sm text-gray-400">
              Add more AI actions, document scans, or voice minutes without changing the customer’s base subscription.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {stripeAddOnPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-infamous-border bg-[#0f0f0f] p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-orange">Need a custom invoice?</p>
              <h2 className="mt-2 text-2xl font-bold">Use Stripe Invoicing for B2B freight customers.</h2>
              <p className="mt-3 max-w-2xl text-gray-400">
                For contract lanes, implementation work, enterprise onboarding, or custom account terms, request a quote
                and Infamous Freight can issue a Stripe invoice instead of sending a public payment link.
              </p>
            </div>
            <Link
              to="/request-quote"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-infamous-border bg-infamous-card px-5 py-3 font-semibold text-white transition hover:border-infamous-orange/50"
            >
              Request invoice quote <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PricingPage;
