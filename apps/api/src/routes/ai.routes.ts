import { Router, Request, Response, NextFunction } from 'express';
import { aiDispatchService } from '../services/ai-dispatch.service';
import { carrierIntelligenceService } from '../services/carrier-intelligence.service';
import { smartPricingService } from '../services/smart-pricing.service';
import { predictiveOperationsService } from '../services/predictive-operations.service';
import { prisma } from '../db/prisma';

const router = Router();

/**
 * Middleware: Require authentication and tenant context
 */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * POST /api/ai/dispatch/recommend
 * Get dispatch recommendation for a load
 */
router.post('/dispatch/recommend', requireAuth, async (req: Request, res: Response) => {
  try {
    const { loadId } = req.body;
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    if (!loadId) {
      return res.status(400).json({ error: 'loadId required' });
    }

    const recommendation = await aiDispatchService.recommendDispatch(
      tenantId,
      loadId,
      userId
    );

    res.json(recommendation);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to recommend dispatch' });
  }
});

/**
 * POST /api/ai/dispatch/execute
 * Execute dispatch for a load and driver
 */
router.post('/dispatch/execute', requireAuth, async (req: Request, res: Response) => {
  try {
    const { loadId, driverId } = req.body;
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    if (!loadId || !driverId) {
      return res.status(400).json({ error: 'loadId and driverId required' });
    }

    const result = await aiDispatchService.executeDispatch(
      tenantId,
      loadId,
      driverId,
      userId
    );

    res.json(result);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to execute dispatch' });
  }
});

/**
 * GET /api/ai/carriers/:driverId/score
 * Get current carrier score
 */
router.get('/carriers/:driverId/score', requireAuth, async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const tenantId = req.user!.tenantId;

    const score = await carrierIntelligenceService.getCarrierScore(
      tenantId,
      driverId
    );

    if (!score) {
      return res.status(404).json({ error: 'Carrier score not found' });
    }

    res.json(score);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get carrier score' });
  }
});

/**
 * POST /api/ai/carriers/:driverId/recompute
 * Recompute carrier score
 */
router.post('/carriers/:driverId/recompute', requireAuth, async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const tenantId = req.user!.tenantId;

    const score = await carrierIntelligenceService.computeCarrierScore(
      tenantId,
      driverId
    );

    res.json(score);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to recompute carrier score' });
  }
});

/**
 * POST /api/ai/pricing/recommend
 * Get pricing recommendation for a load
 */
router.post('/pricing/recommend', requireAuth, async (req: Request, res: Response) => {
  try {
    const { loadId } = req.body;
    const tenantId = req.user!.tenantId;

    if (!loadId) {
      return res.status(400).json({ error: 'loadId required' });
    }

    const pricing = await smartPricingService.recommendPricing(tenantId, loadId);

    res.json(pricing);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to recommend pricing' });
  }
});

/**
 * GET /api/ai/pricing/load/:loadId
 * Get pricing history for a load
 */
router.get('/pricing/load/:loadId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { loadId } = req.params;
    const tenantId = req.user!.tenantId;

    const history = await smartPricingService.getPricingHistory(tenantId, loadId);

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get pricing history' });
  }
});

/**
 * GET /api/ai/predict/load/:loadId
 * Get delay prediction for a load
 */
router.get('/predict/load/:loadId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { loadId } = req.params;
    const tenantId = req.user!.tenantId;

    const prediction = await predictiveOperationsService.predictLoadIssues(
      tenantId,
      loadId
    );

    res.json(prediction);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to predict load issues' });
  }
});

/**
 * GET /api/ai/predict/shipment/:shipmentId
 * Get delay prediction for a shipment
 */
router.get('/predict/shipment/:shipmentId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { shipmentId } = req.params;
    const tenantId = req.user!.tenantId;

    const prediction = await predictiveOperationsService.predictShipmentIssues(
      tenantId,
      shipmentId
    );

    res.json(prediction);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to predict shipment issues' });
  }
});

/**
 * GET /api/dashboard/ai-overview
 * Get AI operations overview for dashboard
 */
router.get('/dashboard/ai-overview', requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    // Get recent AI decisions
    const recentDecisions = await prisma.aiDecisionLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Get metrics
    const dispatchCount = recentDecisions.filter(
      (d) => d.module === 'DISPATCH_RECOMMENDATION'
    ).length;
    const pricingCount = recentDecisions.filter(
      (d) => d.module === 'SMART_PRICING'
    ).length;
    const predictionCount = recentDecisions.filter(
      (d) => d.module === 'PREDICTIVE_OPERATIONS'
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
    res.status(500).json({ error: 'Failed to get AI overview' });
  }
});

/**
 * GET /api/dashboard/reliability
 * Get reliability metrics for dashboard
 */
router.get('/dashboard/reliability', requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    // Get high-risk carriers
    const highRiskCarriers = await prisma.carrierScore.findMany({
      where: {
        tenantId,
        riskLevel: 'HIGH',
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    // Get high-risk predictions
    const highRiskPredictions = await prisma.predictionEvent.findMany({
      where: {
        tenantId,
        severity: 'HIGH',
      },
      orderBy: { createdAt: 'desc' },
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
    res.status(500).json({ error: 'Failed to get reliability metrics' });
  }
});

/**
 * GET /api/dashboard/revenue
 * Get revenue optimization metrics for dashboard
 */
router.get('/dashboard/revenue', requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    // Get recent pricing recommendations
    const recentPricing = await prisma.pricingSnapshot.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Calculate average recommended rate
    const avgRate =
      recentPricing.length > 0
        ? recentPricing.reduce((sum, p) => sum + p.recommendedRateCents, 0) /
          recentPricing.length
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
    res.status(500).json({ error: 'Failed to get revenue metrics' });
  }
});

/**
 * GET /api/dashboard/alerts
 * Get active alerts for dashboard
 */
router.get('/dashboard/alerts', requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    // Get high-severity predictions (alerts)
    const alerts = await prisma.predictionEvent.findMany({
      where: {
        tenantId,
        severity: { in: ['HIGH', 'MEDIUM'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      alerts,
      summary: {
        criticalAlerts: alerts.filter((a) => a.severity === 'HIGH').length,
        warningAlerts: alerts.filter((a) => a.severity === 'MEDIUM').length,
        totalAlerts: alerts.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

export default router;
