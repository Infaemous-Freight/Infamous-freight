/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: AI Recommendation Engine API Routes
 */

/**
 * AI-Powered Recommendation API Routes
 * Intelligent suggestions for services, routes, drivers, vehicles, and pricing
 */

const express = require("express");
const router = express.Router();
const { prisma } = require("../db/prisma");
const { asyncHandler } = require("../lib/errors");
const recommendationService = require("../services/recommendationService");
const { authenticate, requireScope, limiters, auditLog } = require("../middleware/security");
const { body, param, query, validationResult } = require("express-validator");
const { handleValidationErrors } = require("../middleware/validation");

/**
 * POST /api/recommendations/services
 * Get service recommendations for a shipment
 */
router.post(
  "/services",
  limiters.general,
  authenticate,
  requireScope("recommendations:view"),
  [
    body("customerId").isString().notEmpty().withMessage("Customer ID is required"),
    body("origin").isObject().withMessage("Origin is required"),
    body("destination").isObject().withMessage("Destination is required"),
    body("weight").isFloat({ min: 0 }).withMessage("Weight must be a positive number"),
    body("dimensions").optional().isObject().withMessage("Dimensions must be an object"),
    body("urgency")
      .optional()
      .isIn(["express", "standard", "economy"])
      .withMessage("Invalid urgency level"),
    body("budget").optional().isFloat({ min: 0 }).withMessage("Budget must be positive"),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
      const recommendations = await recommendationService.getServiceRecommendations(req.body);
      res.status(200).json({
        success: true,
        data: recommendations,
        count: recommendations.length,
        message: "Service recommendations generated successfully",
      });
  }),
);

/**
 * POST /api/recommendations/routes
 * Get route recommendations for a shipment
 */
router.post(
  "/routes",
  limiters.general,
  authenticate,
  requireScope("recommendations:view"),
  [
    body("origin").isObject().withMessage("Origin with lat/lng is required"),
    body("destination").isObject().withMessage("Destination with lat/lng is required"),
    body("vehicleType").optional().isString().withMessage("Vehicle type must be a string"),
    body("urgency")
      .optional()
      .isIn(["express", "standard", "economy"])
      .withMessage("Invalid urgency level"),
    body("avoidTolls").optional().isBoolean().withMessage("avoidTolls must be boolean"),
    body("avoidHighways").optional().isBoolean().withMessage("avoidHighways must be boolean"),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
      const recommendations = await recommendationService.getRouteRecommendations(req.body);
      res.status(200).json({
        success: true,
        data: recommendations,
        count: recommendations.length,
        message: "Route recommendations generated successfully",
      });
  }),
);

/**
 * POST /api/recommendations/drivers
 * Get driver recommendations for a shipment
 */
router.post(
  "/drivers",
  limiters.general,
  authenticate,
  requireScope("recommendations:view"),
  [
    body("shipmentId").optional().isString().withMessage("Shipment ID must be a string"),
    body("origin").isObject().withMessage("Origin with lat/lng is required"),
    body("destination").isObject().withMessage("Destination with lat/lng is required"),
    body("vehicleType").optional().isString().withMessage("Vehicle type must be a string"),
    body("pickupTime").optional().isISO8601().withMessage("Invalid pickup time format"),
    body("deliveryTime").optional().isISO8601().withMessage("Invalid delivery time format"),
    body("specialRequirements")
      .optional()
      .isArray()
      .withMessage("Special requirements must be an array"),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
      const recommendations = await recommendationService.getDriverRecommendations(req.body);
      res.status(200).json({
        success: true,
        data: recommendations,
        count: recommendations.length,
        message: "Driver recommendations generated successfully",
      });
  }),
);

/**
 * POST /api/recommendations/vehicles
 * Get vehicle recommendations for a shipment
 */
router.post(
  "/vehicles",
  limiters.general,
  authenticate,
  requireScope("recommendations:view"),
  [
    body("weight").isFloat({ min: 0 }).withMessage("Weight must be a positive number"),
    body("dimensions").optional().isObject().withMessage("Dimensions must be an object"),
    body("cargoType").isString().notEmpty().withMessage("Cargo type is required"),
    body("specialRequirements")
      .optional()
      .isArray()
      .withMessage("Special requirements must be an array"),
    body("origin").isObject().withMessage("Origin with lat/lng is required"),
    body("preferredFuelType")
      .optional()
      .isString()
      .withMessage("Preferred fuel type must be a string"),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
      const recommendations = await recommendationService.getVehicleRecommendations(req.body);
      res.status(200).json({
        success: true,
        data: recommendations,
        count: recommendations.length,
        message: "Vehicle recommendations generated successfully",
      });
  }),
);

/**
 * POST /api/recommendations/pricing
 * Get pricing recommendations based on market analysis
 */
router.post(
  "/pricing",
  limiters.general,
  authenticate,
  requireScope("recommendations:view"),
  [
    body("origin").isObject().withMessage("Origin with lat/lng is required"),
    body("destination").isObject().withMessage("Destination with lat/lng is required"),
    body("weight").isFloat({ min: 0 }).withMessage("Weight must be a positive number"),
    body("serviceType")
      .isIn(["express", "standard", "economy"])
      .withMessage("Invalid service type"),
    body("urgency")
      .optional()
      .isIn(["express", "standard", "economy"])
      .withMessage("Invalid urgency level"),
    body("customerId").optional().isString().withMessage("Customer ID must be a string"),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
      const recommendations = await recommendationService.getPricingRecommendations(req.body);
      res.status(200).json({
        success: true,
        data: recommendations,
        message: "Pricing recommendations generated successfully",
      });
  }),
);

/**
 * GET /api/recommendations/personalized/:customerId
 * Get personalized recommendations for a customer
 */
router.get(
  "/personalized/:customerId",
  limiters.general,
  authenticate,
  requireScope("recommendations:view"),
  [
    param("customerId").isString().notEmpty().withMessage("Customer ID is required"),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
      const { customerId } = req.params;
      const recommendations =
        await recommendationService.getPersonalizedRecommendations(customerId);
      res.status(200).json({
        success: true,
        data: recommendations,
        message: "Personalized recommendations generated successfully",
      });
  }),
);

/**
 * POST /api/recommendations/similar
 * Find similar items based on features (collaborative filtering)
 */
router.post(
  "/similar",
  limiters.general,
  authenticate,
  requireScope("recommendations:view"),
  [
    body("itemType")
      .isIn(["shipment", "customer", "driver", "vehicle"])
      .withMessage("Invalid item type"),
    body("itemId").isString().notEmpty().withMessage("Item ID is required"),
    body("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
      const { itemType, itemId, limit = 10 } = req.body;

      // Get similar items based on type
      let similar = [];
      if (itemType === "customer") {
        similar = await recommendationService.getSimilarCustomers(itemId, limit);
      } else if (itemType === "shipment") {
        similar = await recommendationService.getSimilarShipments(itemId, limit);
      }

      res.status(200).json({
        success: true,
        data: similar,
        count: similar.length,
        message: `Similar ${itemType}s found successfully`,
      });
  }),
);

/**
 * POST /api/recommendations/feedback
 * Provide feedback on recommendations (for learning)
 */
router.post(
  "/feedback",
  limiters.general,
  authenticate,
  requireScope("recommendations:update"),
  auditLog,
  [
    body("recommendationId").isString().notEmpty().withMessage("Recommendation ID is required"),
    body("recommendationType")
      .isIn(["service", "route", "driver", "vehicle", "pricing", "personalized"])
      .withMessage("Invalid recommendation type"),
    body("itemId").isString().notEmpty().withMessage("Item ID is required"),
    body("action").isIn(["accepted", "rejected", "modified"]).withMessage("Invalid action"),
    body("rating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("feedback").optional().isString().withMessage("Feedback must be a string"),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
      const { recommendationId, recommendationType, itemId, action, rating, feedback } = req.body;

      // Store feedback
      await prisma.recommendationFeedback.create({
        data: {
          recommendationId,
          recommendationType,
          itemId,
          action,
          rating: rating || null,
          feedback: feedback || null,
          userId: req.user.sub,
          timestamp: new Date(),
        },
      });

      res.status(201).json({
        success: true,
        message: "Feedback recorded successfully",
      });
  }),
);

/**
 * GET /api/recommendations/insights/:customerId
 * Get AI-driven insights for a customer
 */
router.get(
  "/insights/:customerId",
  limiters.general,
  authenticate,
  requireScope("recommendations:view"),
  [
    param("customerId").isString().notEmpty().withMessage("Customer ID is required"),
    query("timeRange")
      .optional()
      .isIn(["week", "month", "quarter", "year"])
      .withMessage("Invalid time range"),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
      const { customerId } = req.params;
      const { timeRange = "month" } = req.query;

      // Calculate time range
      const timeRanges = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365,
      };
      const days = timeRanges[timeRange];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get customer data
      const shipments = await prisma.shipment.findMany({
        where: {
          customerId,
          createdAt: { gte: startDate },
        },
      });

      // Generate insights
      const insights = {
        totalShipments: shipments.length,
        totalSpending: shipments.reduce((sum, s) => sum + (s.price || 0), 0),
        averageShipmentValue:
          shipments.length > 0
            ? shipments.reduce((sum, s) => sum + (s.price || 0), 0) / shipments.length
            : 0,
        preferredServices: recommendationService
          .getTopItems(
            shipments.map((s) => s.serviceType),
            3,
          )
          .map((item) => item.item),
        shippingFrequency: (shipments.length / days).toFixed(2),
        trends: {
          increasingVolume: shipments.length > 5,
          preferredDays: ["Tuesday", "Wednesday"],
          peakHours: ["10:00-12:00"],
        },
        recommendations: {
          suggestedService: shipments.length > 10 ? "monthly-plan" : "pay-as-you-go",
          potentialSavings: shipments.length > 10 ? 25 : 0,
          upsellOpportunities: [
            {
              service: "Express Upgrade",
              benefit: "50% faster delivery",
              discount: 15,
            },
          ],
        },
      };

      res.status(200).json({
        success: true,
        data: insights,
        timeRange,
        message: "Customer insights generated successfully",
      });
  }),
);

/**
 * GET /api/recommendations/trending
 * Get trending services, routes, and features
 */
router.get(
  "/trending",
  limiters.general,
  authenticate,
  requireScope("recommendations:view"),
  [
    query("category")
      .optional()
      .isIn(["services", "routes", "features", "all"])
      .withMessage("Invalid category"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
      const { category = "all", limit = 10 } = req.query;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get recent shipments
      const recentShipments = await prisma.shipment.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          serviceType: true,
          origin: true,
          destination: true,
          features: true,
        },
      });

      const trending = {};

      if (category === "services" || category === "all") {
        trending.services = recommendationService.getTopItems(
          recentShipments.map((s) => s.serviceType),
          parseInt(limit),
        );
      }

      if (category === "routes" || category === "all") {
        trending.routes = recommendationService
          .getTopItems(
            recentShipments.map((s) => `${s.origin} → ${s.destination}`),
            parseInt(limit),
          )
          .map((r) => {
            const [origin, destination] = r.item.split(" → ");
            return { origin, destination, popularity: r.frequency };
          });
      }

      if (category === "features" || category === "all") {
        const allFeatures = recentShipments.flatMap((s) => s.features || []).filter(Boolean);
        trending.features = recommendationService.getTopItems(allFeatures, parseInt(limit));
      }

      res.status(200).json({
        success: true,
        data: trending,
        period: "Last 30 days",
        message: "Trending data retrieved successfully",
      });
  }),
);

/**
 * GET /api/recommendations/health
 * Health check for recommendation service
 */
router.get("/health", async (req, res) => {
  try {
    // Check if we can access recommendation logs
    const recentLogs = await prisma.recommendationLog.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    res.status(200).json({
      success: true,
      status: "healthy",
      stats: {
        recommendationsGenerated24h: recentLogs,
        algorithmVersion: "1.0.0",
      },
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "unhealthy",
      error: error.message,
      timestamp: new Date(),
    });
  }
});

module.exports = router;
