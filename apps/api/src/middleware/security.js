/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Security & Authentication Middleware
 */

const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const rateLimitMetrics = require("../lib/rateLimitMetrics.cjs");
const { logger } = require("./logger.cjs");
const { validateScope, hasScope, hasAllScopes } = require("@infamous-freight/shared");

/**
 * Factory for creating rate limiters with enhanced configuration
 * Supports per-route customization and Redis backend for distributed limiting
 */
const createLimiter = (name, options = {}) => {
  // Determine window in milliseconds (parse from minutes)
  const windowMinutes = parseInt(options.windowMs || "15");
  const windowMs = windowMinutes * 60 * 1000;

  const limiter = rateLimit({
    ...options,
    windowMs,
    standardHeaders: true,
    legacyHeaders: false,
    // Skip health checks and CORS preflight by default
    skip: (req) => {
      if (req.method === "OPTIONS") return true;
      if (req.path === "/api/health" || req.path === "/api/health/live") return true;
      // Allow custom skip function
      return options.skip && options.skip(req);
    },
  });

  return (req, res, next) => {
    // Final skip check
    if (req.method === "OPTIONS") {
      return next();
    }

    const key = options.keyGenerator ? options.keyGenerator(req) : ipKeyGenerator(req);
    rateLimitMetrics.recordHit(name, key);

    res.on("finish", () => {
      if (res.statusCode === 429) {
        rateLimitMetrics.recordBlocked(name, key);
        logger.warn({
          event: "rate_limit_exceeded",
          limiter: name,
          key,
          ip: req.ip,
          user: req.user?.sub,
          path: req.path,
          windowMinutes,
          maxRequests: options.max || 100,
        });
      } else {
        rateLimitMetrics.recordSuccess(name);
      }
    });

    return limiter(req, res, next);
  };
};

/**
 * Create a tuned limiter for specific operations
 * Use for high-cost endpoints
 */
const createTunedLimiter = (name, config) => {
  return createLimiter(name, {
    windowMs: config.windowMinutes || 60,
    max: config.maxRequests || 10,
    keyGenerator: config.keyGenerator || ((req) => req.user?.sub || ipKeyGenerator(req)),
    message: config.message || { error: `Rate limit exceeded for ${name}` },
    skip: config.skip,
  });
};

const limiters = {
  general: createLimiter("general", {
    windowMs: "15", // In minutes, converted to ms above
    max: parseInt(process.env.RATE_LIMIT_GENERAL_MAX || "100"),
    keyGenerator: (req) => req.user?.sub || ipKeyGenerator(req),
    message: { error: "Too many requests. Please try again later." },
  }),
  auth: createLimiter("auth", {
    windowMs: "15",
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || "5"),
    keyGenerator: (req) => ipKeyGenerator(req),
    message: { error: "Too many authentication attempts. Try again later." },
  }),
  ai: createLimiter("ai", {
    windowMs: "1",
    max: parseInt(process.env.RATE_LIMIT_AI_MAX || "20"),
    keyGenerator: (req) => req.user?.sub || ipKeyGenerator(req),
    message: { error: "AI service rate limit exceeded." },
  }),
  billing: createLimiter("billing", {
    windowMs: "15",
    max: parseInt(process.env.RATE_LIMIT_BILLING_MAX || "30"),
    keyGenerator: (req) => req.user?.sub || ipKeyGenerator(req),
    message: { error: "Billing rate limit exceeded." },
  }),
  smsUser: createLimiter("smsUser", {
    windowMs: "60",
    max: parseInt(process.env.RATE_LIMIT_SMS_USER_MAX || "20"),
    keyGenerator: (req) => req.user?.sub || ipKeyGenerator(req),
    message: { error: "SMS rate limit exceeded for user." },
  }),
  smsOrg: createLimiter("smsOrg", {
    windowMs: "1440", // 24 hours
    max: parseInt(process.env.RATE_LIMIT_SMS_ORG_MAX || "200"),
    keyGenerator: (req) => req.auth?.organizationId || req.headers["x-org-id"] || ipKeyGenerator(req),
    message: { error: "SMS rate limit exceeded for organization." },
  }),
  voice: createLimiter("voice", {
    windowMs: "1",
    max: parseInt(process.env.RATE_LIMIT_VOICE_MAX || "10"),
    keyGenerator: (req) => req.user?.sub || ipKeyGenerator(req),
    message: { error: "Voice processing rate limit exceeded." },
  }),
  export: createLimiter("export", {
    windowMs: "60",
    max: parseInt(process.env.RATE_LIMIT_EXPORT_MAX || "5"),
    keyGenerator: (req) => req.user?.sub || ipKeyGenerator(req),
    message: { error: "Export rate limit exceeded. Maximum 5 exports per hour." },
  }),
  passwordReset: createLimiter("passwordReset", {
    windowMs: "1440",
    max: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_MAX || "3"),
    keyGenerator: (req) => req.body?.email || ipKeyGenerator(req),
    message: { error: "Too many password reset attempts. Try again in 24 hours." },
  }),
  webhook: createLimiter("webhook", {
    windowMs: "1",
    max: parseInt(process.env.RATE_LIMIT_WEBHOOK_MAX || "100"),
    keyGenerator: (req) => ipKeyGenerator(req),
    message: { error: "Webhook rate limit exceeded." },
  }),
};

// Authentication via JWT
function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || req.headers.Authorization;
    const allowXUserId =
      process.env.ALLOW_X_USER_ID === "true" ||
      ["development", "test"].includes(process.env.NODE_ENV);
    // Dev fallback: allow x-user-id when bearer is absent
    if ((!header || !header.startsWith("Bearer ")) && req.headers["x-user-id"] && allowXUserId) {
      req.user = { sub: String(req.headers["x-user-id"]), scopes: ["user:avatar"] };
      req.auth = {
        userId: req.user.sub,
        role: req.user.role,
        organizationId: req.headers["x-org-id"], // Dev: org can be overridden
      };
      return next();
    }

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token" });
    }
    const token = header.replace("Bearer ", "");
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Server auth misconfiguration" });
    }
    const payload = jwt.verify(token, secret);
    req.user = payload; // expected shape: { sub, email?, role?, scopes?: string[], org_id?: string }

    // Phase 19: Extract organization from JWT claim
    req.auth = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      organizationId: payload.org_id, // JWT claim name: org_id
      scopes: payload.scopes,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Phase 19: Middleware to require organization in JWT
function requireOrganization(req, res, next) {
  const orgId = req.auth?.organizationId;
  if (!orgId) {
    return res.status(401).json({
      error: "No organization",
      message: "JWT must include org_id claim",
    });
  }
  next();
}

// Optional rotation-aware authentication controlled via env
function authenticateFlexible(req, res, next) {
  if (process.env.ENABLE_TOKEN_ROTATION === "true") {
    const { authenticateWithRotation } = require("./advancedSecurity.cjs");
    return authenticateWithRotation(req, res, next);
  }
  return authenticate(req, res, next);
}

// Enhanced scope enforcement with validation
function requireScope(required) {
  const requiredScopes = Array.isArray(required) ? required : [required];

  // Validate all required scopes are in the registry
  const invalidScopes = requiredScopes.filter((scope) => !validateScope(scope));
  if (invalidScopes.length > 0) {
    logger.error("Invalid scopes in requireScope():", {
      invalidScopes,
      hint: "Ensure scopes are defined in @infamous-freight/shared/src/scopes.ts",
    });
  }

  return (req, res, next) => {
    const rawScopes = req.user?.scopes;
    const userScopes = Array.isArray(rawScopes)
      ? rawScopes
      : typeof rawScopes === "string"
        ? rawScopes.split(" ").filter(Boolean)
        : [];

    const hasRequiredScopes =
      requiredScopes.length > 1
        ? hasAllScopes(userScopes, requiredScopes)
        : hasScope(userScopes, requiredScopes[0]);

    if (!hasRequiredScopes) {
      logger.warn("Scope check failed", {
        requiredScopes,
        userScopes,
        userId: req.user?.sub,
        path: req.path,
        correlationId: req.correlationId,
      });

      return res.status(403).json({
        error: "Insufficient scope",
        code: "INSUFFICIENT_PERMISSIONS",
        required: requiredScopes,
        correlationId: req.correlationId,
      });
    }

    next();
  };
}

// Audit log (basic + tamper-evident chain)
function auditLog(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const maskedAuthorization = req.headers.authorization ? "***" : undefined;
    logger.info(
      {
        method: req.method,
        path: req.originalUrl || req.path,
        status: res.statusCode,
        duration,
        user: req.user?.sub,
        ip: req.ip,
        correlationId: req.correlationId,
        auth: maskedAuthorization,
      },
      "request",
    );

    try {
      const { append } = require("../lib/auditChain");
      append({
        method: req.method,
        path: req.originalUrl || req.path,
        status: res.statusCode,
        duration,
        user: req.user?.sub,
        role: req.user?.role || req.auth?.role,
        ip: req.ip,
        correlationId: req.correlationId,
      });
    } catch (_) {
      /* Audit log write failure - continue without logging */
    }
  });
  next();
}

// Validate user owns resource (for routes like /users/:id, /shipments/:id)
function validateUserOwnership(paramName = "userId") {
  return async (req, res, next) => {
    const resourceUserId = req.params[paramName] || req.body?.[paramName];
    const currentUserId = req.user?.sub;

    // Admin can bypass ownership check
    if (req.user?.role === "admin") {
      return next();
    }

    // User can only access own resources
    if (resourceUserId && resourceUserId !== currentUserId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have access to this resource",
      });
    }

    next();
  };
}

module.exports = {
  limiters,
  rateLimit: limiters.general,
  createLimiter,
  createTunedLimiter,
  rateLimitMetrics,
  authenticate,
  authenticateFlexible,
  requireScope,
  requireOrganization,
  auditLog,
  validateUserOwnership,
};

// Ensure single-line export patterns for verification script compatibility
module.exports.requireOrganization = requireOrganization;
module.exports.requireScope = requireScope;
