import { Prisma } from '@prisma/client';

/**
 * Metered Billing Service
 * Tracks usage across all tiers and automatically charges for overages
 */

export class MeteredBillingService {
  static async recordUsage(
    userId: string,
    metricType: 'api_calls' | 'shipments',
    quantity: number,
    tier: 'free' | 'pro' | 'enterprise'
  ) {
    // Log usage to database
    await Prisma.usageMetric.create({
      data: {
        userId,
        metricType,
        quantity,
        tier,
        recordedAt: new Date(),
      },
    });

    // Check if tier has overage charges
    if (this.hasOverage(tier, metricType, quantity)) {
      const overage = this.calculateOverage(tier, metricType, quantity);
      
      // Log for billing
      await Prisma.overageCharge.create({
        data: {
          userId,
          metricType,
          quantity: overage.quantity,
          ratePerUnit: overage.ratePerUnit,
          totalCharge: overage.totalCharge,
          chargedAt: new Date(),
        },
      });
    }
  }

  private static hasOverage(
    tier: string,
    metricType: string,
    quantity: number
  ): boolean {
    const limits = {
      free: { api_calls: 100, shipments: 10 },
      pro: { api_calls: 1000, shipments: 1000 },
      enterprise: { api_calls: -1, shipments: -1 }, // -1 = unlimited
    };

    const limit = limits[tier]?.[metricType];
    if (limit === -1) return false; // Unlimited
    return quantity > limit;
  }

  private static calculateOverage(
    tier: string,
    metricType: string,
    quantity: number
  ) {
    const limits = {
      free: { api_calls: 100, shipments: 10 },
      pro: { api_calls: 1000, shipments: 1000 },
    };

    const rates = {
      api_calls: { tier_pro: 0.0001, tier_enterprise: 0.00001 },
      shipments: { tier_pro: 0.01, tier_enterprise: 0 },
    };

    const limit = limits[tier]?.[metricType] || 0;
    const overage = Math.max(0, quantity - limit);
    const ratePerUnit = rates[metricType]?.[`tier_${tier}`] || 0;

    return {
      quantity: overage,
      ratePerUnit,
      totalCharge: overage * ratePerUnit,
    };
  }

  static async getMonthlyUsage(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await Prisma.usageMetric.groupBy({
      by: ['metricType'],
      where: {
        userId,
        recordedAt: { gte: startOfMonth },
      },
      _sum: {
        quantity: true,
      },
    });

    const overages = await Prisma.overageCharge.aggregate({
      where: {
        userId,
        chargedAt: { gte: startOfMonth },
      },
      _sum: {
        totalCharge: true,
      },
    });

    return {
      usage: usage.reduce((acc, u) => ({ ...acc, [u.metricType]: u._sum.quantity }), {}),
      overage_charges: overages._sum.totalCharge || 0,
    };
  }
}
