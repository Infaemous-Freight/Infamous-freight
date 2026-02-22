/**
 * Request Logging Service
 * Comprehensive logging for API requests, responses, and performance
 *
 * @module services/requestLogger
 */

const { logger } = require("../middleware/logger");

/**
 * Request Context Object
 * Captures all relevant information about a request
 */
class RequestContext {
    constructor(req, res) {
        this.startTime = Date.now();
        this.req = req;
        this.res = res;

        // Request info
        this.requestId = req.correlationId || req.id;
        this.method = req.method;
        this.path = req.path;
        this.url = req.originalUrl;
        this.userAgent = req.get("user-agent");
        this.ip = req.ip || req.connection.remoteAddress;
        this.userId = req.user?.sub;
        this.organization = req.auth?.organizationId;

        // Request headers (sanitized)
        this.headers = this.sanitizeHeaders(req.headers);

        // Request body (sanitized)
        this.body = this.sanitizeBody(req.body);

        // State
        this.statusCode = null;
        this.responseSize = 0;
        this.error = null;
        this.duration = 0;
    }

    /**
     * Remove sensitive headers from logging
     */
    sanitizeHeaders(headers) {
        const sensitiveHeaders = [
            "authorization",
            "cookie",
            "x-api-key",
            "x-auth-token",
            "password",
        ];
        const sanitized = { ...headers };

        sensitiveHeaders.forEach((header) => {
            if (sanitized[header]) {
                sanitized[header] = "[REDACTED]";
            }
        });

        return sanitized;
    }

    /**
     * Remove sensitive fields from body
     */
    sanitizeBody(body) {
        if (!body || typeof body !== "object") {
            return body;
        }

        const sanitized = JSON.parse(JSON.stringify(body));
        const sensitiveFields = [
            "password",
            "passwordHash",
            "token",
            "secret",
            "apiKey",
            "ssn",
            "creditCard",
            "cardNumber",
            "cvv",
        ];

        const redactFields = (obj) => {
            Object.keys(obj).forEach((key) => {
                const lowerKey = key.toLowerCase();

                // Check if field name contains sensitive keywords
                if (sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()))) {
                    obj[key] = "[REDACTED]";
                } else if (typeof obj[key] === "object" && obj[key] !== null) {
                    redactFields(obj[key]);
                }
            });
        };

        redactFields(sanitized);
        return sanitized;
    }

    /**
     * Complete the request context with response info
     */
    complete(statusCode, responseSize) {
        this.statusCode = statusCode;
        this.responseSize = responseSize;
        this.duration = Date.now() - this.startTime;
        return this;
    }

    /**
     * Check if request was successful
     */
    isSuccess() {
        return this.statusCode >= 200 && this.statusCode < 300;
    }

    /**
     * Check if request was client error
     */
    isClientError() {
        return this.statusCode >= 400 && this.statusCode < 500;
    }

    /**
     * Check if request was server error
     */
    isServerError() {
        return this.statusCode >= 500;
    }

    /**
     * Log level based on status code
     */
    getLogLevel() {
        if (this.isSuccess()) return "info";
        if (this.isClientError()) return "warn";
        if (this.isServerError()) return "error";
        return "debug";
    }

    /**
     * Convert to loggable object
     */
    toObject() {
        return {
            requestId: this.requestId,
            method: this.method,
            path: this.path,
            statusCode: this.statusCode,
            duration: this.duration,
            responseSize: this.responseSize,
            userId: this.userId,
            organization: this.organization,
            ip: this.ip,
            userAgent: this.userAgent,
            ...(this.isSuccess()
                ? {}
                : {
                    error: this.error?.message,
                    errorCode: this.error?.code,
                }),
        };
    }
}

/**
 * Log incoming request
 */
function logRequestStart(req) {
    const context = new RequestContext(req, null);

    logger.debug("Request started", {
        requestId: context.requestId,
        method: context.method,
        path: context.path,
        ip: context.ip,
        userId: context.userId,
    });

    return context;
}

/**
 * Log completed request with response
 */
function logRequestComplete(context, statusCode, responseSize = 0) {
    if (!context) return;

    context.complete(statusCode, responseSize);

    const logData = context.toObject();

    // Determine log level
    const level = context.getLogLevel();

    // Log based on outcome
    if (context.isSuccess()) {
        logger.info("Request completed successfully", logData);
    } else if (context.isClientError()) {
        logger.warn("Request failed (client error)", logData);
    } else if (context.isServerError()) {
        logger.error("Request failed (server error)", logData);
    }

    // Alert on slow requests
    if (context.duration > 3000) {
        logger.warn("Slow request detected", {
            ...logData,
            slowThreshold: 3000,
            excess: context.duration - 3000,
        });
    }

    return context;
}

/**
 * Log request error
 */
function logRequestError(context, error) {
    if (!context) return;

    context.error = error;

    logger.error("Request error", {
        requestId: context.requestId,
        method: context.method,
        path: context.path,
        error: error.message,
        stack: error.stack,
        userId: context.userId,
    });
}

/**
 * Express middleware to capture request context
 */
function requestLoggingMiddleware(req, res, next) {
    // Create request context
    const context = logRequestStart(req);

    // Attach to request for use in handlers
    req.context = context;

    // Capture response
    const originalJson = res.json.bind(res);
    res.json = function (data) {
        logRequestComplete(context, res.statusCode, JSON.stringify(data).length);
        return originalJson(data);
    };

    // Capture errors
    const originalSend = res.send.bind(res);
    res.send = function (data) {
        logRequestComplete(context, res.statusCode, data?.length || 0);
        return originalSend(data);
    };

    next();
}

/**
 * Log database query performance
 */
function logQueryPerformance(query, duration, params = null) {
    if (duration > 1000) {
        logger.warn("Slow database query", {
            duration,
            query: query.substring(0, 200),
            paramCount: params?.length,
        });
    } else if (duration > 100) {
        logger.debug("Database query executed", {
            duration,
            paramCount: params?.length,
        });
    }
}

/**
 * Log external API request
 */
function logExternalApiCall(service, method, url, statusCode, duration, error = null) {
    const data = {
        service,
        method,
        url: url.substring(0, 200),
        statusCode,
        duration,
    };

    if (error) {
        logger.warn("External API error", { ...data, error: error.message });
    } else if (statusCode >= 400) {
        logger.warn("External API non-2xx response", data);
    } else if (duration > 3000) {
        logger.warn("Slow external API call", data);
    } else {
        logger.debug("External API call completed", data);
    }
}

/**
 * Log cache operation
 */
function logCacheOperation(operation, key, hit = null, duration = null) {
    const data = {
        operation: operation.toUpperCase(),
        key: key.substring(0, 50),
    };

    if (hit !== null) {
        data.hit = hit;
    }

    if (duration !== null && duration > 50) {
        logger.warn("Slow cache operation", { ...data, duration });
    } else {
        logger.debug("Cache operation", data);
    }
}

/**
 * Log business event (shipment created, payment processed, etc.)
 */
function logBusinessEvent(eventType, data, severity = "info") {
    logger.log(severity, `Business event: ${eventType}`, {
        event: eventType,
        ...data,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Create structured log for audit trail
 */
function logAuditEvent(action, resource, userId, details = {}) {
    logger.info("Audit event", {
        action,
        resource,
        userId,
        ...details,
        timestamp: new Date().toISOString(),
        severity: "audit",
    });
}

module.exports = {
    RequestContext,
    logRequestStart,
    logRequestComplete,
    logRequestError,
    requestLoggingMiddleware,
    logQueryPerformance,
    logExternalApiCall,
    logCacheOperation,
    logBusinessEvent,
    logAuditEvent,
};
