/**
 * Sales & Marketing API Routes (Phase 21)
 *
 * Endpoints for:
 * - Lead capture (21.2)
 * - Demo scheduling (21.3)
 * - ROI calculator (21.4)
 * - Referrals (21.6)
 * - Metrics (21.8)
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { body, query } from "express-validator";
import { authenticate, requireScope, limiters } from "../middleware/security.js";
import * as validation from "../middleware/validation.js";

import {
  createLead,
  getLead,
  updateLeadStatus,
  convertLead,
  getLeads,
} from "../sales/leadCapture.js";

import {
  scheduleDemo,
  getDemo,
  updateDemoStatus,
  getUpcomingDemos,
  getDemoStats,
  sendDemoReminders,
} from "../sales/demoScheduling.js";

import {
  calculateRoi,
  compareScenarios,
  INDUSTRY_DEFAULTS,
  LOAD_PRICE_RANGES,
} from "../sales/roiCalculator.js";

import {
  generateReferralCode,
  getReferralLink,
  createReferral,
  trackReferralSignup,
  checkReferralMilestone,
  getReferralStats,
  getTopReferrers,
} from "../sales/referrals.js";

import {
  getMetricsSnapshot,
  storeMetricsSnapshot,
  getMetricsTrend,
  getGrowthRates,
  getInvestorKpis,
} from "../sales/metrics.js";

const router: Router = Router();
const { handleValidationErrors } = validation;

const publicLeadCaptureAttempts = new Map<string, { count: number; resetAt: number }>();

function getRequesterIp(req: any): string {
  // With `trust proxy` enabled, Express's `req.ip` / `req.ips` already
  // take `x-forwarded-for` into account according to trusted proxies.
  if (req.ip) {
    return req.ip;
  }

  if (Array.isArray(req.ips) && req.ips.length > 0) {
    return req.ips[0];
  }

  const remoteAddress = req.socket?.remoteAddress || req.connection?.remoteAddress;

  return remoteAddress || "unknown";
}

function enforcePublicLeadCaptureProtection(req: any, res: any, next: any): void {
  const sharedSecret = process.env.SALES_LEAD_CAPTURE_SECRET;
  if (sharedSecret) {
    const providedSecret = req.headers["x-lead-capture-secret"];
    if (providedSecret !== sharedSecret) {
      res.status(401).json({ error: "Unauthorized lead capture request" });
      return;
    }
  }

  const allowedOrigins = (process.env.SALES_LEAD_CAPTURE_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length > 0) {
    const requestOrigin = req.headers.origin;
    if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
      res.status(403).json({ error: "Origin not allowed" });
      return;
    }
  }

  const now = Date.now();
  const ip = getRequesterIp(req);
  const maxRequests = Number(process.env.SALES_LEAD_CAPTURE_MAX_REQUESTS || 10);
  const windowMs = Number(process.env.SALES_LEAD_CAPTURE_WINDOW_MS || 15 * 60 * 1000);

  const current = publicLeadCaptureAttempts.get(ip);
  if (!current || current.resetAt <= now) {
    publicLeadCaptureAttempts.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    next();
    return;
  }

  if (current.count >= maxRequests) {
    res.status(429).json({ error: "Too many lead capture attempts. Try again later." });
    return;
  }

  current.count += 1;
  publicLeadCaptureAttempts.set(ip, current);
  next();
}

// ============================================
// Lead Capture (21.2)
// ============================================

/**
 * POST /api/sales/leads
 * Create a new lead
 */
router.post(
  "/leads",
  limiters.general,
  enforcePublicLeadCaptureProtection,
  [
    body("name").isString().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("type").isIn(["SHIPPER", "DRIVER", "ENTERPRISE", "OTHER"]),
    body("source").isString().optional(),
    body("company").isString().optional(),
    body("phone").isString().optional(),
    body("estimatedMonthlyVolume").isInt().optional(),
    body("estimatedMonthlyBudget").isFloat().optional(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await createLead({
        name: req.body.name,
        email: req.body.email,
        company: req.body.company,
        phone: req.body.phone,
        type: req.body.type,
        source: req.body.source || "LANDING_PAGE",
        estimatedMonthlyVolume: req.body.estimatedMonthlyVolume,
        estimatedMonthlyBudget: req.body.estimatedMonthlyBudget,
        currentProvider: req.body.currentProvider,
        painPoints: req.body.painPoints,
        metadata: req.body.metadata,
      });

      res.status(201).json({
        success: true,
        data: lead,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/sales/leads/:email
 * Get lead by email
 */
router.get(
  "/leads/:email",
  limiters.general,
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await getLead(req.params.email as string);

      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      res.json({ success: true, data: lead });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /api/sales/leads/:id
 * Update lead status
 */
router.patch(
  "/leads/:id",
  limiters.general,
  authenticate,
  requireScope("admin:sales"),
  [body("status").isString().optional(), body("notes").isString().optional()],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await updateLeadStatus(req.params.id as string, req.body.status, req.body.notes);

      res.json({ success: true, data: lead });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/sales/leads
 * Get all leads (admin dashboard)
 */
router.get(
  "/leads",
  limiters.general,
  authenticate,
  requireScope("admin:sales"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const leads = await getLeads({
        type: req.query.type as string,
        status: req.query.status as string,
        source: req.query.source as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      });

      res.json({ success: true, data: leads });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================
// Demo Scheduling (21.3)
// ============================================

/**
 * POST /api/sales/demo
 * Schedule a demo
 */
router.post(
  "/demo",
  limiters.general,
  [
    body("name").isString().notEmpty().optional(),
    body("email").isEmail().optional(),
    body("scheduledFor").isISO8601().withMessage("Valid date required"),
    body("duration").isInt({ min: 15, max: 120 }).optional(),
    body("timezone").isString().optional(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const demoBooking = await scheduleDemo({
        leadId: req.body.leadId,
        name: req.body.name,
        email: req.body.email,
        company: req.body.company,
        phone: req.body.phone,
        type: req.body.type,
        scheduledFor: new Date(req.body.scheduledFor),
        duration: req.body.duration || 30,
        timezone: req.body.timezone || "America/Los_Angeles",
      });

      res.status(201).json({
        success: true,
        data: demoBooking,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/sales/demo/:id
 * Get demo details
 */
router.get(
  "/demo/:id",
  limiters.general,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const demo = await getDemo(req.params.id as string);

      if (!demo) {
        return res.status(404).json({ error: "Demo not found" });
      }

      res.json({ success: true, data: demo });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /api/sales/demo/:id
 * Update demo status
 */
router.patch(
  "/demo/:id",
  limiters.general,
  authenticate,
  requireScope("admin:sales"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const demo = await updateDemoStatus(
        req.params.id as string,
        req.body.status,
        req.body.recordingUrl,
        req.body.notes,
      );

      res.json({ success: true, data: demo });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/sales/demo/stats
 * Get demo statistics
 */
router.get(
  "/demo/stats",
  limiters.general,
  authenticate,
  requireScope("admin:sales"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await getDemoStats();

      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================
// ROI Calculator (21.4)
// ============================================

/**
 * POST /api/sales/roi-calculate
 * Calculate ROI for prospect
 */
router.post(
  "/roi-calculate",
  limiters.general,
  [
    body("estimatedLoadsPerMonth").isInt().withMessage("Must be integer"),
    body("averageLoadPrice").isFloat().withMessage("Must be decimal"),
    body("plan").isIn(["STARTER", "GROWTH", "ENTERPRISE"]).optional(),
    body("currentBrokerFeePercent").isFloat().optional(),
    body("currentDispatchCostPerLoad").isFloat().optional(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roi = calculateRoi({
        estimatedLoadsPerMonth: req.body.estimatedLoadsPerMonth,
        averageLoadPrice: req.body.averageLoadPrice,
        plan: req.body.plan || "GROWTH",
        currentBrokerFeePercent: req.body.currentBrokerFeePercent,
        currentDispatchCostPerLoad: req.body.currentDispatchCostPerLoad,
      });

      res.json({ success: true, data: roi });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/sales/roi-defaults
 * Get industry defaults for ROI calculator (public)
 */
router.get("/roi-defaults", (req, res) => {
  res.json({
    success: true,
    data: {
      defaults: INDUSTRY_DEFAULTS,
      loadPriceRanges: LOAD_PRICE_RANGES,
    },
  });
});

// ============================================
// Referrals (21.6)
// ============================================

/**
 * POST /api/sales/referral
 * Create referral code for user
 */
router.post(
  "/referral",
  limiters.general,
  authenticate,
  [body("refereeEmail").isEmail().withMessage("Valid email required")],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const referrerEmail = req.user?.email || req.user?.sub || "";
      const referralCode = generateReferralCode(referrerEmail);
      const referralLink = getReferralLink(referralCode);

      // Create referral record
      await createReferral(
        referrerEmail,
        req.body.refereeEmail,
        req.body.rewardAmount || 100,
        req.body.rewardType || "credit",
      );

      res.status(201).json({
        success: true,
        data: {
          referralCode,
          referralLink,
          rewardAmount: req.body.rewardAmount || 100,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/sales/referral/stats
 * Get referral stats for logged-in user
 */
router.get(
  "/referral/stats",
  limiters.general,
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = req.user!.email;
      const stats = await getReferralStats(email);

      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/sales/referral/leaderboard
 * Get top referrers
 */
router.get(
  "/referral/leaderboard",
  limiters.general,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const topReferrers = await getTopReferrers(limit);

      res.json({ success: true, data: topReferrers });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================
// Metrics (21.8)
// ============================================

/**
 * GET /api/sales/metrics
 * Get current metrics snapshot (for dashboard)
 */
router.get(
  "/metrics",
  limiters.general,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = await getMetricsSnapshot();

      // Store snapshot if requested
      if (req.query.store === "true") {
        await storeMetricsSnapshot(metrics);
      }

      res.json({
        success: true,
        data: metrics,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/sales/metrics/trend
 * Get metrics trend (historical)
 */
router.get(
  "/metrics/trend",
  limiters.general,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const trend = await getMetricsTrend(days);

      res.json({
        success: true,
        data: trend,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/sales/metrics/growth
 * Get growth rates
 */
router.get(
  "/metrics/growth",
  limiters.general,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const growth = await getGrowthRates();

      res.json({
        success: true,
        data: growth,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/sales/metrics/investor
 * Get investor KPIs
 */
router.get(
  "/metrics/investor",
  limiters.general,
  authenticate,
  requireScope("admin:analytics"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const kpis = await getInvestorKpis();

      res.json({
        success: true,
        data: kpis,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/sales/metrics/snapshot
 * Force store current metrics (admin only)
 */
router.post(
  "/metrics/snapshot",
  limiters.general,
  authenticate,
  requireScope("admin:analytics"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = await getMetricsSnapshot();
      await storeMetricsSnapshot(metrics);

      res.status(201).json({
        success: true,
        data: metrics,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
