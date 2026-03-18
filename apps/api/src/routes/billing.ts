/**
 * Billing API Routes (Phase 20.6)
 *
 * Endpoints for:
 * - Billing portal access (Stripe)
 * - Subscription management
 * - Invoice retrieval
 * - Usage tracking
 */

import { Router } from "express";
import Stripe from "stripe";
import { authenticate, requireOrganization, requireScope, limiters } from "../middleware/security.js";
import { handleValidationErrors, validateString } from "../middleware/validation.js";
import { logAuditEvent, AUDIT_ACTIONS } from "../audit/orgAuditLog.js";
import { tenantPrisma } from "../db/tenant.js";
import { body, query } from "express-validator";

import {
  createStripeSubscription,
  updateSubscriptionPlan,
  cancelSubscription,
  getSubscriptionDetails,
} from "../billing/stripeSync.js";
import {
  recordJobCompletion,
  getMonthlyUsage,
  getUsageSummary,
  calculatePlatformFee,
} from "../billing/usage.js";
import {
  generateOrgInvoice,
  getInvoice,
  sendInvoiceReminder,
  markInvoicePaid,
} from "../billing/invoicing.js";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============================================
// Billing Portal (Stripe)
// ============================================

/**
 * GET /api/billing/portal
 * Redirect to Stripe billing portal for subscription management
 */
router.get(
  "/portal",
  limiters.billing,
  authenticate,
  requireOrganization,
  requireScope("billing:read"),
  async (req, res, next) => {
    try {
      const orgId = req.auth?.organizationId;
      const billing = await prisma.orgBilling.findUnique({
        where: { organizationId: orgId },
        select: { stripeCustomerId: true },
      });

      if (!billing?.stripeCustomerId) {
        return res.status(404).json({
          error: "No billing found",
          message: "Organization does not have a Stripe customer",
        });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: billing.stripeCustomerId,
        return_url: `${process.env.WEB_BASE_URL || "http://localhost:3000"}/settings/billing`,
      });

      res.json({ url: session.url });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================
// Subscription Management
// ============================================

/**
 * POST /api/billing/subscribe
 * Create a subscription for the organization
 */
router.post(
  "/subscribe",
  limiters.billing,
  authenticate,
  requireOrganization,
  requireScope("billing:write"),
  [body("plan").isIn(["STARTER", "GROWTH", "ENTERPRISE"]).withMessage("Invalid plan")],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const orgId = req.auth?.organizationId;
      const userId = req.auth?.userId;
      const { plan } = req.body;

      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
      });

      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Create Stripe subscription
      const result = await createStripeSubscription(orgId, org.name, plan, req.auth?.email);

      // Log audit event
      await logAuditEvent(prisma, {
        organizationId: orgId,
        userId,
        action: AUDIT_ACTIONS.ORG_SETTINGS_UPDATED,
        entity: "subscription",
        entityId: result.subscriptionId,
        metadata: { plan, status: result.status },
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/billing/upgrade
 * Upgrade to a higher plan
 */
router.post(
  "/upgrade",
  limiters.billing,
  authenticate,
  requireOrganization,
  requireScope("billing:write"),
  [body("plan").isIn(["STARTER", "GROWTH", "ENTERPRISE"]).withMessage("Invalid plan")],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const orgId = req.auth?.organizationId;
      const userId = req.auth?.userId;
      const { plan } = req.body;

      // Update subscription
      await updateSubscriptionPlan(orgId, plan);

      // Log audit event
      await logAuditEvent(prisma, {
        organizationId: orgId,
        userId,
        action: "PLAN_UPGRADED",
        entity: "subscription",
        entityId: orgId,
        metadata: { newPlan: plan },
      });

      const details = await getSubscriptionDetails(orgId);

      res.json({
        success: true,
        data: details,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/billing/cancel
 * Cancel subscription
 */
router.post(
  "/cancel",
  limiters.billing,
  authenticate,
  requireOrganization,
  requireScope("billing:write"),
  [body("immediately").optional().isBoolean().withMessage("immediately must be boolean")],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const orgId = req.auth?.organizationId;
      const userId = req.auth?.userId;
      const { immediately } = req.body;

      // Cancel subscription
      await cancelSubscription(orgId, immediately || false);

      // Log audit event
      await logAuditEvent(prisma, {
        organizationId: orgId,
        userId,
        action: "SUBSCRIPTION_CANCELED",
        entity: "subscription",
        entityId: orgId,
        metadata: { immediately: immediately || false },
      });

      res.json({
        success: true,
        message: `Subscription canceled (immediately: ${immediately || false})`,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/billing/subscription
 * Get subscription details
 */
router.get(
  "/subscription",
  limiters.billing,
  authenticate,
  requireOrganization,
  requireScope("billing:read"),
  async (req, res, next) => {
    try {
      const orgId = req.auth?.organizationId;

      const details = await getSubscriptionDetails(orgId);

      if (!details) {
        return res.status(404).json({
          error: "Subscription not found",
        });
      }

      res.json({
        success: true,
        data: details,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================
// Usage Tracking
// ============================================

/**
 * GET /api/billing/usage
 * Get current month usage
 */
router.get(
  "/usage",
  limiters.billing,
  authenticate,
  requireOrganization,
  requireScope("billing:read"),
  async (req, res, next) => {
    try {
      const orgId = req.auth?.organizationId;
      const { month } = req.query;

      const usage = await getMonthlyUsage(orgId, month as string);

      if (!usage) {
        return res.json({
          success: true,
          data: {
            organizationId: orgId,
            month: month || new Date().toISOString().slice(0, 7),
            jobs: 0,
            revenue: 0,
            overageJobs: 0,
            overageCharge: 0,
          },
        });
      }

      res.json({
        success: true,
        data: usage,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/billing/usage/summary
 * Get usage summary for date range
 */
router.get(
  "/usage/summary",
  limiters.billing,
  authenticate,
  requireOrganization,
  requireScope("billing:read"),
  [
    query("from")
      .matches(/^\d{4}-\d{2}$/)
      .withMessage("from must be YYYY-MM"),
    query("to")
      .matches(/^\d{4}-\d{2}$/)
      .withMessage("to must be YYYY-MM"),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const orgId = req.auth?.organizationId;
      const { from, to } = req.query;

      const summary = await getUsageSummary(orgId, from as string, to as string);

      res.json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================
// Invoices
// ============================================

/**
 * GET /api/billing/invoice/:month
 * Get invoice for a month
 */
router.get(
  "/invoice/:month",
  limiters.billing,
  authenticate,
  requireOrganization,
  requireScope("billing:read"),
  async (req, res, next) => {
    try {
      const orgId = req.auth?.organizationId;
      const { month } = req.params;

      const invoice = await getInvoice(orgId, month);

      if (!invoice) {
        return res.status(404).json({
          error: "Invoice not found",
        });
      }

      res.json({
        success: true,
        data: invoice,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/billing/invoice/:month/reminder
 * Send invoice reminder (admin only)
 */
router.post(
  "/invoice/:month/reminder",
  limiters.billing,
  authenticate,
  requireOrganization,
  requireScope("billing:write"),
  async (req, res, next) => {
    try {
      const orgId = req.auth?.organizationId;
      const { month } = req.params;

      // Check admin role
      if (req.auth?.role !== "ADMIN") {
        return res.status(403).json({
          error: "Forbidden",
          message: "Only admins can send invoice reminders",
        });
      }

      await sendInvoiceReminder(orgId, month);

      res.json({
        success: true,
        message: "Invoice reminder sent",
      });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================
// Pricing Info
// ============================================

/**
 * GET /api/billing/pricing
 * Get pricing information (public)
 */
router.get("/pricing", async (req, res) => {
  res.json({
    success: true,
    data: {
      transactional: {
        CAR: { baseFee: 5, percent: 0.08 },
        VAN: { baseFee: 8, percent: 0.1 },
        BOX_TRUCK: { baseFee: 15, percent: 0.12 },
        SEMI: { baseFee: 25, percent: 0.15 },
      },
      enterprise: {
        STARTER: {
          monthly: 79,
          included: 500,
          overagePrice: 0.15,
        },
        GROWTH: {
          monthly: 199,
          included: 2500,
          overagePrice: 0.08,
        },
        ENTERPRISE: {
          monthly: 599,
          included: 999999,
          overagePrice: 0,
        },
      },
    },
  });
});

export default router;
