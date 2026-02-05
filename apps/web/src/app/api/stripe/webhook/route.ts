import { NextResponse } from "next/server";
import Stripe from "stripe";
import { BILLING } from "@/config/billing";
import { Store } from "@/lib/store";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

function resolveTier(basePriceId: string | undefined) {
  if (!basePriceId) return BILLING.tiers.fleet;
  const tiers = Object.values(BILLING.tiers);
  return (
    tiers.find((tier) => process.env[tier.stripePriceIdEnv] === basePriceId) ?? BILLING.tiers.fleet
  );
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    if (userId) {
      const basePriceId = subscription.metadata?.basePriceId;
      const tier = resolveTier(basePriceId);
      const meteredItem = subscription.items.data.find(
        (item) => process.env[BILLING.aiMetered.stripePriceIdEnv] === item.price.id,
      );

      Store.upsertSub({
        userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        status: subscription.status,
        seats: subscription.items.data.find((item) => item.price.id === basePriceId)?.quantity ?? 1,
        basePriceId: basePriceId ?? "",
        aiMeteredPriceId: process.env[BILLING.aiMetered.stripePriceIdEnv] ?? "",
        stripeMeteredItemId: meteredItem?.id,
        hasIntelligence: subscription.items.data.some(
          (item) => item.price.id === process.env[BILLING.addOns.intelligence.stripePriceIdEnv],
        ),
        aiIncluded: tier.aiIncluded,
        aiOverage: tier.aiOverage,
        hardCapMultiplier: tier.aiHardCapMultiplier,
        aiHardCapped: false,
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    if (userId) {
      Store.updateSub(userId, { status: subscription.status });
    }
  }

  return NextResponse.json({ received: true });
}
