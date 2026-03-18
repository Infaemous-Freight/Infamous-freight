import type { Metadata } from "next";
import { PricingSection } from "../(marketing)/_components/PricingSection";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for every freight operation size.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-white py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Pricing Plans
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          No contracts. No hidden fees. Cancel anytime.
        </p>
      </div>
      <PricingSection />
    </div>
  );
}
