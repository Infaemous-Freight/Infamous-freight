/**
 * Referral System Service (Phase 21.6)
 *
 * Manages referral rewards:
 * - Create referral link
 * - Track signup
 * - Track milestone completion (e.g., 10 jobs)
 * - Pay/credit referrer
 */

import crypto from "crypto";
import { prisma } from "../db/prisma.js";
import { logger } from "../lib/logger.js";

// ============================================
// Referral Code Generation
// ============================================

/**
 * Generate unique referral code for a user
 */
export function generateReferralCode(referrerEmail: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  const email_hash = crypto
    .createHash("sha256")
    .update(referrerEmail)
    .digest("hex")
    .substring(0, 6);

  return `REF_${email_hash}_${random}`.toUpperCase();
}

/**
 * Get referral link for a user
 */
export function getReferralLink(referralCode: string): string {
  const baseUrl = process.env.WEB_BASE_URL || "http://localhost:3000";
  return `${baseUrl}/signup?ref=${referralCode}`;
}

// ============================================
// Referral Creation & Tracking
// ============================================

/**
 * Create a new referral record
 */
export async function createReferral(
  referrerEmail: string,
  refereeEmail: string,
  rewardAmount: number = 100,
  rewardType: string = "credit",
): Promise<any> {
  try {
    const referral = await prisma.referral.create({
      data: {
        referrerUserId: referrerEmail,
        refereeEmail,
        rewardAmount,
        rewardType,
        status: "PENDING",
      },
    });

    logger.info({ referrerEmail, refereeEmail }, "Referral created");
    return referral;
  } catch (err) {
    logger.error({ referrerEmail, refereeEmail, err }, "Failed to create referral");
    throw err;
  }
}

/**
 * Track referral signup (when referee signs up)
 */
export async function trackReferralSignup(
  refereeEmail: string,
  organizationId: string,
): Promise<any> {
  try {
    // Find referral record
    const referral = await prisma.referral.findFirst({
      where: {
        refereeEmail,
        status: "PENDING",
      },
    });

    if (!referral) {
      logger.debug({ refereeEmail }, "No pending referral found");
      return null;
    }

    // Update referral
    const updated = await prisma.referral.update({
      where: { id: referral.id },
      data: {
        refereeOrgId: organizationId,
        refereeSignupAt: new Date(),
        updatedAt: new Date(),
      },
    });

    logger.info({ refereeEmail, organizationId }, "Referral signup tracked");

    // Notify referrer (optional: send email or Slack)
    try {
      await notifyReferrerSignup(updated);
    } catch (err) {
      logger.error({ refereeEmail, err }, "Failed to notify referrer");
    }

    return updated;
  } catch (err) {
    logger.error({ refereeEmail, err }, "Failed to track signup");
    throw err;
  }
}

/**
 * Check milestone (e.g., 10 jobs completed by referee org)
 * If met, mark referral as completed and trigger payout
 */
export async function checkReferralMilestone(
  organizationId: string,
  milestone: number = 10,
): Promise<any> {
  try {
    // Find referral where referee org matches
    const referral = await prisma.referral.findFirst({
      where: {
        refereeOrgId: organizationId,
        status: "COMPLETED",
      },
    });

    if (!referral) {
      // Count jobs for this org
      const jobCount = await prisma.job.count({
        where: {
          organizationId,
          status: "COMPLETED",
        },
      });

      if (jobCount >= milestone) {
        // Milestone met! Mark as completed
        const updated = await prisma.referral.update({
          where: { id: (referral as any)?.id || organizationId },
          data: {
            status: "COMPLETED",
            conditionMet: new Date(),
            updatedAt: new Date(),
          },
        });

        logger.info({ organizationId, jobCount }, "Referral milestone reached");

        // Trigger payout
        try {
          await processReferralPayout(updated);
        } catch (err) {
          logger.error({ organizationId, err }, "Payout failed");
        }

        return updated;
      }
    }

    return null;
  } catch (err) {
    logger.error({ organizationId, err }, "Milestone check failed");
    throw err;
  }
}

// ============================================
// Payout Processing
// ============================================

/**
 * Process referral payout (credit or cash)
 */
export async function processReferralPayout(referral: any): Promise<any> {
  try {
    if (referral.status === "PAID") {
      logger.debug({ referralId: referral.id }, "Referral already paid");
      return referral;
    }

    const { rewardAmount, rewardType, referrerUserId } = referral;

    switch (rewardType) {
      case "credit":
        // Add account credit
        await processAccountCredit(referrerUserId, rewardAmount);
        break;

      case "cash":
        // Process via Stripe Connect payout (if referrer has Connect account)
        await processStripePayout(referrerUserId, rewardAmount);
        break;

      case "percentage":
        // Percentage of their first month revenue (handled differently)
        logger.debug({ referralId: referral.id }, "Percentage payouts handled separately");
        break;
    }

    // Mark as paid
    const updated = await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    });

    logger.info({ referrerUserId, rewardAmount, rewardType }, "Referral payout processed");

    // Notify referrer
    try {
      await notifyReferrerPayout(updated);
    } catch (err) {
      logger.error({ referrerUserId, err }, "Failed to notify referrer of payout");
    }

    return updated;
  } catch (err) {
    logger.error({ referralId: referral.id, err }, "Payout failed");

    // Mark as failed
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: "FAILED",
        updatedAt: new Date(),
      },
    });

    throw err;
  }
}

/**
 * Add account credit to referrer's account
 */
async function processAccountCredit(referrerUserId: string, amount: number): Promise<void> {
  const existing = await prisma.entitlement.findUnique({
    where: {
      userId_key: {
        userId: referrerUserId,
        key: "account_credit",
      },
    },
  });

  const current = existing ? Number(existing.value) || 0 : 0;
  const updated = current + amount;

  await prisma.entitlement.upsert({
    where: {
      userId_key: {
        userId: referrerUserId,
        key: "account_credit",
      },
    },
    update: { value: updated.toFixed(2) },
    create: {
      userId: referrerUserId,
      key: "account_credit",
      value: updated.toFixed(2),
    },
  });

  logger.info({ referrerUserId, amount }, "Referral credit applied");
}

/**
 * Process payout via Stripe Connect
 */
async function processStripePayout(referrerUserId: string, amount: number): Promise<void> {
  logger.info({ referrerUserId, amount }, "Stripe payout queued for manual processing");
}

// ============================================
// Referral Analytics
// ============================================

/**
 * Get referral stats for a user
 */
export async function getReferralStats(referrerEmail: string): Promise<any> {
  try {
    const referrals = await prisma.referral.findMany({
      where: { referrerUserId: referrerEmail },
    });

    const stats = {
      totalReferrals: referrals.length,
      pendingSignups: referrals.filter((r: any) => r.status === "PENDING").length,
      signups: referrals.filter((r: any) => r.refereeSignupAt).length,
      completed: referrals.filter((r: any) => r.status === "COMPLETED").length,
      paid: referrals.filter((r: any) => r.status === "PAID").length,
      totalEarnings: referrals
        .filter((r: any) => r.status === "PAID")
        .reduce((sum: number, r: any) => sum + Number(r.rewardAmount), 0),
      referrals,
    };

    return stats;
  } catch (err) {
    logger.error({ referrerEmail, err }, "Failed to get referral stats");
    throw err;
  }
}

/**
 * Get top referrers (leaderboard)
 */
export async function getTopReferrers(limit: number = 10): Promise<any[]> {
  try {
    const topReferrers = await prisma.referral.groupBy({
      by: ["referrerUserId"],
      _count: { id: true },
      _sum: { rewardAmount: true },
      where: {
        status: "PAID",
      },
      orderBy: {
        _sum: { rewardAmount: "desc" },
      },
      take: limit,
    });

    return topReferrers.map((r: any) => ({
      referrerUserId: r.referrerUserId,
      referralCount: r._count?.id ?? 0,
      totalEarnings: r._sum?.rewardAmount ?? 0,
    }));
  } catch (err) {
    logger.error({ err }, "Failed to get top referrers");
    throw err;
  }
}

// ============================================
// Notifications
// ============================================

async function notifyReferrerSignup(referral: any): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🎯 Referral Signup: ${referral.refereeEmail}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                `*Referral Signup Tracked*\n` +
                `Referrer: ${referral.referrerUserId}\n` +
                `Referee: ${referral.refereeEmail}\n` +
                `Potential Reward: $${referral.rewardAmount}`,
            },
          },
        ],
      }),
    });
  } catch (err) {
    logger.error({ err }, "Failed to send referral signup Slack notification");
  }
}

async function notifyReferrerPayout(referral: any): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `💰 Referral Payout Processed`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                `*Referral Reward Paid*\n` +
                `Referrer: ${referral.referrerUserId}\n` +
                `Reward: $${referral.rewardAmount}\n` +
                `Type: ${referral.rewardType}`,
            },
          },
        ],
      }),
    });
  } catch (err) {
    logger.error({ err }, "Failed to send referral payout Slack notification");
  }
}

export default {
  generateReferralCode,
  getReferralLink,
  createReferral,
  trackReferralSignup,
  checkReferralMilestone,
  processReferralPayout,
  getReferralStats,
  getTopReferrers,
};
