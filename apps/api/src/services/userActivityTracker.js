/**
 * Sentry User Activity Tracking
 * 
 * Comprehensive user behavior and activity logging
 * Tracks user actions, navigation, errors, and performance metrics
 * 
 * @version 1.0.0
 * @author User Analytics Team
 */

const Sentry = require("@sentry/node");
const logger = require("../utils/logger");

/**
 * User Activity Tracker
 * Monitors user interactions and behavior across the platform
 */
class UserActivityTracker {
    constructor() {
        this.activities = [];
        this.maxActivities = 500;
        this.enableTracking = process.env.SENTRY_USER_TRACKING !== "false";
        this.userSessions = new Map();
    }

    /**
     * Initialize session for user
     * @param {Object} user - User object
     * @param {string} user.id - User ID
     * @param {string} user.email - User email
     * @param {string} user.role - User role
     */
    initializeSession(user) {
        if (!this.enableTracking || !user) return;

        const sessionId = `${user.id}-${Date.now()}`;
        const session = {
            id: sessionId,
            userId: user.id,
            email: user.email,
            role: user.role,
            startTime: Date.now(),
            activities: [],
            errors: 0,
            pageViews: 0,
            actionCount: 0,
        };

        this.userSessions.set(user.id, session);

        // Set Sentry user context
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.email.split("@")[0],
            role: user.role,
        });

        logger.info(`User session started`, {
            userId: user.id,
            email: user.email,
            role: user.role,
            sessionId,
        });

        return session;
    }

    /**
     * Track user action
     * @param {string} userId - User ID
     * @param {string} actionType - Type of action
     * @param {Object} actionData - Action details
     */
    trackAction(userId, actionType, actionData = {}) {
        if (!this.enableTracking) return;

        const activity = {
            timestamp: Date.now(),
            userId,
            type: actionType,
            data: this.sanitizeActionData(actionData),
            duration: actionData.duration || null,
        };

        this.activities.push(activity);
        if (this.activities.length > this.maxActivities) {
            this.activities.shift();
        }

        // Update session
        const session = this.userSessions.get(userId);
        if (session) {
            session.activities.push(activity);
            session.actionCount++;
        }

        // Track to Sentry breadcrumb
        Sentry.addBreadcrumb({
            category: "user-action",
            message: actionType,
            level: "info",
            data: activity.data,
        });

        // Log specific action types
        if (actionType === "error") {
            session && session.errors++;
            logger.warn(`User error activity: ${actionType}`, activity);
        }
    }

    /**
     * Track page view
     * @param {string} userId - User ID
     * @param {string} page - Page path or name
     * @param {Object} metadata - Additional metadata
     */
    trackPageView(userId, page, metadata = {}) {
        if (!this.enableTracking) return;

        const session = this.userSessions.get(userId);
        if (session) {
            session.pageViews++;
        }

        this.trackAction(userId, "page_view", { page, ...metadata });
    }

    /**
     * Track user error
     * @param {string} userId - User ID
     * @param {Error} error - Error object
     * @param {string} context - Error context
     */
    trackUserError(userId, error, context = "") {
        if (!this.enableTracking) return;

        const session = this.userSessions.get(userId);
        if (session) {
            session.errors++;
        }

        Sentry.captureException(error, {
            tags: {
                userId,
                context,
            },
            user: {
                id: userId,
            },
            contexts: {
                userSession: session ? {
                    sessionId: session.id,
                    startTime: new Date(session.startTime).toISOString(),
                    actionCount: session.actionCount,
                    pageViews: session.pageViews,
                    previousErrors: session.errors - 1,
                } : null,
            },
        });

        logger.error(`User error tracked`, {
            userId,
            error: error.message,
            context,
            stack: error.stack,
        });
    }

    /**
     * Track API call from user
     * @param {string} userId - User ID
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {number} duration - Request duration
     * @param {number} status - HTTP status
     */
    trackAPICall(userId, endpoint, method, duration, status) {
        if (!this.enableTracking) return;

        const isError = status >= 400;

        this.trackAction(userId, "api_call", {
            endpoint,
            method,
            duration,
            status,
            isError,
        });

        if (isError) {
            const session = this.userSessions.get(userId);
            if (session) {
                session.errors++;
            }
        }
    }

    /**
     * Track feature usage
     * @param {string} userId - User ID
     * @param {string} feature - Feature name
     * @param {Object} metadata - Feature metadata
     */
    trackFeatureUsage(userId, feature, metadata = {}) {
        if (!this.enableTracking) return;

        this.trackAction(userId, "feature_usage", {
            feature,
            ...metadata,
        });

        Sentry.addBreadcrumb({
            category: "feature",
            message: `Used feature: ${feature}`,
            level: "info",
            data: metadata,
        });
    }

    /**
     * Track performance metric
     * @param {string} userId - User ID
     * @param {string} metricName - Metric name
     * @param {number} value - Metric value
     * @param {string} unit - Unit of measurement
     */
    trackPerformanceMetric(userId, metricName, value, unit = "ms") {
        if (!this.enableTracking) return;

        this.trackAction(userId, "performance_metric", {
            metric: metricName,
            value,
            unit,
        });

        Sentry.captureMessage(`Performance metric: ${metricName}`, {
            level: "info",
            tags: {
                userId,
                metric: metricName,
            },
            measurements: {
                [metricName]: {
                    value,
                    unit,
                },
            },
        });
    }

    /**
     * Sanitize action data (remove sensitive info)
     * @private
     */
    sanitizeActionData(data) {
        if (!data || typeof data !== "object") return data;

        const sanitized = JSON.parse(JSON.stringify(data));
        const sensitiveFields = ["password", "token", "apiKey", "creditCard", "secret"];

        const sanitizeObj = (obj) => {
            if (!obj || typeof obj !== "object") return;

            Object.keys(obj).forEach((key) => {
                if (sensitiveFields.some((sf) => key.toLowerCase().includes(sf))) {
                    obj[key] = "[REDACTED]";
                } else if (typeof obj[key] === "object") {
                    sanitizeObj(obj[key]);
                } else if (typeof obj[key] === "string" && obj[key].length > 200) {
                    obj[key] = obj[key].substring(0, 200) + "...";
                }
            });
        };

        sanitizeObj(sanitized);
        return sanitized;
    }

    /**
     * End user session
     * @param {string} userId - User ID
     */
    endSession(userId) {
        const session = this.userSessions.get(userId);
        if (!session) return;

        const duration = Date.now() - session.startTime;

        logger.info(`User session ended`, {
            userId,
            sessionId: session.id,
            duration,
            activities: session.actionCount,
            pageViews: session.pageViews,
            errors: session.errors,
        });

        Sentry.captureMessage(`User session ended`, {
            level: "info",
            tags: {
                userId,
                sessionDuration: duration,
            },
            contexts: {
                session: {
                    sessionId: session.id,
                    duration,
                    startTime: new Date(session.startTime).toISOString(),
                    endTime: new Date().toISOString(),
                    activities: session.actionCount,
                    pageViews: session.pageViews,
                    errors: session.errors,
                },
            },
        });

        this.userSessions.delete(userId);
    }

    /**
     * Get user activity summary
     * @param {string} userId - User ID
     * @returns {Object} Activity summary
     */
    getUserActivitySummary(userId) {
        const session = this.userSessions.get(userId);
        if (!session) return null;

        const activities = this.activities.filter((a) => a.userId === userId);

        return {
            session: {
                id: session.id,
                duration: Date.now() - session.startTime,
                startTime: new Date(session.startTime).toISOString(),
            },
            summary: {
                actionCount: session.actionCount,
                pageViews: session.pageViews,
                errors: session.errors,
                activities: activities.slice(-20), // Last 20 activities
            },
        };
    }

    /**
     * Get platform-wide activity statistics
     * @returns {Object} Platform statistics
     */
    getPlatformStatistics() {
        const activeSessions = this.userSessions.size;
        const totalActivities = this.activities.length;

        const activityTypes = {};
        this.activities.forEach((activity) => {
            activityTypes[activity.type] = (activityTypes[activity.type] || 0) + 1;
        });

        return {
            activeSessions,
            totalActivities,
            activityTypes,
            recentActivities: this.activities.slice(-50),
        };
    }
}

// Export singleton instance
const userActivityTracker = new UserActivityTracker();

module.exports = userActivityTracker;
