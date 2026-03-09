/**
 * Phase 11: Advanced Analytics & Intelligence API Routes
 *
 * Endpoints for real-time analytics, cohort analysis, predictive analytics, and BI reports
 */

const express = require("express");
const { body, query, param } = require("express-validator");
const router = express.Router();

// Middleware
const { authenticate, requireScope, auditLog, limiters } = require("../middleware/security");
const { handleValidationErrors } = require("../middleware/validation");

// Services
const realTimeAnalytics = require("../services/realTimeAnalytics");
const cohortAnalysis = require("../services/cohortAnalysis");
const predictiveAnalytics = require("../services/predictiveAnalytics");
const businessIntelligence = require("../services/businessIntelligence");

// Shared types
const { HTTP_STATUS } = require("@infamous/shared");

// ==============================================
// Real-Time Analytics Endpoints
// ==============================================

/**
 * GET /api/analytics/kpi/:metricName
 * Get live KPI value
 */
router.get(
  "/kpi/:metricName",
  limiters.ai,
  authenticate,
  requireScope("analytics:read"),
  [
    param("metricName").isString().notEmpty(),
    query("timeRange").optional().isIn(["today", "this_week", "this_month"]),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { metricName } = req.params;
      const { timeRange = "today" } = req.query;

      const result = await realTimeAnalytics.getKPI(metricName, timeRange);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/analytics/time-series
 * Get time series data for charting
 */
router.post(
  "/time-series",
  limiters.ai,
  authenticate,
  requireScope("analytics:read"),
  [
    body("metricName").isString().notEmpty(),
    body("startDate").isISO8601(),
    body("endDate").isISO8601(),
    body("granularity").optional().isIn(["REAL_TIME", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH"]),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { metricName, startDate, endDate, granularity = "HOUR" } = req.body;

      const result = await realTimeAnalytics.getTimeSeries(
        metricName,
        new Date(startDate),
        new Date(endDate),
        granularity,
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/analytics/dashboard/snapshot
 * Get complete dashboard snapshot
 */
router.get(
  "/dashboard/snapshot",
  limiters.ai,
  authenticate,
  requireScope("analytics:read"),
  async (req, res, next) => {
    try {
      const kpiList = req.query.kpis ? req.query.kpis.split(",") : [];

      const result = await realTimeAnalytics.getDashboardSnapshot(kpiList);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/analytics/export
 * Export analytics data
 */
router.get(
  "/export",
  limiters.export,
  authenticate,
  requireScope("analytics:read"),
  [query("format").optional().isIn(["csv", "json", "pdf"]), query("filters").optional().isString()],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { format = "json", filters } = req.query;
      let parsedFilters = undefined;

      if (filters) {
        try {
          parsedFilters = JSON.parse(filters);
        } catch (error) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: "Invalid filters JSON",
          });
        }
      }

      const result = await realTimeAnalytics.exportData(format, parsedFilters);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/analytics/widget
 * Create custom dashboard widget
 */
router.post(
  "/widget",
  limiters.general,
  authenticate,
  requireScope("analytics:write"),
  auditLog,
  [
    body("name").isString().notEmpty().isLength({ min: 3, max: 100 }),
    body("type").isIn([
      "kpi_card",
      "line_chart",
      "bar_chart",
      "pie_chart",
      "map",
      "table",
      "heatmap",
      "gauge",
    ]),
    body("metric").isString().notEmpty(),
    body("config").optional().isObject(),
    body("position").optional().isObject(),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const widgetConfig = {
        ...req.body,
        userId: req.user.sub,
      };

      const result = await realTimeAnalytics.createWidget(widgetConfig);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// ==============================================
// Cohort Analysis Endpoints
// ==============================================

/**
 * POST /api/analytics/cohort
 * Create customer cohort
 */
router.post(
  "/cohort",
  limiters.ai,
  authenticate,
  requireScope("analytics:cohort"),
  auditLog,
  [
    body("name").isString().notEmpty().isLength({ min: 3, max: 100 }),
    body("type").isIn([
      "signup_date",
      "first_order",
      "spending_tier",
      "activity_level",
      "geographic",
      "behavioral",
      "custom",
    ]),
    body("criteria").isObject(),
    body("dateRange").optional().isObject(),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const cohortDefinition = req.body;

      const result = await cohortAnalysis.createCohort(cohortDefinition);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/analytics/cohort/:cohortId/retention
 * Analyze cohort retention
 */
router.get(
  "/cohort/:cohortId/retention",
  limiters.ai,
  authenticate,
  requireScope("analytics:cohort"),
  [param("cohortId").isUUID(), query("periodMonths").optional().isInt({ min: 1, max: 24 })],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { cohortId } = req.params;
      const periodMonths = parseInt(req.query.periodMonths) || 12;

      const result = await cohortAnalysis.analyzeRetention(cohortId, periodMonths);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/analytics/user/:userId/ltv
 * Calculate customer lifetime value
 */
router.get(
  "/user/:userId/ltv",
  limiters.ai,
  authenticate,
  requireScope("analytics:cohort"),
  [param("userId").isUUID(), query("predictionMonths").optional().isInt({ min: 1, max: 36 })],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const predictionMonths = parseInt(req.query.predictionMonths) || 12;

      const result = await cohortAnalysis.calculateLTV(userId, predictionMonths);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/analytics/rfm-analysis
 * Perform RFM analysis
 */
router.post(
  "/rfm-analysis",
  limiters.ai,
  authenticate,
  requireScope("analytics:cohort"),
  [body("userIds").optional().isArray(), body("userIds.*").optional().isUUID()],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { userIds } = req.body;

      const result = await cohortAnalysis.performRFMAnalysis(userIds);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/analytics/lookalike
 * Create lookalike audience
 */
router.post(
  "/lookalike",
  limiters.ai,
  authenticate,
  requireScope("analytics:cohort"),
  [
    body("seedUserIds").isArray().notEmpty(),
    body("seedUserIds.*").isUUID(),
    body("similarityThreshold").optional().isFloat({ min: 0, max: 1 }),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { seedUserIds, similarityThreshold = 0.7 } = req.body;

      const result = await cohortAnalysis.createLookalikeAudience(seedUserIds, similarityThreshold);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// ==============================================
// Predictive Analytics Endpoints
// ==============================================

/**
 * GET /api/analytics/predict/churn/:userId
 * Predict customer churn probability
 */
router.get(
  "/predict/churn/:userId",
  limiters.ai,
  authenticate,
  requireScope("analytics:predict"),
  [param("userId").isUUID(), query("timeHorizonDays").optional().isInt({ min: 1, max: 365 })],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const timeHorizonDays = parseInt(req.query.timeHorizonDays) || 30;

      const result = await predictiveAnalytics.predictChurn(userId, timeHorizonDays);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/analytics/predict/ltv/:userId
 * Predict customer lifetime value
 */
router.get(
  "/predict/ltv/:userId",
  limiters.ai,
  authenticate,
  requireScope("analytics:predict"),
  [param("userId").isUUID(), query("timeHorizonMonths").optional().isInt({ min: 1, max: 36 })],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const timeHorizonMonths = parseInt(req.query.timeHorizonMonths) || 12;

      const result = await predictiveAnalytics.predictLTV(userId, timeHorizonMonths);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/analytics/predict/upsell/:userId
 * Identify upsell opportunities
 */
router.get(
  "/predict/upsell/:userId",
  limiters.ai,
  authenticate,
  requireScope("analytics:predict"),
  [param("userId").isUUID()],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      const result = await predictiveAnalytics.identifyUpsellOpportunities(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/analytics/predict/campaign-response
 * Predict campaign response
 */
router.post(
  "/predict/campaign-response",
  limiters.ai,
  authenticate,
  requireScope("analytics:predict"),
  [body("userId").isUUID(), body("campaignType").isString().notEmpty()],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { userId, campaignType } = req.body;

      const result = await predictiveAnalytics.predictCampaignResponse(userId, campaignType);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/analytics/what-if
 * Perform what-if scenario analysis
 */
router.post(
  "/what-if",
  limiters.ai,
  authenticate,
  requireScope("analytics:predict"),
  [body("name").optional().isString(), body("baseMetrics").isObject(), body("changes").isObject()],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const scenarioConfig = req.body;

      const result = await predictiveAnalytics.whatIfAnalysis(scenarioConfig);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// ==============================================
// Business Intelligence Reports Endpoints
// ==============================================

/**
 * GET /api/analytics/report/executive-summary
 * Generate executive summary report
 */
router.get(
  "/report/executive-summary",
  limiters.ai,
  authenticate,
  requireScope("analytics:reports"),
  [
    query("dateRange")
      .optional()
      .isIn(["today", "yesterday", "last_7_days", "last_30_days", "this_month", "last_month"]),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { dateRange = "last_7_days" } = req.query;

      const result = await businessIntelligence.generateExecutiveSummary(dateRange);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/analytics/report/financial
 * Generate financial performance report
 */
router.post(
  "/report/financial",
  limiters.ai,
  authenticate,
  requireScope("analytics:reports"),
  [body("startDate").isISO8601(), body("endDate").isISO8601()],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.body;

      const result = await businessIntelligence.generateFinancialReport(
        new Date(startDate),
        new Date(endDate),
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/analytics/report/operational
 * Generate operational performance report
 */
router.post(
  "/report/operational",
  limiters.ai,
  authenticate,
  requireScope("analytics:reports"),
  [body("startDate").isISO8601(), body("endDate").isISO8601()],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.body;

      const result = await businessIntelligence.generateOperationalReport(
        new Date(startDate),
        new Date(endDate),
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/analytics/report/trend
 * Generate trend analysis report
 */
router.post(
  "/report/trend",
  limiters.ai,
  authenticate,
  requireScope("analytics:reports"),
  [
    body("metricName").isString().notEmpty(),
    body("lookbackDays").optional().isInt({ min: 7, max: 365 }),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { metricName, lookbackDays = 90 } = req.body;

      const result = await businessIntelligence.generateTrendAnalysis(metricName, lookbackDays);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/analytics/report/custom
 * Generate custom report
 */
router.post(
  "/report/custom",
  limiters.ai,
  authenticate,
  requireScope("analytics:reports"),
  [body("template").isString().notEmpty(), body("parameters").optional().isObject()],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const reportConfig = req.body;

      const result = await businessIntelligence.generateCustomReport(reportConfig);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/analytics/report/schedule
 * Schedule automated report
 */
router.post(
  "/report/schedule",
  limiters.general,
  authenticate,
  requireScope("analytics:reports:schedule"),
  auditLog,
  [
    body("type").isString().notEmpty(),
    body("frequency").isIn(["daily", "weekly", "monthly", "quarterly", "annual"]),
    body("recipients").isArray().notEmpty(),
    body("recipients.*").isEmail(),
    body("format").optional().isIn(["pdf", "html", "json", "csv", "excel"]),
    body("parameters").optional().isObject(),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const reportConfig = req.body;

      const result = await businessIntelligence.scheduleReport(reportConfig);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/analytics/report/:reportId/export
 * Export report to specified format
 */
router.get(
  "/report/:reportId/export",
  limiters.general,
  authenticate,
  requireScope("analytics:reports"),
  [
    param("reportId").isUUID(),
    query("format").optional().isIn(["pdf", "html", "json", "csv", "excel"]),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { reportId } = req.params;
      const { format = "pdf" } = req.query;

      const result = await businessIntelligence.exportReport(reportId, format);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/analytics/health
 * Health check endpoint
 */
router.get("/health", async (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      status: "operational",
      timestamp: new Date(),
      services: {
        realTimeAnalytics: "available",
        cohortAnalysis: "available",
        predictiveAnalytics: "available",
        businessIntelligence: "available",
      },
      version: "11.0.0",
    },
  });
});

module.exports = router;
