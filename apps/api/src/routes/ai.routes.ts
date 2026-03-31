import { Router, Request, Response, NextFunction } from "express";
import { aiDispatchService } from "../services/ai-dispatch.service.js";
import { CarrierIntelligenceService } from "../services/carrier-intelligence.service.js";

const carrierIntelligenceService = new CarrierIntelligenceService();
import { smartPricingService } from "../services/smart-pricing.service.js";
import { predictiveOperationsService } from "../services/predictive-operations.service.js";
import { prisma } from "../db/prisma.js";


const router: Router = Router();
const PLAN_LIMITS: Record<string, number> = {
  STARTER: 100,
  GROWTH: 1000,
  PRO: 1000,
  ENTERPRISE: Number.POSITIVE_INFINITY,
  CUSTOM: Number.POSITIVE_INFINITY,
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

const resolveOrganizationId = (req: Request): string | undefined => {
  return req.organizationId ?? req.orgId ?? req.auth?.organizationId ?? req.user?.tenantId;
};

const requireActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = resolveOrganizationId(req);
    if (!organizationId) {
      return res.status(401).json({ error: "Organization context missing" });
    }

    const subscription = await prisma.orgBilling.findUnique({
      where: { organizationId },
      select: { stripeStatus: true, plan: true, monthlyQuota: true },
    });

    const stripeStatus = subscription?.stripeStatus?.toLowerCase() ?? "inactive";
    const isActive = stripeStatus === "active" || stripeStatus === "trialing";
    if (!isActive) {
      return res.status(402).json({ error: "Subscription required" });
    }

    req.billing = {
      plan: subscription?.plan ?? "STARTER",
      stripeStatus,
      monthlyQuota: subscription?.monthlyQuota ?? PLAN_LIMITS.STARTER,
      organizationId,
    };
    return next();
  } catch {
    return res.status(500).json({ error: "Failed to verify subscription" });
  }
};

const enforceUsageLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const billing = req.billing;
    if (!billing?.organizationId) {
      return res.status(401).json({ error: "Organization context missing" });
    }

    const month = new Date().toISOString().slice(0, 7);
    const usage = await prisma.orgUsage.findUnique({
      where: { organizationId_month: { organizationId: billing.organizationId, month } },
      select: { jobs: true },
    });

    const plan = String(billing.plan ?? "STARTER").toUpperCase();
    const planLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.STARTER;
    const configuredLimit =
      Number.isFinite(billing.monthlyQuota) && billing.monthlyQuota > 0
        ? billing.monthlyQuota
        : planLimit;
    const currentUsage = usage?.jobs ?? 0;

    if (currentUsage >= configuredLimit) {
      return res.status(403).json({ error: "Usage limit exceeded" });
    }

    return next();
  } catch {
    return res.status(500).json({ error: "Failed to verify usage limits" });
  }
};

const trackAiUsage = async (req: Request) => {
  const organizationId = req.billing?.organizationId;
  if (!organizationId) {
    return;
  }

  const month = new Date().toISOString().slice(0, 7);
  await prisma.orgUsage.upsert({
    where: { organizationId_month: { organizationId, month } },
    update: { jobs: { increment: 1 } },
    create: { organizationId, month, jobs: 1 },
  });
};

router.use(requireAuth);
router.use(requireActiveSubscription);

/**
 * POST /api/ai/dispatch/recommend
 * Get dispatch recommendation for a load
 */
router.post("/dispatch/recommend", enforceUsageLimit, async (req: Request, res: Response) => {
  try {
    const { loadId } = req.body;
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;

    if (!loadId) {
      return res.status(400).json({ error: "loadId required" });
    }

    const recommendation = await aiDispatchService.recommendDispatch(tenantId, loadId, userId);
    await trackAiUsage(req);

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
router.post("/dispatch/execute", enforceUsageLimit, async (req: Request, res: Response) => {
  try {
    const { loadId, driverId } = req.body;
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;

    if (!loadId || !driverId) {
      return res.status(400).json({ error: "loadId and driverId required" });
    }

    const result = await aiDispatchService.executeDispatch(tenantId, loadId, driverId, userId);
    await trackAiUsage(req);

    res.json(result);
  } catch (error: any) {
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
router.post("/carriers/:driverId/recompute", enforceUsageLimit, async (req: Request, res: Response) => {
  try {
    const driverId = req.params.driverId as string;
    const tenantId = req.user!.tenantId!;

    const score = await carrierIntelligenceService.computeCarrierScore(tenantId, driverId);
    await trackAiUsage(req);

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
router.post("/pricing/recommend", enforceUsageLimit, async (req: Request, res: Response) => {
  try {
    const { loadId } = req.body;
    const tenantId = req.user!.tenantId!;

    if (!loadId) {
      return res.status(400).json({ error: "loadId required" });
    }

    const pricing = await smartPricingService.recommendPricing(tenantId, loadId);
    await trackAiUsage(req);

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
router.get("/predict/load/:loadId", enforceUsageLimit, async (req: Request, res: Response) => {
  try {
    const loadId = req.params.loadId as string;
    const tenantId = req.user!.tenantId!;

    const prediction = await predictiveOperationsService.predictLoadIssues(tenantId, loadId);
    await trackAiUsage(req);

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
router.get("/predict/shipment/:shipmentId", enforceUsageLimit, async (req: Request, res: Response) => {
  try {
    const shipmentId = req.params.shipmentId as string;
    const tenantId = req.user!.tenantId!;

    const prediction = await predictiveOperationsService.predictShipmentIssues(
      tenantId,
      shipmentId,
    );
    await trackAiUsage(req);

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
