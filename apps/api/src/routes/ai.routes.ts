import { Router, Request, Response, NextFunction } from "express";
import { aiDispatchService } from "../services/ai-dispatch.service.js";
import { CarrierIntelligenceService } from "../services/carrier-intelligence.service.js";

const carrierIntelligenceService = new CarrierIntelligenceService();
import { smartPricingService } from "../services/smart-pricing.service.js";
import { predictiveOperationsService } from "../services/predictive-operations.service.js";
import { prisma } from "../db/prisma.js";


const router: Router = Router();
const PLAN_ACTION_LIMITS: Record<string, number> = {
  STARTER: 100,
  GROWTH: 1000,
  ENTERPRISE: Number.MAX_SAFE_INTEGER,
  CUSTOM: Number.MAX_SAFE_INTEGER,
};

/**
 * Middleware: Require authentication and tenant context
 */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

const requireActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.auth?.organizationId || req.user?.organizationId || req.user?.tenantId;
    if (!organizationId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const subscription = await prisma.orgBilling.findUnique({
      where: { organizationId },
      select: { stripeStatus: true, plan: true },
    });

    const status = String(subscription?.stripeStatus || "incomplete").toLowerCase();
    if (status !== "active" && status !== "trialing") {
      return res.status(402).json({ error: "Subscription required" });
    }

    res.locals.subscriptionPlan = String(subscription?.plan || "STARTER").toUpperCase();
    next();
  } catch (error) {
    next(error);
  }
};

const enforceUsageLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.auth?.organizationId || req.user?.organizationId || req.user?.tenantId;
    if (!organizationId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = String(res.locals.subscriptionPlan || "STARTER").toUpperCase();
    const limit = PLAN_ACTION_LIMITS[plan] ?? PLAN_ACTION_LIMITS.STARTER;
    if (!Number.isFinite(limit)) {
      return next();
    }

    const now = new Date();
    const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    const usage = await prisma.usageMetric.aggregate({
      _sum: { quantity: true },
      where: {
        organizationId,
        metricType: "ai_action",
        month,
      },
    });

    const used = usage._sum.quantity || 0;
    if (used >= limit) {
      return res.status(403).json({ error: "Usage limit exceeded" });
    }

    res.locals.usageLimit = limit;
    res.locals.usageUsed = used;
    next();
  } catch (error) {
    next(error);
  }
};

async function meterAiUsage(organizationId: string, userId: string | null, action: string) {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  await prisma.usageMetric.create({
    data: {
      organizationId,
      userId: userId || undefined,
      metricName: action,
      metricType: "ai_action",
      quantity: 1,
      month,
      tier: "paid",
    },
  });
}

router.use(requireAuth, requireActiveSubscription, enforceUsageLimit);

/**
 * POST /api/ai/dispatch/recommend
 * Get dispatch recommendation for a load
 */
router.post("/dispatch/recommend", requireAuth, async (req: Request, res: Response) => {
  try {
    const { loadId } = req.body;
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const organizationId = req.auth?.organizationId || req.user?.organizationId || tenantId;

    if (!loadId) {
      return res.status(400).json({ error: "loadId required" });
    }

    const recommendation = await aiDispatchService.recommendDispatch(tenantId, loadId, userId);
    await meterAiUsage(organizationId, userId, "dispatch");

    if (recommendation.confidence > 0.85) {
      const carrierScore = await prisma.carrierScore.findFirst({
        where: { tenantId, driverId: recommendation.recommendedDriverId },
        select: { riskLevel: true },
      });

      const riskLevel = String(carrierScore?.riskLevel || "LOW").toUpperCase();
      if (riskLevel === "HIGH" || riskLevel === "CRITICAL") {
        await prisma.predictionEvent.create({
          data: {
            tenantId,
            entityType: "LOAD",
            entityId: loadId,
            predictionType: "AUTO_DISPATCH_BLOCKED",
            probability: recommendation.confidence,
            severity: "HIGH",
            recommendation: `Auto-dispatch blocked due to carrier risk level ${riskLevel}`,
          },
        });
      } else {
        const autoDispatchResult = await aiDispatchService.executeDispatch(
          tenantId,
          loadId,
          recommendation.recommendedDriverId,
          userId,
        );
        return res.json({
          ...recommendation,
          autoDispatched: true,
          autoDispatchResult,
        });
      }
    }

    res.json(recommendation);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to recommend dispatch" });
  }
});

/**
 * POST /api/ai/dispatch/execute
 * Execute dispatch for a load and driver
 */
router.post("/dispatch/execute", async (req: Request, res: Response) => {
  try {
    const { loadId, driverId } = req.body;
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const organizationId = req.auth?.organizationId || req.user?.organizationId || tenantId;

    if (!loadId || !driverId) {
      return res.status(400).json({ error: "loadId and driverId required" });
    }

    const result = await aiDispatchService.executeDispatch(tenantId, loadId, driverId, userId);
    await meterAiUsage(organizationId, userId, "execution");

    res.json(result);
  } catch (error: any) {
    if (req.user?.tenantId && req.body?.loadId) {
      await prisma.predictionEvent.create({
        data: {
          tenantId: req.user.tenantId,
          entityType: "LOAD",
          entityId: String(req.body.loadId),
          predictionType: "DISPATCH_FAILED",
          probability: 1,
          severity: "HIGH",
          recommendation: "Manual dispatch required after failed execute request",
        },
      });
    }
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to execute dispatch" });
  }
});

/**
 * GET /api/ai/carriers/:driverId/score
 * Get current carrier score
 */
router.get("/carriers/:driverId/score", requireAuth, async (req: Request, res: Response) => {
  try {
    const driverId = req.params.driverId as string;
    const tenantId = req.user!.tenantId!;

    const score = await carrierIntelligenceService.getCarrierScore(tenantId, driverId);

    if (!score) {
      return res.status(404).json({ error: "Carrier score not found" });
    }

    res.json(score);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get carrier score" });
  }
});

/**
 * POST /api/ai/carriers/:driverId/recompute
 * Recompute carrier score
 */
router.post("/carriers/:driverId/recompute", async (req: Request, res: Response) => {
  try {
    const driverId = req.params.driverId as string;
    const tenantId = req.user!.tenantId!;

    const score = await carrierIntelligenceService.computeCarrierScore(tenantId, driverId);
    if (score.riskLevel === "HIGH") {
      await prisma.predictionEvent.create({
        data: {
          tenantId,
          entityType: "DRIVER",
          entityId: driverId,
          predictionType: "HIGH_RISK_CARRIER",
          probability: score.score / 100,
          severity: "HIGH",
          recommendation: score.explanation || "High-risk carrier detected. Review assignment.",
        },
      });
    }

    res.json(score);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to recompute carrier score" });
  }
});

/**
 * POST /api/ai/pricing/recommend
 * Get pricing recommendation for a load
 */
router.post("/pricing/recommend", async (req: Request, res: Response) => {
  try {
    const { loadId } = req.body;
    const tenantId = req.user!.tenantId!;
    const organizationId = req.auth?.organizationId || req.user?.organizationId || tenantId;
    const userId = req.user!.id;

    if (!loadId) {
      return res.status(400).json({ error: "loadId required" });
    }

    const pricing = await smartPricingService.recommendPricing(tenantId, loadId);
    await meterAiUsage(organizationId, userId, "pricing");

    res.json(pricing);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to recommend pricing" });
  }
});

/**
 * GET /api/ai/pricing/load/:loadId
 * Get pricing history for a load
 */
router.get("/pricing/load/:loadId", requireAuth, async (req: Request, res: Response) => {
  try {
    const loadId = req.params.loadId as string;
    const tenantId = req.user!.tenantId!;

    const history = await smartPricingService.getPricingHistory(tenantId, loadId);

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get pricing history" });
  }
});

/**
 * GET /api/ai/predict/load/:loadId
 * Get delay prediction for a load
 */
router.get("/predict/load/:loadId", async (req: Request, res: Response) => {
  try {
    const loadId = req.params.loadId as string;
    const tenantId = req.user!.tenantId!;
    const organizationId = req.auth?.organizationId || req.user?.organizationId || tenantId;
    const userId = req.user!.id;

    const prediction = await predictiveOperationsService.predictLoadIssues(tenantId, loadId);
    await meterAiUsage(organizationId, userId, "prediction");

    res.json(prediction);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to predict load issues" });
  }
});

/**
 * GET /api/ai/predict/shipment/:shipmentId
 * Get delay prediction for a shipment
 */
router.get("/predict/shipment/:shipmentId", async (req: Request, res: Response) => {
  try {
    const shipmentId = req.params.shipmentId as string;
    const tenantId = req.user!.tenantId!;
    const organizationId = req.auth?.organizationId || req.user?.organizationId || tenantId;
    const userId = req.user!.id;

    const prediction = await predictiveOperationsService.predictShipmentIssues(
      tenantId,
      shipmentId,
    );
    await meterAiUsage(organizationId, userId, "prediction");

    res.json(prediction);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to predict shipment issues" });
  }
});

/**
 * GET /api/dashboard/ai-overview
 * Get AI operations overview for dashboard
 */
router.get("/dashboard/ai-overview", requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;

    // Get recent AI decisions
    const recentDecisions = await prisma.aiDecisionLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get metrics
    const dispatchCount = recentDecisions.filter(
      (d) => d.module === "DISPATCH_RECOMMENDATION",
    ).length;
    const pricingCount = recentDecisions.filter((d) => d.module === "SMART_PRICING").length;
    const predictionCount = recentDecisions.filter(
      (d) => d.module === "PREDICTIVE_OPERATIONS",
    ).length;

    res.json({
      recentDecisions: recentDecisions.slice(0, 10),
      summary: {
        dispatchRecommendations: dispatchCount,
        pricingRecommendations: pricingCount,
        predictions: predictionCount,
        totalDecisions: recentDecisions.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get AI overview" });
  }
});

/**
 * GET /api/dashboard/reliability
 * Get reliability metrics for dashboard
 */
router.get("/dashboard/reliability", requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;

    // Get high-risk carriers
    const highRiskCarriers = await prisma.carrierScore.findMany({
      where: {
        tenantId,
        riskLevel: "HIGH",
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    // Get high-risk predictions
    const highRiskPredictions = await prisma.predictionEvent.findMany({
      where: {
        tenantId,
        severity: "HIGH",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json({
      highRiskCarriers,
      highRiskPredictions,
      summary: {
        highRiskCarrierCount: highRiskCarriers.length,
        highRiskPredictionCount: highRiskPredictions.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get reliability metrics" });
  }
});

/**
 * GET /api/dashboard/revenue
 * Get revenue optimization metrics for dashboard
 */
router.get("/dashboard/revenue", requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;

    // Get recent pricing recommendations
    const recentPricing = await prisma.pricingSnapshot.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Calculate average recommended rate
    const avgRate =
      recentPricing.length > 0
        ? recentPricing.reduce((sum, p) => sum + p.recommendedRateCents, 0) / recentPricing.length
        : 0;

    // Calculate average acceptance probability
    const avgAcceptance =
      recentPricing.length > 0
        ? recentPricing.reduce((sum, p) => sum + (p.acceptanceProbability || 0), 0) /
          recentPricing.length
        : 0;

    res.json({
      recentPricing: recentPricing.slice(0, 10),
      summary: {
        averageRecommendedRate: avgRate,
        averageAcceptanceProbability: avgAcceptance,
        totalRecommendations: recentPricing.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get revenue metrics" });
  }
});

router.get("/dashboard/revenue-overview", requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.auth?.organizationId || req.user?.organizationId || req.user?.tenantId;
    if (!organizationId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const now = new Date();
    const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    const [billingRows, failedPayments, usageThisMonth, usageLast7Days, usagePrev7Days] = await Promise.all([
      prisma.orgBilling.findMany({
        where: { stripeStatus: { in: ["active", "trialing", "past_due"] } },
        select: { monthlyBase: true, stripeStatus: true },
      }),
      prisma.orgBilling.count({ where: { stripeStatus: "past_due" } }),
      prisma.usageMetric.aggregate({
        _sum: { quantity: true },
        where: { organizationId, metricType: "ai_action", month },
      }),
      prisma.usageMetric.aggregate({
        _sum: { quantity: true },
        where: {
          organizationId,
          metricType: "ai_action",
          recordedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.usageMetric.aggregate({
        _sum: { quantity: true },
        where: {
          organizationId,
          metricType: "ai_action",
          recordedAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const mrr = billingRows.reduce((sum, row) => sum + row.monthlyBase, 0);
    const arr = mrr * 12;
    const churnRisk = billingRows.length > 0 ? failedPayments / billingRows.length : 0;
    const thisWeekUsage = usageLast7Days._sum.quantity || 0;
    const lastWeekUsage = usagePrev7Days._sum.quantity || 0;
    const usageSpike = lastWeekUsage > 0 ? thisWeekUsage / lastWeekUsage : thisWeekUsage > 0 ? 1 : 0;

    res.json({
      mrr,
      arr,
      churnRisk,
      failedPayments,
      usageThisMonth: usageThisMonth._sum.quantity || 0,
      usageSpikeRatio: usageSpike,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get revenue overview" });
  }
});

/**
 * GET /api/dashboard/alerts
 * Get active alerts for dashboard
 */
router.get("/dashboard/alerts", requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;

    // Get high-severity predictions (alerts)
    const alerts = await prisma.predictionEvent.findMany({
      where: {
        tenantId,
        severity: { in: ["HIGH", "MEDIUM"] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.json({
      alerts,
      summary: {
        criticalAlerts: alerts.filter((a) => a.severity === "HIGH").length,
        warningAlerts: alerts.filter((a) => a.severity === "MEDIUM").length,
        totalAlerts: alerts.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get alerts" });
  }
});

export default router;
