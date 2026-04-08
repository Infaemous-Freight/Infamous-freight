/**
 * Metrics & Analytics Service (Phase 21.8)
 *
 * Generates investor-grade metrics:
 * - MRR, GMV, Platform Take
 * - Active Users (drivers, shippers)
 * - Job Volume & Growth
 * - Retention & Churn
 */

import { getPrisma } from "../db/prisma.js";

function prismaOrThrow() {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("Database is not configured");
  }
  return prisma;
}

// ============================================
// Metrics Collection
// ============================================

export interface MetricsSnapshot {
  // Revenue
  mrr: number;
  gmv: number;
  platformTake: number;

  // Users
  activeDrivers: number;
  activeShippers: number;
  totalOrgs: number;

  // Activity
  jobsLast30: number;
  jobsLast7: number;
  jobsToday: number;

  // Growth
  newOrgsLast30: number;
  churnedLast30: number;

  // Quality
  avgJobsPerDriver: number;
  avgRevenuePerOrg: number;

  // Engagement
  activeOrgsPercent: number;
  driverRetention: number;

  snapshotDate: Date;
}

/**
 * Calculate current metrics snapshot
 */
export async function getMetricsSnapshot(): Promise<MetricsSnapshot> {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // ============================================
    // REVENUE METRICS
    // ============================================

    // Monthly Recurring Revenue (from subscriptions)
    const billings = await prismaOrThrow().orgBilling.findMany({
      select: { monthlyBase: true },
    });
    const mrr = billings.reduce((sum, b) => sum + b.monthlyBase, 0);

    // Gross Merchandise Value (GMV) - job volumes
    const jobs30 = await prismaOrThrow().job.findMany({
      where: {
        createdAt: { gte: last30Days },
        status: "COMPLETED",
      },
      select: {
        priceUsd: true,
        organizationId: true,
      },
    });
    const gmv = jobs30.reduce((sum, j) => sum + Number(j.priceUsd || 0), 0);

    // Platform Take (our commission)
    // Assuming 10% average across all jobs
    const platformTake = gmv * 0.1;

    // ============================================
    // USER METRICS
    // ============================================

    // Active drivers (completed at least 1 job last 30 days)
    const activeDriverIds = new Set(
      (
        await prismaOrThrow().job.findMany({
          where: {
            driverId: { not: null },
            createdAt: { gte: last30Days },
          },
          select: { driverId: true },
          distinct: ["driverId"],
        })
      ).map((j) => j.driverId),
    );
    const activeDrivers = activeDriverIds.size;

    // Active shippers (created at least 1 job last 30 days)
    const activeShipperIds = new Set(
      (
        await prismaOrThrow().job.findMany({
          where: {
            shipperId: { not: null as any },
            createdAt: { gte: last30Days },
          },
          select: { shipperId: true },
          distinct: ["shipperId"],
        })
      ).map((j) => j.shipperId),
    );
    const activeShippers = activeShipperIds.size;

    // Total organizations
    const totalOrgs = await prismaOrThrow().organization.count({
      where: { isActive: true },
    });

    // ============================================
    // ACTIVITY METRICS
    // ============================================

    const jobsLast30 = jobs30.length;

    const jobsLast7 = (
      await prismaOrThrow().job.findMany({
        where: {
          createdAt: { gte: last7Days },
          status: "COMPLETED",
        },
      })
    ).length;

    const jobsToday = (
      await prismaOrThrow().job.findMany({
        where: {
          createdAt: { gte: yesterday },
          status: "COMPLETED",
        },
      })
    ).length;

    // ============================================
    // GROWTH METRICS
    // ============================================

    const newOrgsLast30 = await prismaOrThrow().organization.count({
      where: {
        createdAt: { gte: last30Days },
      },
    });

    // Churn: subscriptions canceled last 30 days
    const churnedLast30 = await prismaOrThrow().subscription.count({
      where: {
        status: { in: ["canceled", "cancelled"] },
        updatedAt: { gte: last30Days },
      },
    });

    // ============================================
    // QUALITY METRICS
    // ============================================

    // Average jobs per driver
    const driverJobCounts = await prismaOrThrow().job.groupBy({
      by: ["driverId"],
      _count: { id: true },
      where: {
        driverId: { not: null },
        createdAt: { gte: last30Days },
      },
    });
    const avgJobsPerDriver =
      driverJobCounts.length > 0
        ? driverJobCounts.reduce((sum, d) => sum + (d._count?.id ?? 0), 0) / driverJobCounts.length
        : 0;

    // Average revenue per organization
    const orgsWithJobs = new Set(jobs30.map((j) => j.organizationId));
    const avgRevenuePerOrg = orgsWithJobs.size > 0 ? gmv / orgsWithJobs.size : 0;

    // ============================================
    // ENGAGEMENT METRICS
    // ============================================

    // Active orgs as percentage of total
    const activeOrgsPercent = totalOrgs > 0 ? (orgsWithJobs.size / totalOrgs) * 100 : 0;

    // Driver retention (drivers with 2+ jobs in last 30 days vs total)
    const repeatingDrivers = driverJobCounts.filter((d) => (d._count?.id ?? 0) >= 2).length;
    const driverRetention = activeDrivers > 0 ? (repeatingDrivers / activeDrivers) * 100 : 0;

    return {
      mrr: Math.round(mrr * 100) / 100,
      gmv: Math.round(gmv * 100) / 100,
      platformTake: Math.round(platformTake * 100) / 100,

      activeDrivers,
      activeShippers,
      totalOrgs,

      jobsLast30,
      jobsLast7,
      jobsToday,

      newOrgsLast30,
      churnedLast30,

      avgJobsPerDriver: Math.round(avgJobsPerDriver * 100) / 100,
      avgRevenuePerOrg: Math.round(avgRevenuePerOrg * 100) / 100,

      activeOrgsPercent: Math.round(activeOrgsPercent * 100) / 100,
      driverRetention: Math.round(driverRetention * 100) / 100,

      snapshotDate: now,
    };
  } catch (err) {
    console.error("[Metrics] Failed to calculate metrics:", err);
    throw err;
  }
}

/**
 * Store metrics snapshot in database
 */
export async function storeMetricsSnapshot(metrics: MetricsSnapshot): Promise<any> {
  return prismaOrThrow().metricsSnapshot.create({
    data: {
      mrr: metrics.mrr,
      gmv: metrics.gmv,
      platformTake: metrics.platformTake,
      activeDrivers: metrics.activeDrivers,
      activeShippers: metrics.activeShippers,
      totalOrgs: metrics.totalOrgs,
      jobsLast30: metrics.jobsLast30,
      jobsLast7: metrics.jobsLast7,
      jobsToday: metrics.jobsToday,
      newOrgsLast30: metrics.newOrgsLast30,
      churnedLast30: metrics.churnedLast30,
      avgJobsPerDriver: metrics.avgJobsPerDriver,
      avgRevenuePerOrg: metrics.avgRevenuePerOrg,
      activeOrgsPercent: metrics.activeOrgsPercent,
      driverRetention: metrics.driverRetention,
      snapshotDate: metrics.snapshotDate,
    },
  });
}

/**
 * Get historical metrics (trend analysis)
 */
export async function getMetricsTrend(days: number = 30): Promise<any[]> {
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return prismaOrThrow().metricsSnapshot.findMany({
    where: {
      snapshotDate: { gte: sinceDate },
    },
    orderBy: { snapshotDate: "asc" },
  });
}

/**
 * Calculate growth rates
 */
export async function getGrowthRates(): Promise<any> {
  const today = await getMetricsSnapshot();
  const snapshots = await getMetricsTrend(30);

  if (snapshots.length === 0) {
    return null;
  }

  const previousMonth = snapshots[0];

  return {
    mrrGrowth: {
      absolute: today.mrr - previousMonth.mrr,
      percent: (((today.mrr - previousMonth.mrr) / previousMonth.mrr) * 100).toFixed(2),
    },
    driverGrowth: {
      absolute: today.activeDrivers - previousMonth.activeDrivers,
      percent: (
        ((today.activeDrivers - previousMonth.activeDrivers) / previousMonth.activeDrivers) *
        100
      ).toFixed(2),
    },
    gmvGrowth: {
      absolute: today.gmv - previousMonth.gmv,
      percent: (((today.gmv - previousMonth.gmv) / previousMonth.gmv) * 100).toFixed(2),
    },
    orgGrowth: {
      absolute: today.totalOrgs - previousMonth.totalOrgs,
      percent: (
        ((today.totalOrgs - previousMonth.totalOrgs) / previousMonth.totalOrgs) *
        100
      ).toFixed(2),
    },
  };
}

/**
 * Get KPIs for investor pitch
 */
export async function getInvestorKpis(): Promise<any> {
  const metrics = await getMetricsSnapshot();
  const growth = await getGrowthRates();

  return {
    headline: {
      mrr: `$${metrics.mrr.toLocaleString()}`,
      gmv: `$${metrics.gmv.toLocaleString()}`,
      activeUsers: metrics.activeDrivers + metrics.activeShippers,
    },
    growth: growth,
    metrics: metrics,
    timestamp: new Date().toISOString(),
  };
}

export default {
  getMetricsSnapshot,
  storeMetricsSnapshot,
  getMetricsTrend,
  getGrowthRates,
  getInvestorKpis,
};
