/**
 * Centralized Winston Logger
 * 
 * Production-ready structured logging that replaces all console.* usage.
 * Integrates with Datadog, Sentry, and other monitoring services.
 */

const winston = require('winston');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(colors);

// Determine log level from environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'info';
};

// Define format for logs
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define transports
const transports = [
    // Console output
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.printf(
                (info) => {
                    const { timestamp, level, message, ...meta } = info;
                    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                    return `${timestamp} [${level}]: ${message} ${metaStr}`;
                }
            )
        ),
    }),
    // Error log file
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
];

// Create the logger
const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
    exitOnError: false,
});

// Add helper methods for common patterns
logger.aiDecision = (decisionId, data) => {
    logger.info('[AI Decision]', { decisionId, type: 'ai-decision', ...data });
};

logger.aiConfidence = (decisionId, confidence) => {
    logger.info('[AI Confidence]', { decisionId, type: 'ai-confidence', ...confidence });
};

logger.aiOverride = (decisionId, override) => {
    logger.warn('[AI Override]', { decisionId, type: 'ai-override', ...override });
};

logger.aiGuardrail = (violation) => {
    logger.warn('[AI Guardrail Violation]', { type: 'guardrail-violation', ...violation });
};

logger.security = (event) => {
    logger.warn('[Security Alert]', { type: 'security', ...event });
};

logger.performance = (metric, value) => {
    logger.debug('[Performance]', { metric, value, type: 'performance' });
};

module.exports = logger;
