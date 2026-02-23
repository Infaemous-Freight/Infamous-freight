/**
 * Comprehensive Audit Logging Service
 * Tracks all user actions and system events for compliance and debugging
 * Hooks into middleware and routes to record all important operations
 */

const { logger } = require("../middleware/logger");
const { queueAuditLog } = require("./queue");
const prisma = require("../lib/prisma");

/**
 * Audit event types
 */
const AuditEvents = {
  // User actions
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",
  USER_CREATED: "user.created",
  USER_DELETED: "user.deleted",
  USER_ROLE_CHANGED: "user.role_changed",
  USER_PASSWORD_CHANGED: "user.password_changed",
  USER_2FA_ENABLED: "user.2fa_enabled",
  USER_2FA_DISABLED: "user.2fa_disabled",

  // API Key operations
  API_KEY_CREATED: "api_key.created",
  API_KEY_REVOKED: "api_key.revoked",
  API_KEY_ROTATED: "api_key.rotated",

  // Data operations
  DATA_CREATED: "data.created",
  DATA_UPDATED: "data.updated",
  DATA_DELETED: "data.deleted",
  DATA_EXPORTED: "data.exported",

  // Shipment operations
  SHIPMENT_CREATED: "shipment.created",
  SHIPMENT_UPDATED: "shipment.updated",
  SHIPMENT_CANCELLED: "shipment.cancelled",
  SHIPMENT_COMPLETED: "shipment.completed",

  // Billing operations
  PAYMENT_CREATED: "payment.created",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",

  // Admin actions
  ADMIN_SETTING_CHANGED: "admin.setting_changed",
  ADMIN_USER_SUSPENDED: "admin.user_suspended",
  ADMIN_AUDIT_LOG_ACCESSED: "admin.audit_log_accessed",

  // Security events
  FAILED_LOGIN_ATTEMPT: "security.failed_login",
  RATE_LIMIT_EXCEEDED: "security.rate_limit_exceeded",
  UNAUTHORIZED_ACCESS_ATTEMPT: "security.unauthorized_access",
  INVALID_TOKEN: "security.invalid_token",

  // System events
  SYSTEM_ERROR: "system.error",
  DATABASE_ERROR: "system.database_error",
  EXTERNAL_SERVICE_ERROR: "system.external_service_error",
  DEPLOYMENT: "system.deployment",
};

/**
 * Log an audit event
 */
async function logAuditEvent(event, userId, resource, action, changes = {}, metadata = {}) {
  try {
    const auditRecord = {
      event,
      userId,
      resource,
      action,
      changes,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    };

    // Log locally for immediate visibility
    logger.info("Audit event", auditRecord);

    // Queue for persistent storage (async)
    await queueAuditLog(userId, action, resource, changes, metadata);

    return auditRecord;
  } catch (error) {
    logger.error("Failed to log audit event", {
      event,
      userId,
      error: error.message,
    });
  }
}

/**
 * Audit middleware - logs all requests
 */
function auditMiddleware(req, res, next) {
  // Capture response
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    // Check if this is a data-modifying operation (POST, PUT, DELETE)
    if (["POST", "PUT", "DELETE"].includes(req.method)) {
      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        method: req.method,
        path: req.path,
        queryParams: req.query,
      };

      const userId = req.user?.sub || "anonymous";
      const resourceType = req.path.split("/")[2] || "unknown";

      // Determine action type
      let action = "unknown";
      if (req.method === "POST") action = "create";
      if (req.method === "PUT") action = "update";
      if (req.method === "DELETE") action = "delete";

      // Log the event
      logAuditEvent(
        `${resourceType}.${action}`,
        userId,
        resourceType,
        action,
        {
          body: req.body,
          response: data,
        },
        metadata,
      ).catch((err) => logger.error("Error logging audit event", err));
    }

    return originalJson(data);
  };

  next();
}

/**
 * Log user login
 */
async function logUserLogin(userId, ipAddress, userAgent) {
  return logAuditEvent(
    AuditEvents.USER_LOGIN,
    userId,
    "user",
    "login",
    { success: true },
    { ipAddress, userAgent },
  );
}

/**
 * Log failed login attempt
 */
async function logFailedLogin(email, reason, ipAddress, userAgent) {
  return logAuditEvent(
    AuditEvents.FAILED_LOGIN_ATTEMPT,
    "anonymous",
    "user",
    "failed_login",
    { email, reason },
    { ipAddress, userAgent },
  );
}

/**
 * Log data export
 */
async function logDataExport(userId, resource, count, ipAddress) {
  return logAuditEvent(
    AuditEvents.DATA_EXPORTED,
    userId,
    resource,
    "export",
    { count },
    { ipAddress },
  );
}

/**
 * Log rate limit exceeded
 */
async function logRateLimitExceeded(userId, endpoint, ipAddress) {
  return logAuditEvent(
    AuditEvents.RATE_LIMIT_EXCEEDED,
    userId || "anonymous",
    "api",
    "rate_limit_exceeded",
    { endpoint },
    { ipAddress },
  );
}

/**
 * Log unauthorized access attempt
 */
async function logUnauthorizedAccess(userId, resource, action, ipAddress) {
  return logAuditEvent(
    AuditEvents.UNAUTHORIZED_ACCESS_ATTEMPT,
    userId,
    resource,
    action,
    { denied: true },
    { ipAddress },
  );
}

/**
 * Log API key event
 */
async function logApiKeyEvent(event, userId, keyId, changes = {}) {
  return logAuditEvent(event, userId, "api_key", event.split(".")[1], { keyId, ...changes });
}

/**
 * Log user role change
 */
async function logUserRoleChange(userId, targetUserId, oldRole, newRole, adminId) {
  return logAuditEvent(AuditEvents.USER_ROLE_CHANGED, adminId, "user", "role_changed", {
    targetUserId,
    oldRole,
    newRole,
  });
}

/**
 * Log shipment event
 */
async function logShipmentEvent(event, userId, shipmentId, changes = {}) {
  return logAuditEvent(event, userId, "shipment", event.split(".")[1], { shipmentId, ...changes });
}

/**
 * Log payment event
 */
async function logPaymentEvent(event, userId, paymentId, changes = {}) {
  return logAuditEvent(event, userId, "payment", event.split(".")[1], { paymentId, ...changes });
}

/**
 * Log admin setting change
 */
async function logAdminSettingChange(adminUserId, setting, oldValue, newValue) {
  return logAuditEvent(AuditEvents.ADMIN_SETTING_CHANGED, adminUserId, "admin", "setting_changed", {
    setting,
    oldValue,
    newValue,
  });
}

/**
 * Log system error
 */
async function logSystemError(error, context = {}) {
  return logAuditEvent(AuditEvents.SYSTEM_ERROR, "system", "system", "error", {
    error: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Generate audit report for date range
 * Useful for compliance audits
 */
async function generateAuditReport(startDate, endDate, filters = {}) {
  try {
    const where = {
      timestamp: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      ...filters,
    };

    const report = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
    });

    logger.info("Generated audit report", {
      startDate,
      endDate,
      count: report.length,
    });

    return {
      startDate,
      endDate,
      events: report,
      summary: {
        totalEvents: report.length,
        eventsByAction: report.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {}),
        eventsByResource: report.reduce((acc, log) => {
          if (log.resource) acc[log.resource] = (acc[log.resource] || 0) + 1;
          return acc;
        }, {}),
      },
    };
  } catch (error) {
    logger.error("Failed to generate audit report", { error: error.message });
    throw error;
  }
}

/**
 * Export audit logs to CSV/JSON
 * GDPR-compliant data export
 */
async function exportAuditLogs(userId, format = "json", startDate, endDate) {
  try {
    const where = { userId };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
    });

    // Log the export action
    await logDataExport(userId, "audit_logs", logs.length, "local");

    logger.info("Audit logs exported", {
      userId,
      format,
      count: logs.length,
    });

    return {
      format,
      data: logs,
    };
  } catch (error) {
    logger.error("Failed to export audit logs", { error: error.message });
    throw error;
  }
}

/**
 * Get audit stats for dashboard
 */
async function getAuditStats(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.auditLog.findMany({
      where: { timestamp: { gte: startDate } },
      select: { action: true, resource: true, userId: true },
    });

    const eventsByType = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    const userCounts = logs.reduce((acc, log) => {
      acc[log.userId] = (acc[log.userId] || 0) + 1;
      return acc;
    }, {});

    const resourceCounts = logs.reduce((acc, log) => {
      if (log.resource) acc[log.resource] = (acc[log.resource] || 0) + 1;
      return acc;
    }, {});

    const securityActions = ["failed_login", "rate_limit_exceeded", "unauthorized_access", "invalid_token"];
    const securityEvents = logs.filter((log) => securityActions.includes(log.action)).length;

    const stats = {
      period: `Last ${days} days`,
      totalEvents: logs.length,
      eventsByType,
      topUsers: Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, count })),
      topResources: Object.entries(resourceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([resource, count]) => ({ resource, count })),
      securityEvents,
    };

    return stats;
  } catch (error) {
    logger.error("Failed to get audit stats", { error: error.message });
    return null;
  }
}

/**
 * Clean up old audit logs
 * Periodic maintenance task
 */
async function cleanupOldAuditLogs(daysToKeep = 365) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    logger.info("Cleaned up audit logs", {
      daysToKeep,
      cutoffDate,
      deleted: result.count,
    });

    return { success: true, deleted: result.count };
  } catch (error) {
    logger.error("Failed to cleanup audit logs", { error: error.message });
    throw error;
  }
}

module.exports = {
  // Constants
  AuditEvents,

  // Functions
  logAuditEvent,
  auditMiddleware,
  logUserLogin,
  logFailedLogin,
  logDataExport,
  logRateLimitExceeded,
  logUnauthorizedAccess,
  logApiKeyEvent,
  logUserRoleChange,
  logShipmentEvent,
  logPaymentEvent,
  logAdminSettingChange,
  logSystemError,
  generateAuditReport,
  exportAuditLogs,
  getAuditStats,
  cleanupOldAuditLogs,
};
