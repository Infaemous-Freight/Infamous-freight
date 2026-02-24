import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing stripe signature", { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.info("Subscription activated", session.id);
      // TODO: Update Firestore user subscriptionStatus to active.
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      console.warn("Invoice payment failed", invoice.id);
      // TODO: Restrict access for delinquent accounts.
    }

    return NextResponse.json({ received: true });
  } catch {
    return new NextResponse("Webhook Error", { status: 400 });
  }
}
