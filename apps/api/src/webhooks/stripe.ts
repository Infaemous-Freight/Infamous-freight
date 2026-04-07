import { Router } from "express";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { logger } from "../lib/logger.js";
import { markPaymentSucceeded } from "../services/payment.service.js";

const router: Router = Router();

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

router.post("/", async (req, res) => {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(503).json({ ok: false, error: "Stripe webhook is not configured" });
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    res.status(400).json({ ok: false, error: "Missing stripe-signature header" });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    logger.error({ err: error }, "Failed to verify Stripe webhook signature");
    res.status(400).json({ ok: false, error: "Invalid webhook signature" });
    return;
  }

  try {
    const existing = await prisma.webhookEvent.findUnique({ where: { id: event.id } });
    if (existing?.status === "PROCESSED") {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    await prisma.webhookEvent.upsert({
      where: { id: event.id },
      update: {
        type: event.type,
        payload: JSON.stringify(event),
        status: "PENDING",
      },
      create: {
        id: event.id,
        type: event.type,
        payload: JSON.stringify(event),
        source: "stripe",
        status: "PENDING",
      },
    });

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const updated = await markPaymentSucceeded({
          stripePaymentIntentId: paymentIntent.id,
          rawEvent: event,
        });

        logger.info(
          {
            eventType: event.type,
            paymentIntentId: paymentIntent.id,
            internalPaymentId: updated?.id,
            tenantId: updated?.tenantId,
          },
          "Stripe payment succeeded; load marked paid and dispatch trigger ready",
        );
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.info(
          {
            eventType: event.type,
            sessionId: session.id,
            customerId: session.customer,
            subscriptionId: session.subscription,
            paymentStatus: session.payment_status,
          },
          "Stripe checkout session completed",
        );
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logger.info(
          {
            eventType: event.type,
            subscriptionId: subscription.id,
            customerId: subscription.customer,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          "Stripe subscription changed",
        );
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logger.info(
          {
            eventType: event.type,
            invoiceId: invoice.id,
            customerId: invoice.customer,
            subscriptionId: invoice.parent?.subscription_details?.subscription ?? null,
            amountPaid: invoice.amount_paid,
            status: invoice.status,
          },
          "Stripe invoice paid",
        );
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logger.warn(
          {
            eventType: event.type,
            invoiceId: invoice.id,
            customerId: invoice.customer,
            subscriptionId: invoice.parent?.subscription_details?.subscription ?? null,
            amountDue: invoice.amount_due,
            status: invoice.status,
          },
          "Stripe invoice payment failed",
        );
        break;
      }
      default:
        logger.info({ eventType: event.type }, "Unhandled Stripe webhook event");
    }

    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: "PROCESSED", lastError: null },
    });

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ err: error, eventType: event.type }, "Failed to process Stripe webhook");
    await prisma.webhookEvent
      .update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          retryCount: { increment: 1 },
          lastError: error instanceof Error ? error.message : "Unknown webhook error",
        },
      })
      .catch(() => undefined);
    res.status(500).json({ ok: false, error: "Webhook handler failed" });
  }
});

export default router;
