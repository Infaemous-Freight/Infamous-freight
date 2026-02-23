const express = require("express");
const router = express.Router();
const { authenticate, requireScope, limiters, auditLog } = require("../middleware/security");
const { handleValidationErrors } = require("../middleware/validation");
const { body } = require("express-validator");
const { logger } = require("../middleware/logger");
const { stripeClient } = require("../billing/stripe");

/**
 * POST /api/billing/payment-intent
 * Create payment intent for checkout - Stripe integration
 */
router.post(
  "/payment-intent",
  limiters.billing,
  authenticate,
  requireScope("billing:payment"),
  auditLog,
  [
    body("amount").isFloat({ min: 0.01 }).withMessage("Invalid amount"),
    body("currency").optional().isIn(["USD", "EUR", "GBP", "CAD"]).withMessage("Invalid currency"),
    body("description").optional().isString().trim(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { amount, currency = "USD", description } = req.body;

      // For now, return mock response
      const clientSecret = `pi_test_${Date.now()}`;

      logger.info("Payment intent created", {
        userId: req.user.sub,
        amount,
        currency,
        description,
      });

      res.status(200).json({
        success: true,
        data: {
          clientSecret,
          intentId: clientSecret,
          amount,
          currency,
          status: "requires_payment_method",
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/billing/confirm-payment
 * Confirm payment after submission
 */
router.post(
  "/confirm-payment",
  limiters.billing,
  authenticate,
  requireScope("billing:payment"),
  auditLog,
  [body("intentId").isString().notEmpty(), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { intentId } = req.body;

      logger.info("Payment confirmed", {
        userId: req.user.sub,
        intentId,
      });

      // Mock payment confirmation
      res.status(200).json({
        success: true,
        data: {
          status: "succeeded",
          amount: 99.99,
          currency: "USD",
          paymentId: intentId,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/billing/revenue
 * Get revenue metrics (admin only)
 */
router.get(
  "/revenue",
  limiters.general,
  authenticate,
  requireScope("billing:admin"),
  auditLog,
  async (req, res, next) => {
    try {
      const { period = "month" } = req.query;

      logger.info("Revenue request", { userId: req.user.sub, period });

      // Mock revenue data
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(1);

      const metrics = {
        period,
        totalRevenue: 2450.5,
        transactionCount: 12,
        averageTransaction: 204.21,
        currency: "USD",
        dateRange: { start: startDate, end: today },
      };

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/billing/subscribe
 * Create recurring subscription
 */
router.post(
  "/subscribe",
  limiters.billing,
  authenticate,
  requireScope("billing:subscribe"),
  auditLog,
  [body("planId").isString().notEmpty(), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { planId } = req.body;
      const stripe = stripeClient();

      if (!stripe || !process.env.STRIPE_PRICE_ID) {
        return res.status(503).json({
          success: false,
          error: "Stripe is not configured",
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: req.user.email,
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: process.env.SUCCESS_URL,
        cancel_url: process.env.CANCEL_URL,
        metadata: {
          userId: req.user.sub,
          requestedPlanId: planId,
        },
      });

      logger.info("Subscription checkout session created", {
        userId: req.user.sub,
        planId,
        sessionId: session.id,
      });

      res.status(201).json({
        success: true,
        data: {
          checkoutUrl: session.url,
          sessionId: session.id,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/billing/transactions
 * Get payment history
 */
router.get(
  "/transactions",
  limiters.general,
  authenticate,
  requireScope("billing:read"),
  auditLog,
  async (req, res, next) => {
    try {
      logger.info("Transactions retrieved", { userId: req.user.sub });

      res.status(200).json({
        success: true,
        data: {
          transactions: [
            {
              id: "txn_001",
              amount: 99.99,
              currency: "USD",
              status: "completed",
              date: new Date(Date.now() - 24 * 60 * 60 * 1000),
              description: "Professional Plan",
            },
          ],
          count: 1,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
