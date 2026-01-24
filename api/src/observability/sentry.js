/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Sentry Error Tracking & Performance Monitoring (Phase 18)
 */

const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");
const { logger } = require("../middleware/logger");

/**
 * Initialize Sentry for error tracking and performance monitoring
 * @param {string} serviceName - Name of the service (e.g., "api", "worker")
 */
function initSentry(serviceName) {
    const dsn = process.env.SENTRY_DSN;

    // Skip initialization if DSN not configured (development mode)
    if (!dsn) {
        logger.info('Sentry DSN not configured, skipping Sentry initialization');
        return;
    }

    Sentry.init({
        dsn,
        environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
        release: process.env.RELEASE_SHA,

        // Integrations for Node.js
        integrations: [
            nodeProfilingIntegration(),
            new Sentry.Integrations.Console({
                levels: ["warn", "error"],
            }),
            new Sentry.Integrations.Http({
                tracing: true,
                breadcrumbs: true,
            }),
        ],

        // Sampling rates
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
        profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE || "0.0"),

        // Capture unhandled exceptions and rejections
        attachStacktrace: true,
        maxBreadcrumbs: 100,
    });

    // Set service tag for filtering in Sentry dashboard
    Sentry.setTag("service", serviceName);

    logger.info({ service: serviceName }, 'Sentry initialized');
}

/**
 * Capture exception with context
 * @param {Error} error - The error to capture
 * @param {object} context - Additional context (tags, extra data)
 */
function captureException(error, context = {}) {
    if (process.env.SENTRY_DSN) {
        Sentry.captureException(error, {
            tags: context.tags || {},
            extra: context.extra || {},
            level: context.level || "error",
        });
    }
}

/**
 * Capture message with context
 * @param {string} message - The message to capture
 * @param {string} level - Log level ('info', 'warning', 'error')
 * @param {object} context - Additional context
 */
function captureMessage(message, level = "info", context = {}) {
    if (process.env.SENTRY_DSN) {
        Sentry.captureMessage(message, {
            level,
            tags: context.tags || {},
            extra: context.extra || {},
        });
    }
}

/**
 * Set user context for all subsequent events
 * @param {object} user - User object { id, email, username }
 */
function setUserContext(user) {
    if (user) {
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.username,
        });
    } else {
        Sentry.setUser(null);
    }
}

/**
 * Start a transaction (for performance tracing)
 * @param {string} name - Transaction name
 * @param {string} op - Operation type (e.g., "http.server", "db.query")
 */
function startTransaction(name, op = "operation") {
    if (!process.env.SENTRY_DSN) return null;

    return Sentry.startTransaction({
        name,
        op,
    });
}

module.exports = {
    Sentry,
    initSentry,
    captureException,
    captureMessage,
    setUserContext,
    startTransaction,
};
