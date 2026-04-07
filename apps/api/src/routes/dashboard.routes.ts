import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";

export const dashboardRoutes: Router = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

const resolveOrganizationId = (req: Request): string | undefined => {
  return req.auth?.organizationId || req.user?.organizationId || req.user?.tenantId;
};

dashboardRoutes.get("/revenue-overview", requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = resolveOrganizationId(req);
    if (!organizationId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const now = new Date();
    const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    const [billingRows, failedPayments, usageThisMonth] = await Promise.all([
      prisma.orgBilling.findMany({
        where: { stripeStatus: { in: ["active", "trialing", "past_due"] } },
        select: { monthlyBase: true },
      }),
      prisma.orgBilling.count({ where: { stripeStatus: "past_due" } }),
      prisma.usageMetric.aggregate({
        _sum: { quantity: true },
        where: { organizationId, metricType: "ai_action", month },
      }),
    ]);

    const mrr = billingRows.reduce((sum, row) => sum + row.monthlyBase, 0);
    const arr = mrr * 12;
    const churnRisk = billingRows.length > 0 ? failedPayments / billingRows.length : 0;

    res.json({
      mrr,
      arr,
      churnRisk,
      failedPayments,
      usageThisMonth: usageThisMonth._sum.quantity || 0,
    });
  } catch (_error) {
    res.status(500).json({ error: "Failed to get revenue overview" });
  }
});

dashboardRoutes.get("/driver-leaderboard", requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = resolveOrganizationId(req);
    if (!organizationId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const tenantId = req.user?.tenantId;

    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const leaderboard = await prisma.carrierScore.findMany({
      where: { tenantId },
      orderBy: [{ score: "desc" }, { onTimeRate: "desc" }, { computedAt: "desc" }],
      take: limit,
      select: {
        driverId: true,
        score: true,
        riskLevel: true,
        onTimeRate: true,
        cancelRate: true,
        computedAt: true,
      },
    });

    res.json({
      success: true,
      data: leaderboard.map((driver, index) => ({
        rank: index + 1,
        ...driver,
      })),
    });
  } catch (_error) {
    res.status(500).json({ error: "Failed to get driver leaderboard" });
  }
});

dashboardRoutes.get("/customer-tracking-link/:trackingId", requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = resolveOrganizationId(req);
    if (!organizationId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { trackingId } = req.params;
    const shipment = await prisma.shipment.findFirst({
      where: {
        trackingId,
        OR: [{ tenantId: organizationId }, { orgId: organizationId }],
      },
      select: {
        id: true,
        trackingId: true,
        status: true,
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const trackingToken = Buffer.from(`${shipment.id}:${organizationId}:${expiresAt.toISOString()}`).toString(
      "base64url",
    );

    res.json({
      success: true,
      data: {
        trackingId: shipment.trackingId,
        status: shipment.status,
        expiresAt: expiresAt.toISOString(),
        trackingLink: `/track/${shipment.trackingId}?token=${trackingToken}`,
      },
    });
  } catch (_error) {
    res.status(500).json({ error: "Failed to create customer tracking link" });
  }
});

dashboardRoutes.get("/route-optimization", requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const recentDecisions = await prisma.aiDecisionLog.findMany({
      where: {
        tenantId,
        module: { contains: "DISPATCH", mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        module: true,
        confidence: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        totalRecentDecisions: recentDecisions.length,
        averageConfidence:
          recentDecisions.length > 0
            ? recentDecisions.reduce((sum, item) => sum + (item.confidence || 0), 0) / recentDecisions.length
            : 0,
        recentDecisions,
      },
    });
  } catch (_error) {
    res.status(500).json({ error: "Failed to get route optimization insights" });
  }
});

dashboardRoutes.get("/proof-of-delivery", requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = resolveOrganizationId(req);
    if (!organizationId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const deliveredFilter = { organizationId, status: { in: ["DELIVERED", "COMPLETED"] as const } };

    const [deliveredJobs, jobsWithPodAssets] = await Promise.all([
      prisma.job.count({ where: deliveredFilter }),
      prisma.job.count({
        where: {
          ...deliveredFilter,
          podAssets: { some: {} },
        },
      }),
    ]);

    const podComplianceRate = deliveredJobs > 0 ? jobsWithPodAssets / deliveredJobs : 0;

    res.json({
      success: true,
      data: {
        deliveredJobs,
        jobsWithPodAssets,
        podComplianceRate,
      },
    });
  } catch (_error) {
    res.status(500).json({ error: "Failed to get proof-of-delivery summary" });
  }
});

dashboardRoutes.get("/geofence-alerts", requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = resolveOrganizationId(req);
    if (!organizationId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const recentAlerts = await prisma.jobEvent.findMany({
      where: {
        job: { organizationId },
        OR: [
          { message: { contains: "geofence", mode: "insensitive" } },
          { message: { contains: "arriv", mode: "insensitive" } },
          { message: { contains: "depart", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        jobId: true,
        message: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        totalRecentAlerts: recentAlerts.length,
        recentAlerts,
      },
    });
  } catch (_error) {
    res.status(500).json({ error: "Failed to get geofence alerts" });
  }
});
