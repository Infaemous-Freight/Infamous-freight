import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';

type Plan = {
  name: string;
  price: string;
  cadence?: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
};

const shipperPlans: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    tagline: 'Start with quotes, booking, and tracking — no commitment.',
    features: [
      'Unlimited quote requests',
      'Standard booking and dispatch',
      'Live shipment tracking',
      'Proof of delivery on every load',
      'Email support',
    ],
    cta: { label: 'Get a Freight Quote', href: '/request-quote' },
  },
  {
    name: 'Business',
    price: '$79',
    cadence: '/month',
    tagline: 'For shippers booking weekly with a couple of locations.',
    features: [
      'Everything in Free',
      'Priority dispatch on open lanes',
      'Recurring shipment scheduling',
      'Saved routes and contacts',
      'Reports and invoice exports',
      'Proof-of-delivery archive',
    ],
    cta: { label: 'Start Business plan', href: '/request-quote?plan=business' },
    highlighted: true,
  },
  {
    name: 'Pro Logistics',
    price: '$249',
    cadence: '/month',
    tagline: 'For multi-location shippers managing freight as a function.',
    features: [
      'Everything in Business',
      'Multi-location and team access',
      'Advanced tracking and exception alerts',
      'Dedicated dispatch contact',
      'Custom reporting cadence',
    ],
    cta: { label: 'Start Pro Logistics', href: '/request-quote?plan=pro' },
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    tagline: 'Higher volume, integrations, and account-level SLAs.',
    features: [
      'Volume pricing and committed capacity',
      'API and TMS integration',
      'Custom SLAs and escalations',
      'Onboarding and training',
    ],
    cta: { label: 'Talk to sales', href: '/request-quote?plan=enterprise' },
  },
];

const driverPlans: Plan[] = [
  {
    name: 'Driver Basic',
    price: '$0',
    tagline: 'Apply, get verified, and start hauling — no fee to begin.',
    features: [
      'Free signup and document upload',
      'Identity, insurance, and authority verification',
      'Access to standard load board',
      'Faster payment after delivery',
    ],
    cta: { label: 'Apply to Drive', href: '/drive' },
  },
  {
    name: 'Driver Pro',
    price: '$29',
    cadence: '/month',
    tagline: 'For drivers who have proven they can deliver clean.',
    features: [
      'Early access to higher-paying loads',
      'Route optimization tools',
      'Faster payout option',
      'Preferred driver badge',
      'Document vault and reminders',
      'Performance insights',
    ],
    cta: { label: 'Upgrade after first loads', href: '/drive?plan=pro' },
    highlighted: true,
  },
  {
    name: 'Fleet',
    price: '$149',
    cadence: '/month',
    tagline: 'For small carriers running a handful of trucks.',
    features: [
      'Everything in Driver Pro',
      'Up to 10 verified drivers',
      'Fleet dispatch dashboard',
      'Document and insurance tracking',
      'Centralized payouts and reporting',
    ],
    cta: { label: 'Start Fleet plan', href: '/drive?plan=fleet' },
  },
];

const PlanCard: React.FC<{ plan: Plan }> = ({ plan }) => (
  <div
    className={`flex h-full flex-col rounded-3xl border bg-infamous-card p-6 ${
      plan.highlighted
        ? 'border-infamous-orange/60 shadow-[0_0_0_1px_rgba(255,123,0,0.25)]'
        : 'border-infamous-border'
    }`}
  >
    <div className="mb-4 flex items-center justify-between">
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
    <div className="mt-6">
      <Link
        to={plan.cta.href}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition ${
          plan.highlighted
            ? 'bg-infamous-orange text-white hover:opacity-90'
            : 'border border-infamous-border bg-[#111] text-white hover:border-infamous-orange/50'
        }`}
      >
        {plan.cta.label} <ArrowRight size={16} />
      </Link>
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
            Simple pricing that follows the freight.
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-300">
            Quoting, booking, tracking, and proof of delivery are free. Paid plans add priority dispatch, scheduling,
            reporting, and team access for shippers and carriers that move freight every week.
          </p>
        </header>

        <section className="mb-16">
          <div className="mb-6 flex flex-col justify-between gap-2 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-orange">Shippers</p>
              <h2 className="mt-2 text-2xl font-bold">Built around completed shipments, not paywalls.</h2>
            </div>
            <p className="max-w-md text-sm text-gray-400">
              Free for everyday booking. Upgrade only when scheduling, reporting, or multi-location control starts
              saving real time.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {shipperPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-6 flex flex-col justify-between gap-2 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-orange">Drivers and carriers</p>
              <h2 className="mt-2 text-2xl font-bold">Earn first. Upgrade after the platform proves itself.</h2>
            </div>
            <p className="max-w-md text-sm text-gray-400">
              No fee to start. Driver Pro and Fleet are for drivers and small carriers that want priority access to
              better loads.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {driverPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-infamous-border bg-[#0f0f0f] p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-orange">
                Partner network
              </p>
              <h2 className="mt-2 text-2xl font-bold">Reach the freight ecosystem, not random eyeballs.</h2>
              <p className="mt-3 max-w-2xl text-gray-400">
                Fuel cards, insurance, factoring, repair, leasing, ELD, and lending providers can sponsor placements
                inside the Infamous Freight network. Listings start at $99/month — featured, sponsored category, and
                regional exclusive tiers are available.
              </p>
            </div>
            <Link
              to="/partners"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-infamous-border bg-infamous-card px-5 py-3 font-semibold text-white transition hover:border-infamous-orange/50"
            >
              See partner tiers <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PricingPage;
