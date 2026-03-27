import Stripe from "stripe";
import { PAYMENT_LINKS, type PaymentLinkType } from "@infamous-freight/shared";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

export async function createGoDaddyRedirectPayment(params: {
  tenantId: string;
  userId?: string;
  loadId?: string;
  type: PaymentLinkType;
  amount: number;
}) {
  const checkoutUrl = PAYMENT_LINKS[params.type];

  const payment = await prisma.payment.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      loadId: params.loadId,
      amount: params.amount,
      status: "PENDING",
      provider: "godaddy_link",
      checkoutUrl,
      currency: "usd",
    },
  });

  await prisma.transaction.create({
    data: {
      paymentId: payment.id,
      status: "PENDING",
      rawResponse: {
        provider: "godaddy_link",
        type: params.type,
        checkoutUrl,
      },
    },
  });

  if (params.loadId) {
    await prisma.loadPayment.create({
      data: {
        tenantId: params.tenantId,
        loadId: params.loadId,
        paymentId: payment.id,
        status: "PENDING",
      },
    });
  }

  return { paymentId: payment.id, checkoutUrl };
}

export async function createStripePaymentIntent(params: {
  tenantId: string;
  userId?: string;
  loadId?: string;
  amount: number;
  currency?: string;
}) {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }

  const currency = (params.currency ?? "usd").toLowerCase();
  const amount = Math.round(params.amount * 100);

  const intent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata: {
      tenantId: params.tenantId,
      userId: params.userId ?? "",
      loadId: params.loadId ?? "",
    },
  });

  const payment = await prisma.payment.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      loadId: params.loadId,
      amount,
      status: "REQUIRES_PAYMENT_METHOD",
      provider: "stripe",
      externalId: intent.id,
      currency,
    },
  });

  await prisma.transaction.create({
    data: {
      paymentId: payment.id,
      externalId: intent.id,
      status: intent.status.toUpperCase(),
      rawResponse: intent,
    },
  });

  if (params.loadId) {
    await prisma.loadPayment.create({
      data: {
        tenantId: params.tenantId,
        loadId: params.loadId,
        paymentId: payment.id,
        status: "PENDING",
      },
    });
  }

  return {
    paymentId: payment.id,
    clientSecret: intent.client_secret,
    intentId: intent.id,
    status: intent.status,
  };
}

export async function markPaymentSucceeded(input: {
  stripePaymentIntentId: string;
  rawEvent: unknown;
}) {
  const payments = await prisma.payment.findMany({
    where: {
      provider: "stripe",
      externalId: input.stripePaymentIntentId,
    },
  });

  if (payments.length === 0) {
    return null;
  }

  if (payments.length > 1) {
    // Ambiguous webhook reconciliation; do not arbitrarily pick one payment.
    return null;
  }

  const payment = payments[0];
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
    },
  });

  await prisma.transaction.create({
    data: {
      paymentId: payment.id,
      externalId: input.stripePaymentIntentId,
      status: "SUCCEEDED",
      rawResponse: input.rawEvent as object,
    },
  });

  if (payment.loadId) {
    await prisma.load.updateMany({
      where: { id: payment.loadId, tenantId: payment.tenantId },
      data: { status: "PAID" },
    });

    await prisma.loadPayment.updateMany({
      where: { paymentId: payment.id, loadId: payment.loadId },
      data: { status: "PAID" },
    });
  }

  return updatedPayment;
}
