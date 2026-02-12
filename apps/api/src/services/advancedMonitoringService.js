/**
 * Advanced Monitoring Service (TIER 1)
 * Handles Sentry, Datadog RUM, and structured logging
 */

const Sentry = require("@sentry/node");
const winston = require("winston");
const dayjs = require("dayjs");

class AdvancedMonitoringService {
    constructor() {
        this.logger = this.setupLogger();
        this.initializeSentry();
    }

    /**
     * Setup structured logging with Winston
     */
    setupLogger() {
        return winston.createLogger({
            level: process.env.LOG_LEVEL || "info",
            format: winston.format.combine(
                winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: "infamous-freight-api" },
            transports: [
                // Console output
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(({ timestamp, level, message, ...args }) => {
                            return `${timestamp} [${level}] ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ""
                                }`;
                        })
                    ),
                }),
                // Error log file
                new winston.transports.File({
                    filename: "logs/error.log",
                    level: "error",
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                // Combined log file
                new winston.transports.File({
                    filename: "logs/combined.log",
                    maxsize: 5242880,
                    maxFiles: 5,
                }),
            ],
        });
    }

    /**
     * Initialize Sentry with enhanced configuration
     */
    initializeSentry() {
        if (!process.env.SENTRY_DSN) {
            this.logger.warn("Sentry DSN not configured");
            return;
        }

        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || "development",
            tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
            integrations: [
                new Sentry.Integrations.Http({ tracing: true }),
                new Sentry.Integrations.OnUncaughtException(),
                new Sentry.Integrations.OnUnhandledRejection(),
                new Sentry.Integrations.RequestData({
                    include: {
                        cookies: false,
                        headers: true,
                        query_string: true,
                        url: true,
                    },
                }),
            ],
            attachStacktrace: true,
            beforeSend(event) {
                // Filter PII from errors
                if (event.request) {
                    delete event.request.cookies;
                    if (event.request.headers) {
                        delete event.request.headers.authorization;
                        delete event.request.headers.cookie;
                    }
                }

                // Redact sensitive data
                if (event.exception) {
                    event.exception.values?.forEach((exception) => {
                        this.redactSensitiveData(exception.value);
                    });
                }

                return event;
            },
        });
    }

    /**
     * Log with user context to Sentry
     */
    captureException(error, context = {}) {
        this.logger.error("Exception captured", {
            error: error.message,
            stack: error.stack,
            ...context,
        });

        if (context.user) {
            Sentry.setUser({
                id: context.user.id,
                email: context.user.email,
                role: context.user.role,
            });
        }

        if (context.metadata) {
            Sentry.setContext("request", context.metadata);
        }

        Sentry.captureException(error);
    }

    /**
     * Log business events
     */
    logBusinessEvent(eventName, data = {}) {
        const metrics = {
            timestamp: dayjs().toISOString(),
            event: eventName,
            ...data,
        };

        this.logger.info(`Business Event: ${eventName}`, metrics);

        // Send to analytics if configured
        if (process.env.ANALYTICS_ENABLED === "true") {
            this.sendToAnalytics(eventName, metrics);
        }
    }

    /**
     * Log performance metrics
     */
    logPerformanceMetric(metricName, duration, metadata = {}) {
        const metric = {
            timestamp: dayjs().toISOString(),
            metric: metricName,
            duration_ms: duration,
            threshold_exceeded: duration > 1000,
            ...metadata,
        };

        if (duration > 1000) {
            this.logger.warn(`Slow operation: ${metricName}`, metric);
        } else {
            this.logger.debug(`Performance metric: ${metricName}`, metric);
        }
    }

    /**
     * Redact sensitive data from logs
     */
    redactSensitiveData(obj) {
        const sensitiveFields = ["password", "token", "secret", "key", "ssn", "card"];

        if (typeof obj === "object") {
            Object.keys(obj).forEach((key) => {
                if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
                    obj[key] = "[REDACTED]";
                } else if (typeof obj[key] === "object") {
                    this.redactSensitiveData(obj[key]);
                }
            });
        }
    }

    /**
     * Health check with database verification
     */
    async getHealthStatus(db) {
        const health = {
            status: "healthy",
            timestamp: dayjs().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
            database: "unknown",
            memory: process.memoryUsage(),
        };

        try {
            // Test database connection
            await db.$queryRaw`SELECT 1`;
            health.database = "connected";
        } catch (err) {
            health.status = "degraded";
            health.database = "disconnected";
            this.logger.error("Health check failed: database unavailable", {
                error: err.message,
            });
        }

        return health;
    }

    /**
     * Start RUM (Real User Monitoring) for client-side
     * Returns configuration for frontend
     */
    getRUMConfiguration() {
        return {
            ddAppId: process.env.NEXT_PUBLIC_DD_APP_ID,
            ddClientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN,
            ddSite: process.env.NEXT_PUBLIC_DD_SITE || "datadoghq.com",
            enabled: process.env.NEXT_PUBLIC_ENV === "production",
            sessionSampleRate: 0.1,
            sessionReplaySampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1,
        };
    }

    /**
     * Send metrics to analytics (Datadog, etc)
     */
    sendToAnalytics(eventName, data) {
        // Implement analytics API call
        // This would connect to Datadog, Mixpanel, or similar
        this.logger.debug(`Analytics: ${eventName}`, data);
    }
}

module.exports = new AdvancedMonitoringService();
