import { NextResponse } from "next/server";
import { BILLING } from "@/config/billing";
import { rateLimit } from "@/lib/rateLimit";
import { Store } from "@/lib/store";
import { stripe } from "@/lib/stripe";

function resolveTier(basePriceId: string) {
  const tiers = Object.values(BILLING.tiers);
  return (
    tiers.find((tier) => process.env[tier.stripePriceIdEnv] === basePriceId) ?? BILLING.tiers.fleet
  );
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    userId?: string;
    email?: string;
    name?: string;
    basePriceId?: string;
    seats?: number;
    addIntelligence?: boolean;
  };

  if (!body.userId || !body.email || !body.basePriceId || !body.seats) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const limiter = rateLimit(`create-subscription:${body.userId}`, 5, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const aiMeteredPriceId = process.env[BILLING.aiMetered.stripePriceIdEnv];
  if (!aiMeteredPriceId) {
    return NextResponse.json({ error: "Missing AI metered price id" }, { status: 500 });
  }

  const existing = Store.getUser(body.userId);
  const user = Store.upsertUser({
    id: body.userId,
    email: body.email,
    name: body.name,
    stripeCustomerId: existing?.stripeCustomerId,
    billingAccess: true,
  });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: body.email,
      name: body.name,
      metadata: { userId: body.userId },
    });
    customerId = customer.id;
    Store.upsertUser({ ...user, stripeCustomerId: customerId });
  }

  const items: { price: string; quantity?: number }[] = [
    { price: body.basePriceId, quantity: body.seats },
    { price: aiMeteredPriceId },
  ];

  if (body.addIntelligence) {
    const addOnPriceId = process.env[BILLING.addOns.intelligence.stripePriceIdEnv];
    if (addOnPriceId) items.push({ price: addOnPriceId });
  }

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items,
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
    metadata: {
      userId: body.userId,
      basePriceId: body.basePriceId,
    },
  });

  const tier = resolveTier(body.basePriceId);
  const meteredItem = subscription.items.data.find((item) => item.price.id === aiMeteredPriceId);

  Store.upsertSub({
    userId: body.userId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    status: subscription.status,
    seats: body.seats,
    basePriceId: body.basePriceId,
    aiMeteredPriceId,
    stripeMeteredItemId: meteredItem?.id,
    hasIntelligence: Boolean(body.addIntelligence),
    aiIncluded: tier.aiIncluded,
    aiOverage: tier.aiOverage,
    hardCapMultiplier: tier.aiHardCapMultiplier,
    aiHardCapped: false,
  });

  const clientSecret =
    typeof subscription.latest_invoice !== "string" &&
    subscription.latest_invoice?.payment_intent &&
    typeof subscription.latest_invoice.payment_intent !== "string"
      ? subscription.latest_invoice.payment_intent.client_secret
      : null;

  if (!clientSecret) {
    return NextResponse.json({ error: "Missing payment intent" }, { status: 500 });
  }

  return NextResponse.json({ clientSecret });
}
