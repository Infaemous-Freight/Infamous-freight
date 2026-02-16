import React, { useState } from "react";
import { PRICING_TIERS, MARKETPLACE_TIER } from "@/data/pricingTiers";

/**
 * PRICING PAGE - 2026 OPTIMIZED 4-TIER MODEL
 *
 * Conversion targets:
 * - Free→Pro: 30% (Slack benchmark)
 * - Pro→Enterprise: 15% (industry benchmark)
 * - Pro→Marketplace: 5% (partnership growth)
 */

interface PricingPageProps {
  currency?: "USD" | "EUR" | "GBP";
}

export default function PricingPage({ currency = "USD" }: PricingPageProps) {
  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "annual">("monthly");

  const currencySymbol = { USD: "$", EUR: "€", GBP: "£" }[currency];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white py-16">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Freight Operations, Simplified</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            From owner-operators to enterprise fleets, INFÆMOUS FREIGHT scales with your business.
            No credit card required to get started.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg bg-slate-700 p-1">
            <button
              onClick={() => setSelectedBilling("monthly")}
              className={`px-6 py-2 rounded font-semibold transition-all ${
                selectedBilling === "monthly"
                  ? "bg-blue-500 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedBilling("annual")}
              className={`px-6 py-2 rounded font-semibold transition-all ${
                selectedBilling === "annual"
                  ? "bg-blue-500 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {PRICING_TIERS.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              currency={currencySymbol}
              billingPeriod={selectedBilling}
              isHighlighted={tier.highlighted}
            />
          ))}
        </div>

        {/* Marketplace Tier - Special Row */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-8 mb-16">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-3xl font-bold mb-2">{MARKETPLACE_TIER.name}</h3>
                <p className="text-slate-200 text-lg">{MARKETPLACE_TIER.description}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-400 mb-1">15%</div>
                <div className="text-slate-200">Revenue Share</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-semibold text-lg mb-4">Perfect for:</h4>
                <ul className="space-y-2 text-slate-200">
                  <li>✓ Logistics integrators</li>
                  <li>✓ TMS/ERP resellers</li>
                  <li>✓ White-label providers</li>
                  <li>✓ 3PL platforms</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-4">What's included:</h4>
                <ul className="space-y-2 text-slate-200">
                  <li>✓ Dedicated partnership manager</li>
                  <li>✓ Co-marketing fund</li>
                  <li>✓ Lead distribution system</li>
                  <li>✓ Featured marketplace listing</li>
                </ul>
              </div>
            </div>

            <button className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-all">
              Apply for Partnership
            </button>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-slate-800 rounded-xl overflow-hidden mb-16">
          <table className="w-full text-left">
            <thead className="bg-slate-700">
              <tr>
                <th className="p-4 font-semibold">Feature</th>
                {PRICING_TIERS.map((tier) => (
                  <th key={tier.id} className="p-4 font-semibold text-center text-blue-400">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <ComparisonRow
                feature="Monthly Cost"
                values={PRICING_TIERS.map((t) =>
                  t.price === 0 ? "Free" : `${currencySymbol}${t.price}`,
                )}
              />
              <ComparisonRow
                feature="API Calls/Month"
                values={PRICING_TIERS.map((t) =>
                  typeof t.limits.api_calls === "string"
                    ? t.limits.api_calls
                    : t.limits.api_calls.toLocaleString(),
                )}
              />
              <ComparisonRow
                feature="Shipments/Month"
                values={PRICING_TIERS.map((t) =>
                  typeof t.limits.shipments_monthly === "string"
                    ? t.limits.shipments_monthly
                    : t.limits.shipments_monthly.toLocaleString(),
                )}
              />
              <ComparisonRow
                feature="Team Members"
                values={PRICING_TIERS.map((t) =>
                  typeof t.limits.users === "string"
                    ? t.limits.users
                    : t.limits.users.toLocaleString(),
                )}
              />
              <ComparisonRow
                feature="Integrations"
                values={["1", "5+", "Unlimited", "Unlimited"]}
              />
              <ComparisonRow
                feature="Priority Support"
                values={["Community", "Email + Phone", "24/7 SLA", "Dedicated"]}
              />
              <ComparisonRow feature="SLA Guarantee" values={["99%", "99%", "99.9%", "99.9%"]} />
            </tbody>
          </table>
        </div>

        {/* ROI Calculator */}
        <ROICalculator currency={currencySymbol} />

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <FAQItem
              question="Can I upgrade or downgrade anytime?"
              answer="Yes! Switch tiers at any time with prorated billing. Unused credits roll forward."
            />
            <FAQItem
              question="What happens when I exceed usage limits?"
              answer="Pro tier charges $0.01/overage load. We'll email alerts when approaching limits. No surprise charges—opt-in metering."
            />
            <FAQItem
              question="Do you offer discounts for annual billing?"
              answer="Yes! Annual Pro plans are 20% off ($1,188/year vs $1,188 monthly = save $198)."
            />
            <FAQItem
              question="What's the Free tier trial period?"
              answer="No trial needed! Free tier has unlimited usage at $0/month. Upgrade to Pro anytime with full feature access."
            />
            <FAQItem
              question="Can I use whitelabel/custom domains?"
              answer="Yes, available on Enterprise tier ($999/month). Includes custom branding, SSO/SAML, and dedicated infrastructure."
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-20 text-center">
        <div className="bg-blue-600 rounded-xl p-8 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-4">Ready to streamline your freight operations?</h3>
          <p className="text-slate-100 mb-6">
            Join 13,000+ owner-operators already using INFÆMOUS FREIGHT. No credit card required.
          </p>
          <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-slate-100 transition-all inline-block">
            Get Started Free
          </button>
        </div>
      </div>
    </div>
  );
}

type PricingTier = (typeof PRICING_TIERS)[number];

function PricingCard({
  tier,
  currency,
  billingPeriod,
  isHighlighted,
}: {
  tier: PricingTier;
  currency: string;
  billingPeriod: string;
  isHighlighted: boolean;
}) {
  const price =
    billingPeriod === "annual" && tier.price_id_annual
      ? Math.floor(tier.amount_annual / 12)
      : tier.amount;
  const displayPrice = Math.floor(price / 100);

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all ${
        isHighlighted
          ? "ring-2 ring-blue-500 transform scale-105 shadow-2xl bg-slate-700"
          : "bg-slate-700 hover:shadow-lg"
      }`}
    >
      {isHighlighted && (
        <div className="bg-blue-500 text-white text-center py-2 font-semibold">RECOMMENDED</div>
      )}

      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
        <p className="text-slate-300 text-sm mb-4">{tier.description}</p>

        <div className="mb-6">
          {tier.price === 0 ? (
            <div className="text-4xl font-bold">Free</div>
          ) : (
            <>
              <div className="text-4xl font-bold">
                {currency}
                {displayPrice}
                <span className="text-lg text-slate-300 font-normal">/mo</span>
              </div>
              {billingPeriod === "annual" && tier.annual_discount_percent && (
                <div className="text-sm text-green-400 mt-2">
                  Save {tier.annual_discount_percent}% annually
                </div>
              )}
            </>
          )}
        </div>

        <button
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all mb-6 ${
            isHighlighted
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-slate-600 hover:bg-slate-500 text-white"
          }`}
        >
          {tier.cta}
        </button>

        <ul className="space-y-3">
          {tier.features.slice(0, 5).map((feature: string, idx: number) => (
            <li key={idx} className="flex items-start text-sm text-slate-200">
              <span className="text-green-400 mr-2">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ComparisonRow({ feature, values }: { feature: string; values: string[] }) {
  return (
    <tr className="border-t border-slate-600">
      <td className="p-4 font-semibold text-slate-100">{feature}</td>
      {values.map((value, idx) => (
        <td key={idx} className="p-4 text-center text-slate-200">
          {value}
        </td>
      ))}
    </tr>
  );
}

function ROICalculator({ currency }: { currency: string }) {
  const [trucks, setTrucks] = useState(10);
  const [loadPerWeek, setLoadPerWeek] = useState(25);

  const loadsPerMonth = loadPerWeek * 4;
  const savingsPerLoad = 2.5; // Hours saved per load
  const hourlyRate = 50; // Driver hourly rate
  const monthlySavings = loadsPerMonth * savingsPerLoad * hourlyRate;
  const annualSavings = monthlySavings * 12;

  return (
    <div className="bg-indigo-900 rounded-xl p-8 mb-16">
      <h3 className="text-2xl font-bold mb-6">Your Potential ROI</h3>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm mb-2">Number of trucks</label>
          <input
            type="range"
            min="1"
            max="500"
            value={trucks}
            onChange={(e) => setTrucks(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-3xl font-bold mt-2">{trucks}</div>
        </div>
        <div>
          <label className="block text-sm mb-2">Loads per week</label>
          <input
            type="range"
            min="1"
            max="100"
            value={loadPerWeek}
            onChange={(e) => setLoadPerWeek(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-3xl font-bold mt-2">{loadPerWeek}</div>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="text-slate-300 text-sm mb-1">Monthly Savings</div>
          <div className="text-3xl font-bold text-green-400">
            {currency}
            {monthlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="text-slate-300 text-sm mb-1">Annual Savings</div>
          <div className="text-3xl font-bold text-green-400">
            {currency}
            {annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="text-slate-300 text-sm mb-1">Payback Period (Pro)</div>
          <div className="text-3xl font-bold text-blue-400">
            {(9900 / (monthlySavings / 30)).toFixed(0)} days
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-600 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex justify-between items-center hover:bg-slate-700 transition-colors"
      >
        <span className="font-semibold text-left">{question}</span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && <div className="p-4 border-t border-slate-600 text-slate-300">{answer}</div>}
    </div>
  );
}
