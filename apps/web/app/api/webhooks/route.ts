import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
    const event = getStripeClient().webhooks.constructEvent(body, sig, webhookSecret);

    await handleStripeEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const directType =
      typeof error === "object" && error !== null && "type" in error
        ? (error as { type?: unknown }).type
        : undefined;
    const directCode =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;
    const causeType =
      error instanceof Error &&
      error.cause &&
      typeof error.cause === "object" &&
      "type" in error.cause
        ? (error.cause as { type?: unknown }).type
        : undefined;
    const errorType = String(directType ?? directCode ?? causeType ?? "unknown");

    console.error("[Webhook] Validation failed", {
      error: errorMessage,
      type: errorType,
    });

    if (errorType === "StripeSignatureVerificationError") {
      return new NextResponse("Invalid signature", { status: 401 });
    }

    return new NextResponse("Webhook Error", { status: 400 });
  }
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
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
      const invoice = event.data.object as Stripe.Invoice;
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
      const invoice = event.data.object as Stripe.Invoice;
      console.info("[Webhook] Invoice payment succeeded", {
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      console.info("[Webhook] Subscription updated", {
        subscriptionId: subscription.id,
        status: subscription.status,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
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
