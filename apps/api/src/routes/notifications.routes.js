/**
 * Push Notification API Routes
 * Handles FCM/APNs device token management and notification preferences
 * Protected with JWT authentication
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope } = require("../middleware/security");
const { handleValidationErrors } = require("../middleware/validation");
const { body, query } = require("express-validator");
const logger = require("../middleware/logger");

const pushNotificationService = require("../services/pushNotificationService");

/**
 * POST /api/notifications/register-device
 * Register device token for push notifications
 */
router.post(
  "/register-device",
  authenticate,
  [
    body("token").isString().isLength({ min: 50 }).withMessage("Invalid device token"),
    body("platform").isIn(["android", "ios"]).withMessage("Platform must be android or ios"),
    body("appVersion").optional().isString(),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { token, platform, appVersion } = req.body;

      const result = await pushNotificationService.registerDeviceToken(
        req.user.sub,
        token,
        platform,
        appVersion,
      );

      res.status(201).json({
        success: true,
        data: result,
      });

      logger.info("Notifications: Device registered", {
        userId: req.user.sub,
        platform,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/notifications/subscribe-topic
 * Subscribe to notification topic
 */
router.post(
  "/subscribe-topic",
  authenticate,
  [
    body("topic")
      .isIn([
        "loads_available",
        "price_alerts",
        "promotions",
        "maintenance",
        "compliance",
        "earnings",
      ])
      .withMessage("Invalid topic"),
    body("notificationTypes").optional().isArray(),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { topic, notificationTypes = [] } = req.body;

      const result = await pushNotificationService.subscribeToTopic(
        req.user.sub,
        topic,
        notificationTypes,
      );

      res.status(200).json({
        success: true,
        data: result,
      });

      logger.info("Notifications: Topic subscription", {
        userId: req.user.sub,
        topic,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/notifications/test
 * Send test notification to verify device token
 */
router.post("/test", authenticate, async (req, res, next) => {
  try {
    const testNotification = {
      type: "test",
      templateType: "urgentAlert",
      data: {
        message: "This is a test notification from Infæmous Freight",
      },
      clickTarget: "/shipments",
    };

    const result = await pushNotificationService.sendToDriver(req.user.sub, testNotification);

    if (result.notificationsSent === 0) {
      return res.status(400).json({
        success: false,
        error: "No registered devices. Please register a device token first.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: "Test notification sent",
        devicesReached: result.notificationsSent,
      },
    });

    logger.info("Notifications: Test sent", { userId: req.user.sub });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/history
 * Get notification history for user
 */
router.get(
  "/history",
  authenticate,
  [query("limit").optional().isNumeric()],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { limit = 50 } = req.query;

      const history = await pushNotificationService.getNotificationHistory(
        req.user.sub,
        parseInt(limit),
      );

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/notifications/suppress
 * Suppress notifications for a time period (quiet hours)
 */
router.post(
  "/suppress",
  authenticate,
  [
    body("startTime").isISO8601().withMessage("Invalid start time"),
    body("endTime").isISO8601().withMessage("Invalid end time"),
    body("types").optional().isArray(),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { startTime, endTime, types = [] } = req.body;

      const result = await pushNotificationService.setSuppression(
        req.user.sub,
        new Date(startTime),
        new Date(endTime),
        types,
      );

      res.status(200).json({
        success: true,
        data: result,
      });

      logger.info("Notifications: Suppression set", {
        userId: req.user.sub,
        duration: `${startTime} to ${endTime}`,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/notifications/preferences
 * Get current notification preferences
 */
router.get("/preferences", authenticate, async (req, res, next) => {
  try {
    const preferences = {
      userId: req.user.sub,
      notificationTopics: [
        {
          topic: "loads_available",
          enabled: true,
          types: ["new_load", "high_pay_load", "favorite_lane"],
        },
        {
          topic: "price_alerts",
          enabled: true,
          types: ["surge_pricing", "rate_opportunity"],
        },
        {
          topic: "promotions",
          enabled: true,
          types: ["bonus_opportunity", "referral", "seasonal"],
        },
        {
          topic: "maintenance",
          enabled: true,
          types: ["maintenance_due", "inspection_expired", "license_expiring"],
        },
        {
          topic: "compliance",
          enabled: true,
          types: ["hOS_warning", "safety_alert", "documentation_needed"],
        },
        {
          topic: "earnings",
          enabled: false,
          types: ["daily_summary", "weekly_summary"],
        },
      ],
      quietHours: {
        enabled: true,
        startTime: "22:00",
        endTime: "06:00",
        exceptionTypes: ["urgent_alert"],
      },
      devices: [
        {
          platform: "android",
          appVersion: "2.1.0",
          registeredAt: "2026-02-14T10:30:00Z",
          lastSeen: "2026-02-15T14:22:00Z",
        },
      ],
    };

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
router.put(
  "/preferences",
  authenticate,
  [body("notificationTopics").optional().isArray().withMessage("Topics must be array")],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { notificationTopics, quietHours } = req.body;

      // In production, would update database
      const updated = {
        success: true,
        message: "Preferences updated",
        notificationTopics,
        quietHours,
        updatedAt: new Date(),
      };

      res.status(200).json({
        success: true,
        data: updated,
      });

      logger.info("Notifications: Preferences updated", { userId: req.user.sub });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/notifications/send-batch
 * Send notification to multiple users (admin/marketing)
 */
router.post(
  "/send-batch",
  authenticate,
  requireScope("admin|marketing"),
  [
    body("userIds").isArray().withMessage("Must provide array of user IDs"),
    body("templateType").isString().withMessage("Template type required"),
    body("data").optional().isObject(),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { userIds, templateType, data = {}, priority = "normal" } = req.body;

      const notification = {
        type: "batch",
        templateType,
        data,
      };

      const result = await pushNotificationService.sendBatchNotification(
        userIds,
        notification,
        priority,
      );

      res.status(202).json({
        success: true,
        data: result,
      });

      logger.info("Notifications: Batch sent", {
        batchId: result.batchId,
        users: userIds.length,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/notifications/templates
 * Get available notification templates
 */
router.get("/templates", authenticate, async (req, res, next) => {
  try {
    const templates = Object.entries(pushNotificationService.templates).map(([key, template]) => ({
      id: key,
      title: template.title,
      body: template.body,
      icon: template.icon,
      priority: template.priority,
      variables: this.extractVariables(template.title, template.body),
    }));

    res.status(200).json({
      success: true,
      data: {
        templates,
        count: templates.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/track-delivery
 * Track notification delivery status (webhook from FCM)
 */
router.post(
  "/track-delivery",
  [
    body("notificationId").isString().withMessage("Notification ID required"),
    body("userId").isUUID().withMessage("Invalid user ID"),
    body("status").isIn(["delivered", "read", "error", "not_sent"]).withMessage("Invalid status"),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { notificationId, userId, status } = req.body;

      await pushNotificationService.trackDelivery(notificationId, userId, status);

      res.status(200).json({
        success: true,
        data: { notificationId, status },
      });

      logger.debug("Notifications: Delivery tracked", { notificationId, status });
    } catch (err) {
      next(err);
    }
  },
);

// Helper to extract template variables
function extractVariables(title, body) {
  const regex = /\{(\w+)\}/g;
  const vars = new Set();

  let match;
  while ((match = regex.exec(title + " " + body)) !== null) {
    vars.add(match[1]);
  }

  return Array.from(vars);
}

module.exports = router;
