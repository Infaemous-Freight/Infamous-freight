/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Winston Structured Logging
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const logLevels = {
    levels: {
        fatal: 0,
        error: 1,
        warn: 2,
        info: 3,
        debug: 4,
        trace: 5,
    },
    colors: {
        fatal: 'red',
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'blue',
        trace: 'gray',
    },
};

// Create Winston logger
const logger = winston.createLogger({
    levels: logLevels.levels,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'marketplace-api' },
    transports: [
        // Error logs
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
        // Combined logs
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 7,
        }),
    ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize({ colors: logLevels.colors }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
        ),
    }));
}

// Create specialized loggers for different components
class StructuredLogger {
    constructor(componentName) {
        this.component = componentName;
    }

    _log(level, message, meta = {}) {
        logger.log(level, message, {
            ...meta,
            component: this.component,
            timestamp: new Date().toISOString(),
        });
    }

    fatal(message, meta) {
        this._log('fatal', message, meta);
    }

    error(message, meta) {
        this._log('error', message, meta);
    }

    warn(message, meta) {
        this._log('warn', message, meta);
    }

    info(message, meta) {
        this._log('info', message, meta);
    }

    debug(message, meta) {
        this._log('debug', message, meta);
    }

    trace(message, meta) {
        this._log('trace', message, meta);
    }
}

// Authentication logger
class AuthLogger extends StructuredLogger {
    constructor() {
        super('auth');
    }

    loginAttempt(userId, success, metadata = {}) {
        this[success ? 'info' : 'warn']('Login attempt', {
            userId,
            success,
            ...metadata,
        });
    }

    tokenGenerated(userId, expiresIn, scopes) {
        this.debug('JWT token generated', {
            userId,
            expiresIn,
            scopes: scopes?.join(','),
        });
    }

    tokenValidation(valid, reason) {
        this[valid ? 'debug' : 'warn']('JWT validation', {
            valid,
            reason,
        });
    }

    scopeCheck(userId, required, granted, allowed) {
        this[allowed ? 'debug' : 'warn']('Scope check', {
            userId,
            required: required?.join(','),
            granted: granted?.join(','),
            allowed,
        });
    }
}

// Webhook logger
class WebhookLogger extends StructuredLogger {
    constructor() {
        super('webhook');
    }

    received(eventId, type, source = 'stripe') {
        this.info('Webhook received', {
            eventId,
            type,
            source,
        });
    }

    processing(eventId, correlationId) {
        this.debug('Processing webhook', {
            eventId,
            correlationId,
        });
    }

    retryAttempt(eventId, attempt, maxRetries, delayMs) {
        this.warn('Webhook retry attempt', {
            eventId,
            attempt,
            maxRetries,
            delayMs,
        });
    }

    success(eventId, processingTimeMs) {
        this.info('Webhook processed successfully', {
            eventId,
            processingTimeMs,
        });
    }

    failed(eventId, error, retryable) {
        this.error('Webhook processing failed', {
            eventId,
            error: error?.message,
            retryable,
            stack: error?.stack,
        });
    }

    duplicate(eventId) {
        this.debug('Duplicate webhook detected', {
            eventId,
        });
    }
}

// API logger
class ApiLogger extends StructuredLogger {
    constructor() {
        super('api');
    }

    request(method, path, statusCode, durationMs, metadata = {}) {
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        this[level](`${method} ${path}`, {
            method,
            path,
            statusCode,
            durationMs,
            ...metadata,
        });
    }

    databaseQuery(query, durationMs, rowsAffected) {
        this[durationMs > 100 ? 'warn' : 'debug']('Database query', {
            query: query?.substring(0, 100),
            durationMs,
            rowsAffected,
        });
    }

    transaction(operation, success, durationMs, metadata = {}) {
        this[success ? 'info' : 'error'](`Transaction ${operation}`, {
            operation,
            success,
            durationMs,
            ...metadata,
        });
    }

    rateLimit(endpoint, userId, limit, remaining) {
        if (remaining < 5) {
            this.warn('Rate limit approaching', {
                endpoint,
                userId,
                limit,
                remaining,
            });
        }
    }
}

// Job logger
class JobLogger extends StructuredLogger {
    constructor() {
        super('job');
    }

    created(jobId, shipperId, priceUsd) {
        this.info('Job created', {
            jobId,
            shipperId,
            priceUsd,
        });
    }

    accepted(jobId, driverId, acceptedAt) {
        this.info('Job accepted', {
            jobId,
            driverId,
            acceptedAt,
        });
    }

    stateTransition(jobId, fromStatus, toStatus) {
        this.debug('Job state transition', {
            jobId,
            fromStatus,
            toStatus,
        });
    }

    priceVerification(jobId, expectedPrice, actualPrice, match) {
        this[match ? 'debug' : 'warn']('Price verification', {
            jobId,
            expectedPrice,
            actualPrice,
            match,
        });
    }

    completed(jobId, driverId, totalPriceUsd, durationMinutes) {
        this.info('Job completed', {
            jobId,
            driverId,
            totalPriceUsd,
            durationMinutes,
        });
    }
}

// Stripe logger
class StripeLogger extends StructuredLogger {
    constructor() {
        super('stripe');
    }

    checkoutCreated(jobId, sessionId, priceUsd) {
        this.info('Stripe checkout session created', {
            jobId,
            sessionId,
            priceUsd,
        });
    }

    subscriptionCreated(userId, planTier, stripeSubId) {
        this.info('Stripe subscription created', {
            userId,
            planTier,
            stripeSubId,
        });
    }

    webhookValidation(valid, reason) {
        this[valid ? 'debug' : 'error']('Webhook signature validation', {
            valid,
            reason,
        });
    }

    apiError(operation, error, retryable) {
        this.error(`Stripe API error: ${operation}`, {
            operation,
            error: error?.message,
            retryable,
        });
    }

    circuitBreakerStatus(operation, status) {
        if (status.state !== 'CLOSED') {
            this.warn(`Circuit breaker status: ${operation}`, status);
        }
    }
}

// Cache logger
class CacheLogger extends StructuredLogger {
    constructor() {
        super('cache');
    }

    hit(key) {
        this.debug('Cache hit', { key });
    }

    miss(key) {
        this.debug('Cache miss', { key });
    }

    set(key, ttl) {
        this.debug('Cache set', { key, ttl });
    }

    invalidate(key) {
        this.debug('Cache invalidation', { key });
    }

    error(operation, error) {
        this.warn(`Cache ${operation} failed`, {
            operation,
            error: error?.message,
        });
    }
}

// Export logger instances
module.exports = {
    logger,
    StructuredLogger,
    AuthLogger: new AuthLogger(),
    WebhookLogger: new WebhookLogger(),
    ApiLogger: new ApiLogger(),
    JobLogger: new JobLogger(),
    StripeLogger: new StripeLogger(),
    CacheLogger: new CacheLogger(),
};
