/**
 * Sentry Server Configuration for Express API
 * Enhanced error tracking with performance monitoring and release management
 */

const Sentry = require("@sentry/node");
const { logger } = require("../middleware/logger");

/**
 * Initialize Sentry with production-ready configuration
 */
function initializeSentry() {
    const dsn = process.env.SENTRY_DSN;
    const environment = process.env.NODE_ENV || "development";
    const isDevelopment = environment === "development";

    if (!dsn) {
        logger.warn("Sentry DSN not configured. Error tracking disabled.");
        return false;
    }

    try {
        Sentry.init({
            // Sentry project DSN
            dsn: dsn,

            // Environment context
            environment: environment,
            release: process.env.SENTRY_RELEASE || process.env.npm_package_version || "unknown",

            // Performance monitoring - sample 10% in production, 100% in development
            tracesSampleRate: isDevelopment
                ? 1.0
                : Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),

            // Profiling - sample 10% in production, 100% in development
            profilesSampleRate: isDevelopment ? 1.0 : 0.1,

            // Source map configuration
            attachStacktrace: true,
            maxBreadcrumbs: isDevelopment ? 100 : 50,
            includeLocalVariables: isDevelopment, // Include local variables in dev mode only

            // Integrations for Express
            integrations: [
                new Sentry.Integrations.Http({ tracing: true }),
                new Sentry.Integrations.OnUncaughtException(),
                new Sentry.Integrations.OnUnhandledRejection(),
            ],

            // Default context
            initialScope: {
                tags: {
                    component: "api",
                    deployment: process.env.DEPLOYMENT_ENV || "unknown",
                    apiVersion: process.env.API_VERSION || "1.0.0",
                },
            },

            /**
             * Before sending events, apply filters
             */
            beforeSend(event, hint) {
                // Filter out health check errors
                if (event.request?.url?.includes("/api/health")) {
                    return null;
                }

                // Filter 404 errors from known safe paths
                if (
                    (event.status === 404 || event.fingerprint?.includes("404")) &&
                    !isDevelopment
                ) {
                    const url = event.request?.url || "";
                    const safeNotFound =
                        url.includes("favicon.ico") ||
                        url.includes("robots.txt") ||
                        url.includes(".map");
                    if (safeNotFound) {
                        return null;
                    }
                }

                // Filter harmless errors
                if (event.exception) {
                    const error = hint.originalException;
                    if (error instanceof Error) {
                        // Skip "ENOTFOUND" DNS errors (network issue, not app issue)
                        if (error.message.includes("ENOTFOUND")) {
                            return null;
                        }
                        // Skip connection pool timeout in non-prod environments
                        if (
                            !isDevelopment &&
                            error.message.includes("connection pool timeout")
                        ) {
                            event.level = "warning";
                            return event;
                        }
                    }
                }

                // Reduce verbosity for certain error types in production
                if (!isDevelopment && event.exception) {
                    const error = hint.originalException;
                    if (error instanceof Error) {
                        if (error.message.includes("JWT")) {
                            event.fingerprint = ["{{ default }}", "JWT_ERROR"];
                        }
                    }
                }

                return event;
            },

            /**
             * Ignore errors matching patterns
             */
            denyUrls: [
                // Ignore errors from extensions
                /chrome-extension:\/\//i,
                /moz-extension:\/\//i,
            ],

            ignoreErrors: [
                // Browser extension errors
                "top.GLOBALS",
                "chrome-extension://",
                // Ignore specific low-priority errors
                "CORS Policy",
                "SecurityError",
            ],

            // Capture breadcrumbs for context
            maxBreadcrumbs: isDevelopment ? 100 : 30,
        });

        logger.info(`Sentry initialized - environment: ${environment}, DSN: ${dsn.substring(0, 20)}...`);
        return true;
    } catch (error) {
        logger.error("Failed to initialize Sentry", { error: error.message });
        return false;
    }
}

/**
 * Attach Sentry request handler middleware
 * Must be added FIRST, before other middleware
 */
function attachRequestHandler(app) {
    try {
        app.use(Sentry.Handlers.requestHandler());
        logger.debug("Sentry request handler attached");
    } catch (error) {
        logger.warn("Failed to attach Sentry request handler", {
            error: error.message,
        });
    }
}

/**
 * Attach Sentry error handler middleware
 * Must be added AFTER all other middleware/routes
 */
function attachErrorHandler(app) {
    try {
        app.use(Sentry.Handlers.errorHandler());
        logger.debug("Sentry error handler attached");
    } catch (error) {
        logger.warn("Failed to attach Sentry error handler", {
            error: error.message,
        });
    }
}

/**
 * Capture an exception with custom context
 */
function captureException(error, context = {}) {
    try {
        Sentry.captureException(error, {
            tags: context.tags || {},
            contexts: {
                custom: context.data || {},
            },
            level: context.level || "error",
        });
    } catch (err) {
        logger.error("Failed to capture exception in Sentry", {
            error: err.message,
        });
    }
}

/**
 * Capture a message for monitoring
 */
function captureMessage(message, level = "info") {
    try {
        Sentry.captureMessage(message, level);
    } catch (error) {
        logger.error("Failed to capture message in Sentry", {
            error: error.message,
        });
    }
}

/**
 * Set user context for error tracking
 */
function setUserContext(userId, email = null, additionalData = {}) {
    try {
        Sentry.setUser({
            id: userId,
            email: email || undefined,
            ...additionalData,
        });
    } catch (error) {
        logger.warn("Failed to set Sentry user context", {
            error: error.message,
        });
    }
}

/**
 * Clear user context on logout
 */
function clearUserContext() {
    try {
        Sentry.setUser(null);
    } catch (error) {
        logger.warn("Failed to clear Sentry user context", {
            error: error.message,
        });
    }
}

/**
 * Add custom breadcrumb for debugging
 */
function addBreadcrumb(message, category = "custom", level = "info", data = {}) {
    try {
        Sentry.addBreadcrumb({
            message,
            category,
            level,
            data,
            timestamp: Date.now() / 1000,
        });
    } catch (error) {
        logger.warn("Failed to add Sentry breadcrumb", {
            error: error.message,
        });
    }
}

/**
 * Start a performance transaction
 */
function startTransaction(name, op = "default") {
    try {
        return Sentry.startTransaction({
            name,
            op,
            tracesSampleRate: 1.0,
        });
    } catch (error) {
        logger.warn("Failed to start Sentry transaction", {
            error: error.message,
        });
        return null;
    }
}

/**
 * Get Sentry client for direct access
 */
function getSentryClient() {
    return Sentry;
}

module.exports = {
    initializeSentry,
    attachRequestHandler,
    attachErrorHandler,
    captureException,
    captureMessage,
    setUserContext,
    clearUserContext,
    addBreadcrumb,
    startTransaction,
    getSentryClient,
    Sentry,
};
