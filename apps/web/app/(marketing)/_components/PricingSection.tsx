const tiers = [
  {
    name: "Starter",
    price: "$99",
    period: "/month",
    description: "Perfect for independent dispatchers and small carriers.",
    features: [
      "Up to 3 users",
      "100 loads/month",
      "AI dispatch suggestions",
      "Real-time tracking",
      "Email support",
    ],
    cta: "Start free trial",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$299",
    period: "/month",
    description: "For growing brokerages and mid-size fleets.",
    features: [
      "Up to 15 users",
      "Unlimited loads",
      "Full AI automation",
      "Rate prediction engine",
      "Carrier intelligence",
      "Priority support",
      "API access",
    ],
    cta: "Start free trial",
    href: "/register",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large fleets, 3PLs, and enterprise shippers.",
    features: [
      "Unlimited users",
      "Unlimited loads",
      "Custom AI models",
      "Dedicated account manager",
      "SLA guarantee",
      "SSO / SAML",
      "Custom integrations",
    ],
    cta: "Contact sales",
    href: "/contact",
    highlight: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            No hidden fees. Cancel anytime.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 flex flex-col ${
                tier.highlight
                  ? "bg-gray-900 text-white ring-2 ring-gray-900"
                  : "bg-white border border-gray-200"
              }`}
            >
              <h3
                className={`text-xl font-bold ${
                  tier.highlight ? "text-white" : "text-gray-900"
                }`}
              >
                {tier.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span
                  className={`text-4xl font-extrabold ${
                    tier.highlight ? "text-white" : "text-gray-900"
                  }`}
                >
                  {tier.price}
                </span>
                {tier.period && (
                  <span
                    className={`text-sm ${
                      tier.highlight ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {tier.period}
                  </span>
                )}
              </div>
              <p
                className={`mt-2 text-sm ${
                  tier.highlight ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {tier.description}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-center gap-2 text-sm ${
                      tier.highlight ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <span className="text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={tier.href}
                className={`mt-8 block rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors ${
                  tier.highlight
                    ? "bg-white text-gray-900 hover:bg-gray-100"
                    : "bg-gray-900 text-white hover:bg-gray-700"
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
