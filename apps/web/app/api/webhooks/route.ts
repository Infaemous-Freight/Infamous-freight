import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripe) {
    return new NextResponse("Stripe is not configured", { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.warn("[Webhook] Missing stripe signature");
    return new NextResponse("Missing stripe signature", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return new NextResponse("Webhook not configured", { status: 500 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    await handleStripeEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorCode = error instanceof Error && "code" in error ? (error as any).code : "unknown";

    console.error("[Webhook] Validation failed", {
      error: errorMessage,
      code: errorCode,
      signature: sig.substring(0, 20) + "...",
    });

    if (errorCode === "StripeSignatureVerificationError") {
      return new NextResponse("Invalid signature", { status: 401 });
    }

    return new NextResponse("Webhook Error", { status: 400 });
  }
}

async function handleStripeEvent(event: any) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.info("[Webhook] Subscription activated", {
        sessionId: session.id,
        customerId: session.customer,
      });

      // TODO: Update Firestore user subscriptionStatus to active
      // TODO: Log billing event to audit trail
      // TODO: Send confirmation email to user
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      console.warn("[Webhook] Invoice payment failed", {
        invoiceId: invoice.id,
        customerId: invoice.customer,
      });

      // TODO: Restrict access for delinquent accounts
      // TODO: Send payment failure notification email
      // TODO: Create support ticket for follow-up
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      console.info("[Webhook] Invoice payment succeeded", {
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      console.info("[Webhook] Subscription updated", {
        subscriptionId: subscription.id,
        status: subscription.status,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      console.warn("[Webhook] Subscription canceled", { subscriptionId: subscription.id });
      // TODO: Disable user access
      // TODO: Archive organization data
      break;
    }

    default: {
      console.debug("[Webhook] Unhandled event type", { type: event.type });
    }
  }
}
