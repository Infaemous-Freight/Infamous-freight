/**
 * Analytics Routes
 * Endpoints for business intelligence, performance metrics, and forecasting
 * GET /api/analytics/performance - Shipment metrics
 * GET /api/analytics/revenue - Revenue forecasting
 * GET /api/analytics/regions/:region - Regional analysis
 * GET /api/analytics/drivers - Driver performance
 * GET /api/analytics/satisfaction - Customer satisfaction
 * GET /api/analytics/costs - Cost analysis
 *
 * @module routes/analytics
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope } = require("../middleware/security");
const analyticsService = require("../services/analytics");
const {
  calculateLaneProfitability,
  calculateBrokerScore,
} = require("../services/profitabilityEngine");

// All analytics routes require authentication and analytics scope
router.use(authenticate);
router.use(requireScope("analytics:read"));

/**
 * GET /api/analytics/performance
 * Get shipment performance metrics with optional filters
 * @query {string} startDate - ISO date string
 * @query {string} endDate - ISO date string
 * @query {string} region - Region code
 * @query {string} status - Shipment status
 */
router.get("/performance", async (req, res, next) => {
  try {
    const metrics = await analyticsService.getShipmentMetrics({
      startDate: req.query.startDate ? new Date(req.query.startDate) : null,
      endDate: req.query.endDate ? new Date(req.query.endDate) : null,
      region: req.query.region,
      status: req.query.status,
    });

    res.json({
      success: true,
      data: {
        metrics,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/revenue
 * Forecast revenue for upcoming months using linear regression
 * @query {number} monthsAhead - Number of months to forecast (default 3)
 */
router.get("/revenue", async (req, res, next) => {
  try {
    const monthsAhead = parseInt(req.query.monthsAhead || "3", 10);

    const forecast = await analyticsService.forecastRevenue(monthsAhead);

    res.json({
      success: true,
      data: {
        forecast,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/regions/:region
 * Get performance analytics for a specific region
 */
router.get("/regions/:region", async (req, res, next) => {
  try {
    const regional = await analyticsService.getRegionalAnalytics(req.params.region);

    res.json({
      success: true,
      data: regional,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/drivers
 * Get performance metrics for all drivers
 */
router.get("/drivers", async (req, res, next) => {
  try {
    const drivers = await analyticsService.getDriverAnalytics();

    res.json({
      success: true,
      data: {
        drivers,
        totalDrivers: drivers.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/satisfaction
 * Get customer satisfaction metrics and NPS
 */
router.get("/satisfaction", async (req, res, next) => {
  try {
    const satisfaction = await analyticsService.getCustomerSatisfaction();

    res.json({
      success: true,
      data: satisfaction,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/costs
 * Get cost analysis and optimization opportunities
 */
router.get("/costs", async (req, res, next) => {
  try {
    const costs = await analyticsService.getCostAnalysis();

    res.json({
      success: true,
      data: costs,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/lane-profit
 * AI-assisted lane profitability recommendation
 */
router.get("/lane-profit", async (req, res, next) => {
  try {
    const profitability = calculateLaneProfitability({
      rate: req.query.rate,
      mileage: req.query.mileage,
      fuelPrice: req.query.fuelPrice,
      mpg: req.query.mpg,
      detentionHours: req.query.detentionHours,
      brokerScore: req.query.brokerScore,
    });

    res.json({
      success: true,
      data: profitability,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/analytics/broker-risk
 * Weighted broker risk scoring (0-100)
 */
router.post("/broker-risk", async (req, res, next) => {
  try {
    const score = calculateBrokerScore(req.body);
    res.json({
      success: true,
      data: {
        score,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
