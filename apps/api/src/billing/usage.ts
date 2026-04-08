/**
 * Usage Metering Service (Phase 20.4)
 *
 * Tracks job completions per organization per month
 * Calculates revenue and overage charges
 * Updates Stripe subscription items with usage
 */

import { getPrisma } from "../db/prisma.js";
import { getStripeClient } from "./stripeClient.js";

function prismaOrThrow() {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("Database is not configured");
  }
  return prisma;
}

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Calculate platform fee based on vehicle type
 * Returns: { baseFee, percentFee, total }
 */
export function calculatePlatformFee(vehicleType: string, jobPrice: number) {
  const fees: Record<string, { baseFee: number; percent: number }> = {
    CAR: { baseFee: 5, percent: 0.08 },
    SUV: { baseFee: 5, percent: 0.08 },
    VAN: { baseFee: 8, percent: 0.1 },
    BOX_TRUCK: { baseFee: 15, percent: 0.12 },
    STRAIGHT_TRUCK: { baseFee: 25, percent: 0.15 },
    SEMI: { baseFee: 25, percent: 0.15 },
  };

  const fee = fees[vehicleType] || fees.CAR;
  const percentFee = Math.round(jobPrice * fee.percent);
  const total = fee.baseFee + percentFee;

  return {
    baseFee: fee.baseFee,
    percentFee,
    percent: fee.percent,
    total,
  };
}

/**
 * Record a job completion and update usage metrics
 * Call this when a job status transitions to COMPLETED
 */
export async function recordJobCompletion(
  organizationId: string,
  jobId: string,
  vehicleType: string,
  jobPrice: number, // in dollars
): Promise<{
  month: string;
  totalJobs: number;
  overageJobs: number;
  revenue: number;
  overageCharge: number;
}> {
  try {
    const month = getCurrentMonth();
    const platformFee = calculatePlatformFee(vehicleType, jobPrice);

    // Get billing plan to check quota
    const billing = await prismaOrThrow().orgBilling.findUnique({
      where: { organizationId },
      select: {
        monthlyQuota: true,
        overagePrice: true,
        plan: true,
      },
    });

    if (!billing) {
      throw new Error(`No billing record found for organization ${organizationId}`);
    }

    // Update or create usage record
    const usage = await prismaOrThrow().orgUsage.upsert({
      where: { organizationId_month: { organizationId, month } },
      update: {
        jobs: { increment: 1 },
        revenue: { increment: platformFee.total },
      },
      create: {
        organizationId,
        month,
        jobs: 1,
        revenue: platformFee.total,
      },
    });

    // Calculate overage
    const overageJobs = Math.max(0, usage.jobs - billing.monthlyQuota);
    const overageCharge = overageJobs * billing.overagePrice;

    // Update overage information
    if (overageJobs > 0) {
      await prismaOrThrow().orgUsage.update({
        where: { organizationId_month: { organizationId, month } },
        data: {
          overageJobs,
          overageCharge,
        },
      });
    }

    // Update Stripe metered usage if subscription exists
    await updateStripeUsage(organizationId);

    console.log("Job completion recorded", {
      organizationId,
      jobId,
      month,
      platformFee: platformFee.total,
      totalJobs: usage.jobs,
      overageJobs,
      overageCharge,
    });

    return {
      month,
      totalJobs: usage.jobs,
      overageJobs,
      revenue: usage.revenue,
      overageCharge,
    };
  } catch (error) {
    console.error("Failed to record job completion", {
      organizationId,
      jobId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Update Stripe metered usage record
 * For metered billing (overages), reports quantity to Stripe
 */
async function updateStripeUsage(organizationId: string): Promise<void> {
  try {
    const billing = await prismaOrThrow().orgBilling.findUnique({
      where: { organizationId },
      select: {
        stripeSubId: true,
        monthlyQuota: true,
      },
    });

    if (!billing?.stripeSubId) {
      return; // No Stripe subscription
    }

    const month = getCurrentMonth();
    const usage = await prismaOrThrow().orgUsage.findUnique({
      where: { organizationId_month: { organizationId, month } },
    });

    if (!usage || usage.overageJobs <= 0) {
      return; // No overage
    }

    // Retrieve subscription to get metered item
    const subscription = await getStripeClient().subscriptions.retrieve(billing.stripeSubId);
    const meteredItem = subscription.items.data.find(
      (item) => item.price.billing_scheme === "tiered",
    );

    if (!meteredItem) {
      console.warn(`No metered billing item found in subscription for org ${organizationId}`);
      return;
    }

    // Report usage to Stripe (cast to any for Stripe API v2 meter events compat)
    await (getStripeClient().subscriptionItems as any).createUsageRecord(meteredItem.id, {
      quantity: usage.overageJobs,
      timestamp: Math.floor(Date.now() / 1000),
      action: "set", // Set absolute quantity for the period
    });

    console.log("Reported Stripe usage", {
      organizationId,
      overageJobs: usage.overageJobs,
      subscriptionItemId: meteredItem.id,
    });
  } catch (error) {
    console.error("Failed to update Stripe usage", {
      organizationId,
      error: (error as Error).message,
    });
    // Don't throw - usage reporting is best-effort
  }
}

/**
 * Get current month usage for an organization
 */
export async function getMonthlyUsage(organizationId: string, month?: string) {
  try {
    const queryMonth = month || getCurrentMonth();

    const usage = await prismaOrThrow().orgUsage.findUnique({
      where: { organizationId_month: { organizationId, month: queryMonth } },
      include: {
        organization: {
          select: {
            name: true,
            billing: {
              select: {
                plan: true,
                monthlyQuota: true,
                overagePrice: true,
              },
            },
          },
        },
      },
    });

    return usage;
  } catch (error) {
    console.error("Failed to get monthly usage", {
      organizationId,
      month,
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Get usage summary for a date range
 */
export async function getUsageSummary(organizationId: string, fromMonth: string, toMonth: string) {
  try {
    const usageRecords = await prismaOrThrow().orgUsage.findMany({
      where: {
        organizationId,
        month: {
          gte: fromMonth,
          lte: toMonth,
        },
      },
      orderBy: { month: "asc" },
    });

    const summary = {
      organizationId,
      period: { from: fromMonth, to: toMonth },
      totalJobs: usageRecords.reduce((sum, u) => sum + u.jobs, 0),
      totalRevenue: usageRecords.reduce((sum, u) => sum + u.revenue, 0),
      totalOverageJobs: usageRecords.reduce((sum, u) => sum + u.overageJobs, 0),
      totalOverageCharge: usageRecords.reduce((sum, u) => sum + u.overageCharge, 0),
      records: usageRecords,
    };

    return summary;
  } catch (error) {
    console.error("Failed to get usage summary", {
      organizationId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Reset monthly usage (for testing or corrections)
 * Usually called at month boundary
 */
export async function resetMonthlyUsage(organizationId: string): Promise<void> {
  try {
    const month = getCurrentMonth();

    await prismaOrThrow().orgUsage.deleteMany({
      where: { organizationId, month },
    });

    console.log(`Reset monthly usage for org ${organizationId} (month: ${month})`);
  } catch (error) {
    console.error("Failed to reset monthly usage", {
      organizationId,
      error: (error as Error).message,
    });
    throw error;
  }
}

export default {
  calculatePlatformFee,
  recordJobCompletion,
  getMonthlyUsage,
  getUsageSummary,
  resetMonthlyUsage,
};
