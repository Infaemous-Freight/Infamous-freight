import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Infæmous Freight Enterprises and our mission.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          About Infæmous Freight
        </h1>
        <p className="mt-6 text-xl text-gray-600">
          We're building the operating system for modern freight — starting with AI-powered dispatch.
        </p>

        <div className="mt-12 space-y-8 text-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
            <p className="mt-4 leading-relaxed">
              Freight dispatch is still largely manual, slow, and error-prone. Infæmous Freight was built to change that.
              We combine machine learning, real-time data, and a modern SaaS experience to help dispatchers, brokers,
              and carriers operate at peak efficiency.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">What We Build</h2>
            <p className="mt-4 leading-relaxed">
              Our platform covers the full freight operations lifecycle: load creation, carrier selection,
              dispatch automation, real-time tracking, invoice generation, and analytics. Every feature is designed
              to reduce manual work and surface the insights that drive better decisions.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Multi-Tenant, Built for Teams</h2>
            <p className="mt-4 leading-relaxed">
              From independent owner-operators to large 3PLs, our platform is built to scale. Every organization gets
              isolated data, granular roles and permissions, and the flexibility to configure the platform to their workflow.
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-2xl bg-gray-50 p-8">
          <h2 className="text-xl font-bold text-gray-900">Ready to see it in action?</h2>
          <p className="mt-2 text-gray-600">
            Start a free trial or schedule a demo with our team.
          </p>
          <div className="mt-6 flex gap-4">
            <a
              href="/register"
              className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
            >
              Start free trial
            </a>
            <a
              href="/contact"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Contact sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
