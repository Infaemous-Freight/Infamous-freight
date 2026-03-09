/**
 * B2B Shipper API Routes
 * REST endpoints for enterprise shippers to post loads and manage shipments
 * Includes authentication, rate limiting, and tier-based access control
 */

const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { authenticate, requireScope } = require("../middleware/security");
const {
  handleValidationErrors,
  validateString,
  validateEmail,
  validateUUID,
} = require("../middleware/validation");
const { body, param } = require("express-validator");
const { logger } = require("../middleware/logger");
const { ApiResponse, HTTP_STATUS } = require("@infamous/shared");
const { ipKeyGenerator } = require("express-rate-limit");

// B2B specific limiter
const b2bRateLimiter = require("express-rate-limit")({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.B2B_RATE_LIMIT || 100,
  keyGenerator: (req) => req.user?.sub || ipKeyGenerator(req),
});

/**
 * POST /api/b2b/loads
 * Post a new load for shippers
 */
router.post(
  "/loads",
  b2bRateLimiter,
  authenticate,
  requireScope("shipper:post_load"),
  [
    body("pickupCity").trim().notEmpty().withMessage("Pickup city required"),
    body("dropoffCity").trim().notEmpty().withMessage("Dropoff city required"),
    body("pickupDate").isISO8601().withMessage("Invalid pickup date"),
    body("weight").isNumeric().withMessage("Weight must be numeric"),
    body("rate").isNumeric().withMessage("Rate must be numeric"),
    body("description").trim().optional(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const shipperId = req.user.sub;

      // Get shipper tier
      const shipper = await prisma.shipper.findUnique({
        where: { id: shipperId },
      });

      if (!shipper) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(new ApiResponse({ success: false, error: "Shipper not found" }));
      }

      // Check tier limits
      const loadCount = await prisma.shipment.count({
        where: {
          shipperId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
          },
        },
      });

      const tierLimits = {
        basic: 5,
        pro: 50,
        enterprise: 500,
      };

      if (loadCount >= tierLimits[shipper.tier]) {
        return res.status(HTTP_STATUS.CONFLICT).json(
          new ApiResponse({
            success: false,
            error: `Tier limit reached (${tierLimits[shipper.tier]} loads/day)`,
          }),
        );
      }

      // Create load
      const load = await prisma.shipment.create({
        data: {
          shipperId,
          pickupCity: req.body.pickupCity,
          dropoffCity: req.body.dropoffCity,
          pickupDate: new Date(req.body.pickupDate),
          weight: req.body.weight,
          rate: req.body.rate,
          description: req.body.description || "",
          status: "available",
          source: "b2b_api",
        },
      });

      logger.info("B2B load posted", {
        loadId: load.id,
        shipperId,
        rate: load.rate,
      });

      res.status(HTTP_STATUS.CREATED).json(
        new ApiResponse({
          success: true,
          data: {
            id: load.id,
            pickupCity: load.pickupCity,
            dropoffCity: load.dropoffCity,
            rate: load.rate,
            status: "available",
            postedAt: load.createdAt,
          },
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/b2b/loads/:id
 * Get load details and current bids
 */
router.get(
  "/loads/:id",
  authenticate,
  requireScope("shipper:view_loads"),
  [param("id").isUUID().withMessage("Invalid load ID"), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const shipperId = req.user.sub;

      const load = await prisma.shipment.findUnique({
        where: { id },
        include: {
          bids: {
            select: {
              id: true,
              driverId: true,
              rate: true,
              createdAt: true,
              status: true,
            },
          },
        },
      });

      if (!load) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(new ApiResponse({ success: false, error: "Load not found" }));
      }

      if (load.shipperId !== shipperId) {
        return res
          .status(HTTP_STATUS.FORBIDDEN)
          .json(new ApiResponse({ success: false, error: "Unauthorized" }));
      }

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: {
            id: load.id,
            from: load.pickupCity,
            to: load.dropoffCity,
            pickupDate: load.pickupDate,
            weight: load.weight,
            rate: load.rate,
            status: load.status,
            bids: load.bids.map((b) => ({
              id: b.id,
              driverId: b.driverId,
              rate: b.rate,
              createdAt: b.createdAt,
              status: b.status,
            })),
          },
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/b2b/loads
 * List all loads for shipper with pagination
 */
router.get("/loads", authenticate, requireScope("shipper:view_loads"), async (req, res, next) => {
  try {
    const shipperId = req.user.sub;
    const { page = 1, limit = 20, status } = req.query;

    const skip = (page - 1) * limit;

    const where = { shipperId };
    if (status) where.status = status;

    const [loads, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          pickupCity: true,
          dropoffCity: true,
          pickupDate: true,
          rate: true,
          status: true,
          createdAt: true,
          _count: { select: { bids: true } },
        },
      }),
      prisma.shipment.count({ where }),
    ]);

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        success: true,
        data: {
          loads: loads.map((l) => ({
            id: l.id,
            from: l.pickupCity,
            to: l.dropoffCity,
            pickupDate: l.pickupDate,
            rate: l.rate,
            status: l.status,
            bidCount: l._count.bids,
            postedAt: l.createdAt,
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      }),
    );
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/b2b/invoices
 * Create invoice for completed load
 */
router.post(
  "/invoices",
  b2bRateLimiter,
  authenticate,
  requireScope("shipper:manage_billing"),
  [
    body("loadId").isUUID().withMessage("Invalid load ID"),
    body("amount").isNumeric().withMessage("Amount must be numeric"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { loadId, amount } = req.body;
      const shipperId = req.user.sub;

      const load = await prisma.shipment.findUnique({
        where: { id: loadId },
      });

      if (!load || load.shipperId !== shipperId) {
        return res
          .status(HTTP_STATUS.FORBIDDEN)
          .json(new ApiResponse({ success: false, error: "Unauthorized" }));
      }

      // Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          shipperId,
          loadId,
          amount: parseFloat(amount),
          status: "pending",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      logger.info("Invoice created", {
        invoiceId: invoice.id,
        loadId,
        amount,
      });

      res.status(HTTP_STATUS.CREATED).json(
        new ApiResponse({
          success: true,
          data: {
            invoiceId: invoice.id,
            amount: invoice.amount,
            dueDate: invoice.dueDate,
            status: "pending",
          },
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/b2b/rates
 * Get current rate information for shipper tier
 */
router.get("/rates", authenticate, requireScope("shipper:view_loads"), async (req, res, next) => {
  try {
    const shipperId = req.user.sub;

    const shipper = await prisma.shipper.findUnique({
      where: { id: shipperId },
    });

    if (!shipper) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(new ApiResponse({ success: false, error: "Shipper not found" }));
    }

    const tierPricing = {
      basic: {
        platformFee: 0.1, // 10%
        maxLoads: 5,
        maxConcurrent: 2,
        rateCard: "standard",
      },
      pro: {
        platformFee: 0.08, // 8%
        maxLoads: 50,
        maxConcurrent: 10,
        rateCard: "premium",
      },
      enterprise: {
        platformFee: 0.05, // 5%
        maxLoads: 500,
        maxConcurrent: 100,
        rateCard: "custom",
      },
    };

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        success: true,
        data: {
          tier: shipper.tier,
          pricing: tierPricing[shipper.tier],
          marketRates: {
            avgRate: 1.85, // $/mile
            trend: "stable",
            lastUpdated: new Date(),
          },
        },
      }),
    );
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/b2b/webhooks
 * Configure webhooks for load updates
 */
router.post(
  "/webhooks",
  b2bRateLimiter,
  authenticate,
  requireScope("shipper:manage_webhooks"),
  [
    body("url").isURL().withMessage("Invalid webhook URL"),
    body("events").isArray().withMessage("Events must be array"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { url, events } = req.body;
      const shipperId = req.user.sub;

      const webhook = await prisma.webhook.create({
        data: {
          shipperId,
          url,
          events: JSON.stringify(events),
          active: true,
        },
      });

      logger.info("Webhook configured", {
        webhookId: webhook.id,
        shipperId,
        events,
      });

      res.status(HTTP_STATUS.CREATED).json(
        new ApiResponse({
          success: true,
          data: {
            webhookId: webhook.id,
            url,
            events,
            active: true,
          },
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
