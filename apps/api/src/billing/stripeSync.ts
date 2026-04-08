/**
 * Stripe Subscription Sync Service (Phase 20.3)
 *
 * Manages subscription creation, updates, and cancellations
 * Syncs org billing with Stripe's subscription model
 */

import type Stripe from "stripe";
import { getPrisma } from "../db/prisma.js";
import { getStripeClient } from "./stripeClient.js";

const BillingPlan = {
  STARTER: "STARTER",
  GROWTH: "GROWTH",
  ENTERPRISE: "ENTERPRISE",
} as const;
type BillingPlan = (typeof BillingPlan)[keyof typeof BillingPlan];

function prismaOrThrow() {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("Database is not configured");
  }
  return prisma;
}

// Stripe price IDs from environment (created in Stripe dashboard)
const STRIPE_PRICES: Partial<Record<BillingPlan, string>> = {
  [BillingPlan.STARTER]: process.env.STRIPE_PRICE_STARTER || "",
  [BillingPlan.GROWTH]: process.env.STRIPE_PRICE_GROWTH || process.env.STRIPE_PRICE_PRO || "",
  [BillingPlan.ENTERPRISE]: process.env.STRIPE_PRICE_ENTERPRISE || "",
};

const PLAN_DETAILS: Partial<
  Record<BillingPlan, { monthlyBase: number; monthlyQuota: number; overagePrice: number }>
> = {
  [BillingPlan.STARTER]: {
    monthlyBase: 79,
    monthlyQuota: 500,
    overagePrice: 0.15,
  },
  [BillingPlan.GROWTH]: {
    monthlyBase: 199,
    monthlyQuota: 2500,
    overagePrice: 0.08,
  },
  [BillingPlan.ENTERPRISE]: {
    monthlyBase: 599,
    monthlyQuota: 999999, // Unlimited
    overagePrice: 0,
  },
};

/**
 * Create a Stripe customer and subscription for a new organization
 */
export async function createStripeSubscription(
  organizationId: string,
  orgName: string,
  plan: BillingPlan = BillingPlan.STARTER,
  email?: string,
): Promise<{
  customerId: string;
  subscriptionId: string;
  status: string;
}> {
  try {
    // 1. Create Stripe customer
    const customer = await getStripeClient().customers.create({
      name: orgName,
      email: email || `billing@${orgName.toLowerCase().replace(/\s+/g, "-")}.local`,
      metadata: {
        organizationId,
        createdAt: new Date().toISOString(),
      },
    });

    console.log(`Created Stripe customer ${customer.id} for org ${organizationId}`);

    // 2. Create subscription
    const priceId = STRIPE_PRICES[plan];
    if (!priceId) {
      throw new Error(
        `No Stripe price ID configured for plan: ${plan}. ` +
          `Set STRIPE_PRICE_${plan.toUpperCase()} in .env`,
      );
    }

    const subscription = await getStripeClient().subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        organizationId,
        plan,
      },
    });

    console.log(
      `Created Stripe subscription ${subscription.id} (${plan}) for org ${organizationId}`,
    );

    // 3. Update OrgBilling record
    await prismaOrThrow().orgBilling.upsert({
      where: { organizationId },
      create: {
        organizationId,
        plan,
        stripeCustomerId: customer.id,
        stripeSubId: subscription.id,
        stripeStatus: subscription.status,
        monthlyBase: PLAN_DETAILS[plan]!.monthlyBase,
        monthlyQuota: PLAN_DETAILS[plan]!.monthlyQuota,
        overagePrice: PLAN_DETAILS[plan]!.overagePrice,
        billingCycleStart: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        plan,
        stripeCustomerId: customer.id,
        stripeSubId: subscription.id,
        stripeStatus: subscription.status,
        monthlyBase: PLAN_DETAILS[plan]!.monthlyBase,
        monthlyQuota: PLAN_DETAILS[plan]!.monthlyQuota,
        overagePrice: PLAN_DETAILS[plan]!.overagePrice,
      },
    });

    return {
      customerId: customer.id,
      subscriptionId: subscription.id,
      status: subscription.status,
    };
  } catch (error) {
    console.error("Failed to create Stripe subscription", {
      organizationId,
      plan,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Update subscription plan (upgrade/downgrade)
 */
export async function updateSubscriptionPlan(
  organizationId: string,
  newPlan: BillingPlan,
): Promise<void> {
  try {
    const billing = await prismaOrThrow().orgBilling.findUnique({
      where: { organizationId },
    });

    if (!billing?.stripeSubId) {
      throw new Error(`Organization ${organizationId} has no active Stripe subscription`);
    }

    const priceId = STRIPE_PRICES[newPlan];
    if (!priceId) {
      throw new Error(`No Stripe price ID configured for plan: ${newPlan}`);
    }

    // Get current subscription to find item ID
    const subscription = await getStripeClient().subscriptions.retrieve(billing.stripeSubId);
    const itemId = subscription.items.data[0].id;

    // Update subscription item with new price
    await getStripeClient().subscriptionItems.update(itemId, {
      price: priceId,
    });

    // Update database
    const planDetails = PLAN_DETAILS[newPlan];
    if (!planDetails) throw new Error(`No plan details configured for plan: ${newPlan}`);
    await prismaOrThrow().orgBilling.update({
      where: { organizationId },
      data: {
        plan: newPlan,
        monthlyBase: planDetails.monthlyBase,
        monthlyQuota: planDetails.monthlyQuota,
        overagePrice: planDetails.overagePrice,
      },
    });

    console.log(`Updated subscription for org ${organizationId} to ${newPlan}`);
  } catch (error) {
    console.error("Failed to update subscription plan", {
      organizationId,
      newPlan,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Cancel an organization's subscription
 */
export async function cancelSubscription(
  organizationId: string,
  immediately: boolean = false,
): Promise<void> {
  try {
    const billing = await prismaOrThrow().orgBilling.findUnique({
      where: { organizationId },
    });

    if (!billing?.stripeSubId) {
      console.warn(
        `No Stripe subscription found for org ${organizationId}. Skipping cancellation.`,
      );
      return;
    }

    // Cancel subscription
    const canceledAt = immediately ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await getStripeClient().subscriptions.update(billing.stripeSubId, {
      cancel_at: immediately ? null : Math.floor(canceledAt!.getTime() / 1000),
    });

    // Update database
    await prismaOrThrow().orgBilling.update({
      where: { organizationId },
      data: {
        stripeStatus: immediately ? "canceled" : "active", // Will transition after cancel_at
      },
    });

    console.log(`Canceled subscription for org ${organizationId} (immediately: ${immediately})`);
  } catch (error) {
    console.error("Failed to cancel subscription", {
      organizationId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Sync Stripe subscription status with database
 * Call this periodically or via webhook to keep data in sync
 */
export async function syncSubscriptionStatus(organizationId: string): Promise<void> {
  try {
    const billing = await prismaOrThrow().orgBilling.findUnique({
      where: { organizationId },
    });

    if (!billing?.stripeSubId) {
      return;
    }

    const subscription = await getStripeClient().subscriptions.retrieve(billing.stripeSubId);

    // Update status
    await prismaOrThrow().orgBilling.update({
      where: { organizationId },
      data: {
        stripeStatus: subscription.status,
        billingCycleStart: new Date((subscription as any).current_period_start * 1000),
        nextBillingDate: new Date((subscription as any).current_period_end * 1000),
      },
    });

    console.log(`Synced subscription status for org ${organizationId}: ${subscription.status}`);
  } catch (error) {
    console.error("Failed to sync subscription status", {
      organizationId,
      error: (error as Error).message,
    });
  }
}

/**
 * Get subscription details for customer portal or display
 */
export async function getSubscriptionDetails(organizationId: string) {
  try {
    const billing = await prismaOrThrow().orgBilling.findUnique({
      where: { organizationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!billing?.stripeSubId) {
      return null;
    }

    const subscription = await getStripeClient().subscriptions.retrieve(billing.stripeSubId);
    const customer = await getStripeClient().customers.retrieve(billing.stripeCustomerId || "");

    return {
      organization: billing.organization,
      plan: billing.plan,
      status: subscription.status,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      items: subscription.items.data.map((item) => ({
        priceId: item.price.id,
        quantity: item.quantity,
        billingPeriod: item.price.recurring?.interval,
      })),
      customer: {
        email: (customer as Stripe.Customer).email,
        name: (customer as Stripe.Customer).name,
      },
    };
  } catch (error) {
    console.error("Failed to get subscription details", {
      organizationId,
      error: (error as Error).message,
    });
    return null;
  }
}

export default {
  createStripeSubscription,
  updateSubscriptionPlan,
  cancelSubscription,
  syncSubscriptionStatus,
  getSubscriptionDetails,
};
