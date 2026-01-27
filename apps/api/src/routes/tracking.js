/**
 * GPS Satellite Tracking API Routes
 * Real-time location tracking, geofencing, route monitoring, and analytics
 */

const express = require("express");
const router = express.Router();
const trackingService = require("../services/trackingService");
const { authenticate, requireScope, limiters, auditLog } = require("../middleware/security");
const { body, param, query, validationResult } = require("express-validator");
const { handleValidationErrors } = require("../middleware/validation");

// Rate limiters specific to tracking operations
const trackingLimiters = {
    locationUpdate: limiters.rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 60, // Allow 60 updates per minute (1 per second)
        message: { error: "Too many location updates. Maximum 60 per minute." },
    }),
    query: limiters.general, // Standard rate limit for queries
};

/**
 * POST /api/tracking/location
 * Update GPS location for an entity (vehicle, driver, shipment)
 */
router.post(
    "/location",
    trackingLimiters.locationUpdate,
    authenticate,
    requireScope("tracking:update"),
    auditLog,
    [
        body("entityType")
            .isIn(["vehicle", "driver", "shipment"])
            .withMessage("Invalid entity type"),
        body("entityId")
            .isString()
            .notEmpty()
            .withMessage("Entity ID is required"),
        body("latitude")
            .isFloat({ min: -90, max: 90 })
            .withMessage("Invalid latitude"),
        body("longitude")
            .isFloat({ min: -180, max: 180 })
            .withMessage("Invalid longitude"),
        body("altitude")
            .optional()
            .isFloat()
            .withMessage("Altitude must be a number"),
        body("speed")
            .optional()
            .isFloat({ min: 0 })
            .withMessage("Speed must be positive"),
        body("heading")
            .optional()
            .isFloat({ min: 0, max: 360 })
            .withMessage("Heading must be between 0 and 360"),
        body("accuracy")
            .optional()
            .isFloat({ min: 0 })
            .withMessage("Accuracy must be positive"),
        body("source")
            .optional()
            .isIn(["gps", "cellular", "wifi", "manual"])
            .withMessage("Invalid source"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const result = await trackingService.updateLocation(req.body);
            res.status(200).json({
                success: true,
                data: result,
                message: "Location updated successfully",
            });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * GET /api/tracking/location/:entityType/:entityId
 * Get current location for an entity
 */
router.get(
    "/location/:entityType/:entityId",
    trackingLimiters.query,
    authenticate,
    requireScope("tracking:view"),
    [
        param("entityType")
            .isIn(["vehicle", "driver", "shipment"])
            .withMessage("Invalid entity type"),
        param("entityId")
            .isString()
            .notEmpty()
            .withMessage("Entity ID is required"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { entityType, entityId } = req.params;
            const location = await trackingService.getCurrentLocation(
                entityType,
                entityId,
            );

            if (!location) {
                return res.status(404).json({
                    success: false,
                    error: "No location data found for this entity",
                });
            }

            res.status(200).json({
                success: true,
                data: location,
            });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * GET /api/tracking/history/:entityType/:entityId
 * Get location history for an entity
 */
router.get(
    "/history/:entityType/:entityId",
    trackingLimiters.query,
    authenticate,
    requireScope("tracking:view"),
    [
        param("entityType")
            .isIn(["vehicle", "driver", "shipment"])
            .withMessage("Invalid entity type"),
        param("entityId")
            .isString()
            .notEmpty()
            .withMessage("Entity ID is required"),
        query("startTime")
            .optional()
            .isISO8601()
            .withMessage("Invalid start time format"),
        query("endTime")
            .optional()
            .isISO8601()
            .withMessage("Invalid end time format"),
        query("limit")
            .optional()
            .isInt({ min: 1, max: 10000 })
            .withMessage("Limit must be between 1 and 10000"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { entityType, entityId } = req.params;
            const { startTime, endTime, limit } = req.query;

            const history = await trackingService.getLocationHistory({
                entityType,
                entityId,
                startTime,
                endTime,
                limit: limit ? parseInt(limit) : undefined,
            });

            res.status(200).json({
                success: true,
                data: history,
            });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * POST /api/tracking/geofence
 * Create a geofence zone
 */
router.post(
    "/geofence",
    trackingLimiters.query,
    authenticate,
    requireScope("tracking:geofence"),
    auditLog,
    [
        body("name")
            .isString()
            .notEmpty()
            .withMessage("Geofence name is required"),
        body("type")
            .isIn(["circle", "polygon"])
            .withMessage("Geofence type must be circle or polygon"),
        body("latitude")
            .if(body("type").equals("circle"))
            .isFloat({ min: -90, max: 90 })
            .withMessage("Invalid latitude"),
        body("longitude")
            .if(body("type").equals("circle"))
            .isFloat({ min: -180, max: 180 })
            .withMessage("Invalid longitude"),
        body("radiusMeters")
            .if(body("type").equals("circle"))
            .isInt({ min: 1 })
            .withMessage("Radius must be positive"),
        body("polygon")
            .if(body("type").equals("polygon"))
            .isArray({ min: 3 })
            .withMessage("Polygon requires at least 3 points"),
        body("entityType")
            .optional()
            .isIn(["vehicle", "driver", "shipment"])
            .withMessage("Invalid entity type"),
        body("entityId")
            .optional()
            .isString()
            .withMessage("Entity ID must be a string"),
        body("alertOnEnter")
            .optional()
            .isBoolean()
            .withMessage("alertOnEnter must be boolean"),
        body("alertOnExit")
            .optional()
            .isBoolean()
            .withMessage("alertOnExit must be boolean"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const geofence = await trackingService.createGeofence(req.body);
            res.status(201).json({
                success: true,
                data: geofence,
                message: "Geofence created successfully",
            });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * GET /api/tracking/geofence/:geofenceId/events
 * Get geofence entry/exit events
 */
router.get(
    "/geofence/:geofenceId/events",
    trackingLimiters.query,
    authenticate,
    requireScope("tracking:view"),
    [
        param("geofenceId")
            .isString()
            .notEmpty()
            .withMessage("Geofence ID is required"),
        query("limit")
            .optional()
            .isInt({ min: 1, max: 1000 })
            .withMessage("Limit must be between 1 and 1000"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { geofenceId } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit) : 100;

            const events = await prisma.geofenceEvent.findMany({
                where: { geofenceId },
                orderBy: { timestamp: "desc" },
                take: limit,
            });

            res.status(200).json({
                success: true,
                data: events,
                count: events.length,
            });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * GET /api/tracking/analytics/:entityType/:entityId
 * Get tracking analytics for an entity
 */
router.get(
    "/analytics/:entityType/:entityId",
    trackingLimiters.query,
    authenticate,
    requireScope("tracking:view"),
    [
        param("entityType")
            .isIn(["vehicle", "driver", "shipment"])
            .withMessage("Invalid entity type"),
        param("entityId")
            .isString()
            .notEmpty()
            .withMessage("Entity ID is required"),
        query("startTime")
            .optional()
            .isISO8601()
            .withMessage("Invalid start time format"),
        query("endTime")
            .optional()
            .isISO8601()
            .withMessage("Invalid end time format"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { entityType, entityId } = req.params;
            const { startTime, endTime } = req.query;

            const analytics = await trackingService.getAnalytics({
                entityType,
                entityId,
                startTime,
                endTime,
            });

            res.status(200).json({
                success: true,
                data: analytics,
            });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * GET /api/tracking/alerts
 * Get tracking alerts (delays, geofence violations, etc.)
 */
router.get(
    "/alerts",
    trackingLimiters.query,
    authenticate,
    requireScope("tracking:view"),
    [
        query("entityType")
            .optional()
            .isIn(["vehicle", "driver", "shipment"])
            .withMessage("Invalid entity type"),
        query("entityId")
            .optional()
            .isString()
            .withMessage("Entity ID must be a string"),
        query("alertType")
            .optional()
            .isIn(["delay", "geofence_entry", "geofence_exit", "approaching_destination", "speed_limit"])
            .withMessage("Invalid alert type"),
        query("severity")
            .optional()
            .isIn(["low", "medium", "high", "critical"])
            .withMessage("Invalid severity level"),
        query("acknowledged")
            .optional()
            .isBoolean()
            .withMessage("acknowledged must be boolean"),
        query("limit")
            .optional()
            .isInt({ min: 1, max: 500 })
            .withMessage("Limit must be between 1 and 500"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const alerts = await trackingService.getAlerts(req.query);
            res.status(200).json({
                success: true,
                data: alerts,
                count: alerts.length,
            });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * PUT /api/tracking/alerts/:alertId/acknowledge
 * Acknowledge a tracking alert
 */
router.put(
    "/alerts/:alertId/acknowledge",
    trackingLimiters.query,
    authenticate,
    requireScope("tracking:update"),
    auditLog,
    [
        param("alertId")
            .isString()
            .notEmpty()
            .withMessage("Alert ID is required"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { alertId } = req.params;
            const acknowledgedBy = req.user.sub;

            const alert = await trackingService.acknowledgeAlert(
                alertId,
                acknowledgedBy,
            );

            res.status(200).json({
                success: true,
                data: alert,
                message: "Alert acknowledged successfully",
            });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * GET /api/tracking/entities
 * Get all entities currently being tracked
 */
router.get(
    "/entities",
    trackingLimiters.query,
    authenticate,
    requireScope("tracking:view"),
    async (req, res, next) => {
        try {
            const entities = await trackingService.getTrackedEntities();
            res.status(200).json({
                success: true,
                data: entities,
                count: entities.length,
                active: entities.filter((e) => e.isActive).length,
            });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * GET /api/tracking/health
 * Health check endpoint for tracking service
 */
router.get("/health", async (req, res) => {
    try {
        // Check if we can query the database
        const recentLocations = await prisma.location.count({
            where: {
                timestamp: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
            },
        });

        const activeTracking = await prisma.trackingSummary.count({
            where: {
                lastUpdated: {
                    gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
                },
            },
        });

        res.status(200).json({
            success: true,
            status: "healthy",
            stats: {
                recentLocations24h: recentLocations,
                activeTracking,
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
