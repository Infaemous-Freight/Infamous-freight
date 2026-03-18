const features = [
  {
    title: "AI Dispatch Automation",
    description:
      "Assign loads to drivers instantly using machine learning that considers capacity, proximity, and performance history.",
    icon: "🤖",
  },
  {
    title: "Real-Time Fleet Intelligence",
    description:
      "Monitor your entire fleet on a live map. Get instant alerts on delays, breakdowns, and route deviations.",
    icon: "📡",
  },
  {
    title: "Smart Rate Prediction",
    description:
      "Predict spot and contract rates using lane-level models trained on millions of freight transactions.",
    icon: "📊",
  },
  {
    title: "Carrier Scoring",
    description:
      "Rank and select carriers based on on-time performance, safety scores, and tender acceptance rates.",
    icon: "⭐",
  },
  {
    title: "ETA Risk Analysis",
    description:
      "Forecast delivery risk before it happens — factoring weather, traffic, and carrier reliability.",
    icon: "⚠️",
  },
  {
    title: "Multi-Tenant Platform",
    description:
      "Built for brokers, shippers, and 3PLs. Every organization gets isolated data, roles, and workflows.",
    icon: "🏢",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to run a modern freight operation
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From dispatch automation to predictive analytics, Infæmous Freight gives your team an AI-powered edge.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-8 hover:border-gray-300 hover:bg-white transition-colors"
            >
              <div className="text-3xl">{feature.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
