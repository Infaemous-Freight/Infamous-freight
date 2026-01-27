/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Production Security Headers
 */

const helmet = require('helmet');
const { logger } = require('./logger');

/**
 * Comprehensive security headers configuration
 * OWASP Top 10 compliance
 */
const securityHeaders = helmet({
    // Prevent MIME type sniffing (blocks interpretation as different type)
    noSniff: true,

    // Clickjacking protection - prevent embedding in iframes
    frameguard: {
        action: 'deny',
    },

    // XSS protection header
    xssFilter: true,

    // Content Security Policy (CSP) - prevents inline scripts
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'nonce-{NONCE}'", // For inline scripts (generate per request)
                'https://cdn.jsdelivr.net',
                'https://cdn.stripe.com',
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'", // TailwindCSS requires this
                'https://fonts.googleapis.com',
            ],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: [
                "'self'",
                'https://infamous-freight-api.fly.dev',
                'https://api.stripe.com',
            ],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            mediaSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameSrc: ['https://js.stripe.com'],
        },
    },

    // Enforce HTTPS
    hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
    },

    // Referrer policy - limit referrer info exposure
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    // Permissions policy (formerly Feature Policy)
    permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: ["'self'"],
        payment: ["'self'", 'https://api.stripe.com'],
    },

    // Prevent DNS prefetch attacks
    dnsPrefetchControl: { allow: false },

    // Disable X-Powered-By header
    hidePoweredBy: true,
});

/**
 * CORS configuration - restrict to allowed origins
 */
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',');

        // Allow requests with no origin (same-origin requests)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy: Origin not allowed'));
        }
    },
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count', 'X-New-Token'],
    maxAge: 86400, // 24 hours
};

/**
 * Input sanitization & validation middleware
 */
function sanitizeInputs(req, res, next) {
    if (req.body) {
        sanitizeObject(req.body);
    }
    if (req.query) {
        sanitizeObject(req.query);
    }
    if (req.params) {
        sanitizeObject(req.params);
    }
    next();
}

function sanitizeObject(obj) {
    const dangerousPatterns = [
        /<script[^>]*>.*?<\/script>/gi, // XSS
        /javascript:/gi, // Protocol handlers
        /on\w+\s*=/gi, // Event handlers
        /eval\(/gi, // Eval
    ];

    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            dangerousPatterns.forEach((pattern) => {
                obj[key] = obj[key].replace(pattern, '');
            });
        } else if (typeof obj[key] === 'object') {
            sanitizeObject(obj[key]);
        }
    }
}

/**
 * SQL Injection prevention (via Prisma - no raw queries)
 * Always use Prisma's query builder or parameterized queries
 */

// ❌ NEVER do this:
// const result = await prisma.$queryRaw(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ ALWAYS do this:
// const result = await prisma.user.findUnique({ where: { email } });

/**
 * Rate limiting with exponential backoff
 */
const createRateLimiter = (windowMs, max) => {
    const store = new Map();

    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const record = store.get(key) || { count: 0, resetTime: now + windowMs };

        if (now > record.resetTime) {
            record.count = 0;
            record.resetTime = now + windowMs;
        }

        record.count++;
        store.set(key, record);

        res.set('X-RateLimit-Limit', max);
        res.set('X-RateLimit-Remaining', Math.max(0, max - record.count));
        res.set('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

        if (record.count > max) {
            return res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.ceil((record.resetTime - now) / 1000),
            });
        }

        next();
    };
};

/**
 * Request logging for audit trail
 */
function auditLog(req, res, next) {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
        // Log sensitive operations
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            logger.info({
                timestamp: new Date().toISOString(),
                method: req.method,
                path: req.path,
                userId: req.user?.sub,
                ip: req.ip,
                statusCode: res.statusCode,
                userAgent: req.get('user-agent'),
            }, 'AUDIT');
        }

        return originalJson(data);
    };

    next();
}

module.exports = {
    securityHeaders,
    corsOptions,
    sanitizeInputs,
    createRateLimiter,
    auditLog,
};
