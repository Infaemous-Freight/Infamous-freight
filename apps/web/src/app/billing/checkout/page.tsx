import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "@/components/billing/CheckoutForm";
import { BILLING } from "@/config/billing";
import { stripePromise } from "@/lib/stripe-web";

async function createSubscriptionServer(params: { tierKey: string; addon?: string }) {
  const userId = "demo_user";
  const email = "demo@infaemousfreight.ai";
  const name = "Demo User";

  const tier = BILLING.tiers[params.tierKey as keyof typeof BILLING.tiers];
  const basePriceId = process.env[tier.stripePriceIdEnv]!;
  const addIntelligence = params.addon === "intelligence";

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/billing/create-subscription`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId, email, name, basePriceId, seats: 1, addIntelligence }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to create subscription");
  return res.json() as Promise<{ clientSecret: string }>;
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { tier?: string; addon?: string };
}) {
  const tierKey = searchParams.tier ?? "fleet";
  const data = await createSubscriptionServer({ tierKey, addon: searchParams.addon });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-black">Checkout</h1>
      <p className="mt-2 text-white/70">
        Secure payment with Stripe. Your subscription activates after payment confirmation.
      </p>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
        <Elements stripe={stripePromise} options={{ clientSecret: data.clientSecret }}>
          <CheckoutForm />
        </Elements>
      </div>
    </div>
  );
}
