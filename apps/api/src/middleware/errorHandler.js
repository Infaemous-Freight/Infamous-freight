// Global error handler with enhanced logging and monitoring
const Sentry = require('@sentry/node');
const { logger } = require('./logger');
const { ApiError, createErrorResponse } = require('../lib/errors');
const { HTTP_STATUS } = require('../config/constants');

function errorHandler(err, req, res, next) {
    // Handle ApiError instances with their proper structure
    if (err instanceof ApiError) {
        const errorResponse = err.toJSON();
        
        // Log error with context
        logger.error(
            {
                method: req.method,
                path: req.originalUrl || req.path,
                statusCode: err.statusCode,
                error: err.message,
                stack: err.stack,
                user: req.user?.sub,
                correlationId: req.correlationId,
                hostname: req.hostname,
                ip: req.ip,
                userAgent: req.get('user-agent'),
            },
            'Request failed'
        );

        // Capture in Sentry if configured
        if (Sentry && process.env.SENTRY_DSN && err.statusCode >= 500) {
            Sentry.captureException(err, {
                tags: {
                    path: req.path,
                    method: req.method,
                    status: err.statusCode,
                },
                user: req.user ? { id: req.user.sub, email: req.user.email } : undefined,
            });
        }

        return res.status(err.statusCode).json(errorResponse);
    }

    // Handle legacy errors or unknown errors
    const status = err.status || err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = err.message || 'Internal Server Error';
    const errorId = req.correlationId || `${Date.now()}-${Math.random()}`;

    // Structured error logging with context
    logger.error(
        {
            method: req.method,
            path: req.originalUrl || req.path,
            status,
            error: message,
            stack: err.stack,
            user: req.user?.sub,
            correlationId: errorId,
            hostname: req.hostname,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        },
        'Request failed'
    );

    // Sentry capture with rich context
    if (Sentry && process.env.SENTRY_DSN) {
        Sentry.captureException(err, {
            tags: {
                path: req.path,
                method: req.method,
                status: status,
                errorId: errorId,
            },
            contexts: {
                request: {
                    method: req.method,
                    url: req.originalUrl || req.path,
                    headers: req.headers,
                    body: req.body ? JSON.stringify(req.body) : undefined,
                    ip: req.ip,
                },
                http: {
                    status_code: status,
                },
            },
            user: req.user ? { id: req.user.sub, email: req.user.email } : undefined,
        });
    }

    // Sensitive error message handling
    const clientMessage = status >= 500 ? 'Internal Server Error' : message;
    const responseBody = {
        error: {
            message: clientMessage,
            statusCode: status,
            timestamp: new Date().toISOString(),
            errorId: errorId,
        },
    };

    // Include error details in development
    if (process.env.NODE_ENV === 'development') {
        responseBody.error.details = message;
        responseBody.error.stack = err.stack;
    }

    res.status(status).json(responseBody);
}

module.exports = errorHandler;
