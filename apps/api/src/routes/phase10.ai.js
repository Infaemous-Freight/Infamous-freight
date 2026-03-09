/**
 * Phase 10: Advanced AI/ML API Routes
 *
 * AI-powered services for intelligent freight management
 * Includes: Fraud Detection, Demand Forecasting, Route Optimization, Predictive Maintenance
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope, auditLog } = require("../middleware/security");
const { limiters } = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const { body, param, query } = require("express-validator");
const logger = require("../middleware/logger");

// Import AI/ML services
const fraudDetectionAI = require("../services/fraudDetectionAI");
const demandForecasting = require("../services/demandForecasting");
const routeOptimizationAI = require("../services/routeOptimizationAI");
const predictiveMaintenance = require("../services/predictiveMaintenance");

const { ApiResponse, HTTP_STATUS } = require("@infamous/shared");

/**
 * ====================
 * FRAUD DETECTION AI
 * ====================
 */

/**
 * Analyze transaction for fraud
 * POST /api/ai/fraud/analyze
 */
router.post(
  "/fraud/analyze",
  limiters.ai,
  authenticate,
  requireScope("ai:fraud"),
  auditLog,
  [
    body("userId").isUUID().withMessage("Valid user ID required"),
    body("amount").isFloat({ min: 0.01 }).withMessage("Valid amount required"),
    body("currency")
      .isString()
      .isLength({ min: 3, max: 3 })
      .withMessage("Valid currency code required"),
    body("paymentMethod")
      .isString()
      .isIn(["card", "bank_transfer", "crypto", "wallet", "bnpl"])
      .withMessage("Valid payment method required"),
    body("ipAddress").optional().isIP().withMessage("Valid IP address required"),
    body("location").optional().isObject().withMessage("Valid location object required"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const result = await fraudDetectionAI.analyzeTransaction(req.body);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: result,
          message: "Fraud analysis completed",
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Get user fraud statistics
 * GET /api/ai/fraud/user/:userId/stats
 */
router.get(
  "/fraud/user/:userId/stats",
  limiters.general,
  authenticate,
  requireScope("ai:fraud"),
  [
    param("userId").isUUID().withMessage("Valid user ID required"),
    query("days").optional().isInt({ min: 1, max: 365 }).withMessage("Days must be between 1-365"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const days = parseInt(req.query.days) || 30;

      const stats = await fraudDetectionAI.getUserFraudStats(userId, days);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: stats,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * ====================
 * DEMAND FORECASTING
 * ====================
 */

/**
 * Generate demand forecast
 * POST /api/ai/forecast/generate
 */
router.post(
  "/forecast/generate",
  limiters.ai,
  authenticate,
  requireScope("ai:forecast"),
  auditLog,
  [
    body("region").optional().isString().withMessage("Valid region required"),
    body("horizon")
      .optional()
      .isIn(["DAILY", "WEEKLY", "MONTHLY"])
      .withMessage("Valid horizon required"),
    body("includeConfidenceIntervals").optional().isBoolean(),
    body("modelPreference").optional().isIn(["ARIMA", "PROPHET", "LSTM"]),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const result = await demandForecasting.generateForecast(req.body);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: result,
          message: "Demand forecast generated",
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Evaluate forecast accuracy
 * GET /api/ai/forecast/:forecastId/accuracy
 */
router.get(
  "/forecast/:forecastId/accuracy",
  limiters.general,
  authenticate,
  requireScope("ai:forecast"),
  [param("forecastId").isUUID().withMessage("Valid forecast ID required"), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { forecastId } = req.params;
      const accuracy = await demandForecasting.evaluateForecastAccuracy(forecastId);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: accuracy,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * ====================
 * ROUTE OPTIMIZATION
 * ====================
 */

/**
 * Optimize multi-stop route
 * POST /api/ai/route/optimize
 */
router.post(
  "/route/optimize",
  limiters.ai,
  authenticate,
  requireScope("ai:route"),
  auditLog,
  [
    body("stops").isArray({ min: 2, max: 50 }).withMessage("2-50 stops required"),
    body("stops.*.latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude required"),
    body("stops.*.longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Valid longitude required"),
    body("stops.*.address").isString().withMessage("Valid address required"),
    body("algorithm")
      .optional()
      .isIn(["NEAREST_NEIGHBOR", "TWO_OPT", "GENETIC", "SIMULATED_ANNEALING"]),
    body("vehicleType").optional().isIn(["VAN", "TRUCK", "SEMI"]),
    body("includeTraffic").optional().isBoolean(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { stops, ...options } = req.body;
      const result = await routeOptimizationAI.optimizeRoute(stops, options);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: result,
          message: "Route optimized successfully",
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Dynamic rerouting
 * POST /api/ai/route/reroute
 */
router.post(
  "/route/reroute",
  limiters.ai,
  authenticate,
  requireScope("ai:route"),
  [
    body("currentLocation").isObject().withMessage("Current location required"),
    body("currentLocation.lat").isFloat({ min: -90, max: 90 }),
    body("currentLocation.lon").isFloat({ min: -180, max: 180 }),
    body("remainingStops").isArray({ min: 1 }).withMessage("At least 1 remaining stop required"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { currentLocation, remainingStops, ...options } = req.body;
      const result = await routeOptimizationAI.rerouteRealTime(
        currentLocation,
        remainingStops,
        options,
      );

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: result,
          message: "Route recalculated",
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * ====================
 * PREDICTIVE MAINTENANCE
 * ====================
 */

/**
 * Analyze vehicle health
 * POST /api/ai/maintenance/analyze/:vehicleId
 */
router.post(
  "/maintenance/analyze/:vehicleId",
  limiters.ai,
  authenticate,
  requireScope("ai:maintenance"),
  auditLog,
  [param("vehicleId").isUUID().withMessage("Valid vehicle ID required"), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { vehicleId } = req.params;
      const analysis = await predictiveMaintenance.analyzeVehicle(vehicleId);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: analysis,
          message: "Vehicle health analyzed",
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Ingest IoT sensor data
 * POST /api/ai/maintenance/sensors/:vehicleId
 */
router.post(
  "/maintenance/sensors/:vehicleId",
  limiters.ai,
  authenticate,
  requireScope("ai:maintenance:sensors"),
  [
    param("vehicleId").isUUID().withMessage("Valid vehicle ID required"),
    body("sensorData").isArray({ min: 1 }).withMessage("Sensor data array required"),
    body("sensorData.*.sensor").isString().withMessage("Sensor type required"),
    body("sensorData.*.value").isFloat().withMessage("Sensor value required"),
    body("sensorData.*.unit").isString().withMessage("Unit required"),
    body("sensorData.*.timestamp").isISO8601().withMessage("Valid timestamp required"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { vehicleId } = req.params;
      const { sensorData } = req.body;

      const result = await predictiveMaintenance.ingestSensorData(vehicleId, sensorData);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: result,
          message: "Sensor data ingested",
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Get fleet maintenance overview
 * GET /api/ai/maintenance/fleet/overview
 */
router.get(
  "/maintenance/fleet/overview",
  limiters.general,
  authenticate,
  requireScope("ai:maintenance"),
  async (req, res, next) => {
    try {
      const overview = await predictiveMaintenance.getFleetMaintenanceOverview();

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: overview,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * ====================
 * HEALTH CHECK
 * ====================
 */

/**
 * Phase 10 health check
 * GET /api/ai/health
 */
router.get("/health", async (req, res) => {
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse({
      success: true,
      data: {
        phase: "Phase 10: AI/ML Services",
        status: "operational",
        services: {
          fraudDetection: "active",
          demandForecasting: "active",
          routeOptimization: "active",
          predictiveMaintenance: "active",
        },
        modelVersions: {
          fraudDetection: fraudDetectionAI.model.modelVersion,
          demandForecasting: Object.keys(demandForecasting.MODELS).join(", "),
          routeOptimization: Object.keys(routeOptimizationAI.ALGORITHMS).join(", "),
          predictiveMaintenance: predictiveMaintenance.analyzer.modelVersion,
        },
        timestamp: new Date(),
      },
    }),
  );
});

module.exports = router;
