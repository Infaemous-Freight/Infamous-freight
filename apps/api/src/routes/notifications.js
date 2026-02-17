/**
 * Firebase Push Notifications Routes
 * Handles registration, sending, and management of push notifications via Firebase Cloud Messaging
 * 
 * @module routes/notifications
 */

const express = require("express");
const router = express.Router();
const firebaseAdmin = require("../services/firebaseAdmin");
const { authenticate, requireScope, auditLog, limiters } = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const { body, param } = require("express-validator");
const { ApiResponse, HTTP_STATUS } = require("@infamous-freight/shared");
const logger = require("../middleware/logger");

/**
 * POST /api/notifications/register-token
 * Register a device token for push notifications
 * Scope: notifications:register
 */
router.post(
    "/register-token",
    limiters.general,
    authenticate,
    requireScope("notifications:register"),
    auditLog,
    [
        body("token").isString().notEmpty().withMessage("Token is required"),
        body("platform")
            .isIn(["ios", "android", "web"])
            .withMessage("Platform must be ios, android, or web"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { token, platform } = req.body;
            const userId = req.user.sub;

            // Store token in Firestore
            await firebaseAdmin.storePushToken(userId, token, platform);

            logger.info("Push token registered", {
                userId,
                platform,
                tokenPrefix: token.substring(0, 20),
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    message: "Push token registered successfully",
                }),
            );
        } catch (error) {
            logger.error("Failed to register push token", {
                error: error.message,
                userId: req.user?.sub,
            });
            next(error);
        }
    },
);

/**
 * DELETE /api/notifications/token/:token
 * Delete a device token
 * Scope: notifications:register
 */
router.delete(
    "/token/:token",
    limiters.general,
    authenticate,
    requireScope("notifications:register"),
    auditLog,
    [param("token").isString().notEmpty().withMessage("Token is required"), handleValidationErrors],
    async (req, res, next) => {
        try {
            const { token } = req.params;

            await firebaseAdmin.deletePushToken(token);

            logger.info("Push token deleted", {
                userId: req.user.sub,
                tokenPrefix: token.substring(0, 20),
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    message: "Push token deleted successfully",
                }),
            );
        } catch (error) {
            logger.error("Failed to delete push token", {
                error: error.message,
                userId: req.user?.sub,
            });
            next(error);
        }
    },
);

/**
 * POST /api/notifications/send
 * Send push notification to specific users
 * Scope: notifications:send
 */
router.post(
    "/send",
    limiters.general,
    authenticate,
    requireScope("notifications:send"),
    auditLog,
    [
        body("userIds").isArray().notEmpty().withMessage("User IDs array is required"),
        body("title").isString().notEmpty().withMessage("Title is required"),
        body("body").isString().notEmpty().withMessage("Body is required"),
        body("data").optional().isObject().withMessage("Data must be an object"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { userIds, title, body, data } = req.body;

            // Get all tokens for the specified users
            const allTokens = [];
            for (const userId of userIds) {
                const tokens = await firebaseAdmin.getUserPushTokens(userId);
                allTokens.push(...tokens);
            }

            if (allTokens.length === 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(
                    new ApiResponse({
                        success: false,
                        error: "No valid push tokens found for specified users",
                    }),
                );
            }

            // Send multicast notification
            const response = await firebaseAdmin.sendMulticastNotification(
                allTokens,
                { title, body },
                data,
            );

            // Store notifications in Firestore
            for (const userId of userIds) {
                await firebaseAdmin.storeNotification(userId, { title, body, data });
            }

            logger.info("Notifications sent", {
                userCount: userIds.length,
                tokenCount: allTokens.length,
                successCount: response.successCount,
                failureCount: response.failureCount,
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    message: "Notifications sent successfully",
                    data: {
                        totalUsers: userIds.length,
                        totalTokens: allTokens.length,
                        successCount: response.successCount,
                        failureCount: response.failureCount,
                    },
                }),
            );
        } catch (error) {
            logger.error("Failed to send notifications", {
                error: error.message,
                userId: req.user?.sub,
            });
            next(error);
        }
    },
);

/**
 * POST /api/notifications/send-to-topic
 * Send push notification to a topic
 * Scope: notifications:send
 */
router.post(
    "/send-to-topic",
    limiters.general,
    authenticate,
    requireScope("notifications:send"),
    auditLog,
    [
        body("topic").isString().notEmpty().withMessage("Topic is required"),
        body("title").isString().notEmpty().withMessage("Title is required"),
        body("body").isString().notEmpty().withMessage("Body is required"),
        body("data").optional().isObject().withMessage("Data must be an object"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { topic, title, body, data } = req.body;

            const messageId = await firebaseAdmin.sendToTopic(topic, { title, body }, data);

            logger.info("Topic notification sent", {
                topic,
                messageId,
                sentBy: req.user.sub,
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    message: "Topic notification sent successfully",
                    data: { messageId },
                }),
            );
        } catch (error) {
            logger.error("Failed to send topic notification", {
                error: error.message,
                userId: req.user?.sub,
            });
            next(error);
        }
    },
);

/**
 * POST /api/notifications/subscribe-topic
 * Subscribe tokens to a topic
 * Scope: notifications:register
 */
router.post(
    "/subscribe-topic",
    limiters.general,
    authenticate,
    requireScope("notifications:register"),
    auditLog,
    [
        body("tokens").isArray().notEmpty().withMessage("Tokens array is required"),
        body("topic").isString().notEmpty().withMessage("Topic is required"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { tokens, topic } = req.body;

            const response = await firebaseAdmin.subscribeToTopic(tokens, topic);

            logger.info("Tokens subscribed to topic", {
                topic,
                tokenCount: tokens.length,
                successCount: response.successCount,
                failureCount: response.failureCount,
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    message: "Subscribed to topic successfully",
                    data: {
                        successCount: response.successCount,
                        failureCount: response.failureCount,
                    },
                }),
            );
        } catch (error) {
            logger.error("Failed to subscribe to topic", {
                error: error.message,
                userId: req.user?.sub,
            });
            next(error);
        }
    },
);

/**
 * POST /api/notifications/unsubscribe-topic
 * Unsubscribe tokens from a topic
 * Scope: notifications:register
 */
router.post(
    "/unsubscribe-topic",
    limiters.general,
    authenticate,
    requireScope("notifications:register"),
    auditLog,
    [
        body("tokens").isArray().notEmpty().withMessage("Tokens array is required"),
        body("topic").isString().notEmpty().withMessage("Topic is required"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { tokens, topic } = req.body;

            const response = await firebaseAdmin.unsubscribeFromTopic(tokens, topic);

            logger.info("Tokens unsubscribed from topic", {
                topic,
                tokenCount: tokens.length,
                successCount: response.successCount,
                failureCount: response.failureCount,
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    message: "Unsubscribed from topic successfully",
                    data: {
                        successCount: response.successCount,
                        failureCount: response.failureCount,
                    },
                }),
            );
        } catch (error) {
            logger.error("Failed to unsubscribe from topic", {
                error: error.message,
                userId: req.user?.sub,
            });
            next(error);
        }
    },
);

/**
 * GET /api/notifications
 * Get user's notifications
 * Scope: notifications:read
 */
router.get(
    "/",
    limiters.general,
    authenticate,
    requireScope("notifications:read"),
    auditLog,
    async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const limit = parseInt(req.query.limit) || 50;

            const notifications = await firebaseAdmin.getUnreadNotifications(userId, limit);

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: notifications,
                }),
            );
        } catch (error) {
            logger.error("Failed to get notifications", {
                error: error.message,
                userId: req.user?.sub,
            });
            next(error);
        }
    },
);

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 * Scope: notifications:read
 */
router.patch(
    "/:id/read",
    limiters.general,
    authenticate,
    requireScope("notifications:read"),
    auditLog,
    [param("id").isString().notEmpty().withMessage("Notification ID is required"), handleValidationErrors],
    async (req, res, next) => {
        try {
            const { id } = req.params;

            await firebaseAdmin.markNotificationAsRead(id);

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    message: "Notification marked as read",
                }),
            );
        } catch (error) {
            logger.error("Failed to mark notification as read", {
                error: error.message,
                notificationId: req.params.id,
                userId: req.user?.sub,
            });
            next(error);
        }
    },
);

module.exports = router;
