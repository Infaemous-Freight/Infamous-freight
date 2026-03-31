import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";

export const dashboardRoutes: Router = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

dashboardRoutes.get("/revenue-overview", requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.auth?.organizationId || req.user?.organizationId || req.user?.tenantId;
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
