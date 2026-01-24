/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Security & Authentication Middleware
 */

const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const { authenticateWithRotation } = require("./advancedSecurity");
const { env } = require("../config/env");
const rateLimitMetrics = require("../lib/rateLimitMetrics");

// Rate limiters with enhanced configuration
const createLimiter = (name, options) => {
  const limiter = rateLimit({
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    // Skip health checks and CORS preflight
    skip: (req) =>
      req.method === 'OPTIONS' ||
      req.path === '/api/health' ||
      req.path === '/api/health/live',
  });

  return (req, res, next) => {
    // Allow custom skip hooks and preflight bypass
    if (req.method === 'OPTIONS' || (options.skip && options.skip(req, res))) {
      return next();
    }

    const key = options.keyGenerator ? options.keyGenerator(req, res) : req.ip;
    rateLimitMetrics.recordHit(name, key);

    res.on("finish", () => {
      if (res.statusCode === 429) {
        rateLimitMetrics.recordBlocked(name, key);
      } else {
        rateLimitMetrics.recordSuccess(name);
      }
    });

    return limiter(req, res, next);
  };
};

const limiters = {
  general: createLimiter('general', {
    windowMs: parseInt(process.env.RATE_LIMIT_GENERAL_WINDOW_MS || '15') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_GENERAL_MAX || '100'),
    keyGenerator: (req) => req.user?.sub || req.ip,
    message: { error: 'Too many requests. Please try again later.' },
  }),
  auth: createLimiter('auth', {
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '15') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'),
    keyGenerator: (req) => req.ip,
    message: { error: "Too many authentication attempts. Try again later." },
  }),
  ai: createLimiter('ai', {
    windowMs: parseInt(process.env.RATE_LIMIT_AI_WINDOW_MS || '1') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_AI_MAX || '20'),
    keyGenerator: (req) => req.user?.sub || req.ip,
    message: { error: 'AI service rate limit exceeded.' },
  }),
  billing: createLimiter('billing', {
    windowMs: parseInt(process.env.RATE_LIMIT_BILLING_WINDOW_MS || '15') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_BILLING_MAX || '30'),
    keyGenerator: (req) => req.user?.sub || req.ip,
    message: { error: 'Billing rate limit exceeded.' },
  }),
  voice: createLimiter('voice', {
    windowMs: parseInt(process.env.RATE_LIMIT_VOICE_WINDOW_MS || '1') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_VOICE_MAX || '10'),
    keyGenerator: (req) => req.user?.sub || req.ip,
    message: { error: 'Voice processing rate limit exceeded.' },
  }),
  // High-cost operations (exports, reports)
  export: createLimiter('export', {
    windowMs: parseInt(process.env.RATE_LIMIT_EXPORT_WINDOW_MS || '60') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_EXPORT_MAX || '5'),
    keyGenerator: (req) => req.user?.sub || req.ip,
    message: { error: 'Export rate limit exceeded. Maximum 5 exports per hour.' },
  }),
  // Password/account operations
  passwordReset: createLimiter('passwordReset', {
    windowMs: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_WINDOW_MS || '24') * 60 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_MAX || '3'),
    keyGenerator: (req) => req.body?.email || req.ip,
    message: { error: 'Too many password reset attempts. Try again in 24 hours.' },
  }),
  // Webhook validation (allow bursts but track)
  webhook: createLimiter('webhook', {
    windowMs: parseInt(process.env.RATE_LIMIT_WEBHOOK_WINDOW_MS || '1') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_WEBHOOK_MAX || '100'),
    keyGenerator: (req) => req.ip,
    message: { error: 'Webhook rate limit exceeded.' },
  }),
};

// Authentication via JWT
function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || req.headers.Authorization;
    const allowXUserId = env?.nodeEnv !== "production";
    const xUserId = req.headers["x-user-id"];
    // Dev fallback: allow x-user-id when bearer is absent
    if ((!header || !header.startsWith("Bearer ")) && allowXUserId) {
      if (Array.isArray(xUserId)) {
        return res.status(400).json({ error: "Invalid x-user-id header" });
      }
      if (typeof xUserId === "string") {
        req.user = { sub: xUserId, scopes: ["user:avatar"] };
        req.auth = {
          userId: req.user.sub,
          role: req.user.role,
          organizationId: req.headers["x-org-id"], // Dev: org can be overridden
        };
        return next();
      }
    }

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token" });
    }
    const token = header.replace("Bearer ", "");
    const secret = process.env.JWT_SECRET || env?.jwtSecret;
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
      message: "JWT must include org_id claim"
    });
  }
  next();
}

// Optional rotation-aware authentication controlled via env
function authenticateFlexible(req, res, next) {
  if (process.env.ENABLE_TOKEN_ROTATION === "true") {
    return authenticateWithRotation(req, res, next);
  }
  return authenticate(req, res, next);
}

// Scope enforcement
function requireScope(required) {
  const requiredScopes = Array.isArray(required) ? required : [required];
  return (req, res, next) => {
    const scopes = req.user?.scopes || [];
    const hasAll = requiredScopes.every((s) => scopes.includes(s));
    if (!hasAll) {
      return res
        .status(403)
        .json({ error: "Insufficient scope", required: requiredScopes });
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
    console.info("request", {
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      duration,
      user: req.user?.sub,
      ip: req.ip,
      correlationId: req.correlationId,
      auth: maskedAuthorization,
    });

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
    } catch (_) { }
  });
  next();
}

// Validate user owns resource (for routes like /users/:id, /shipments/:id)
function validateUserOwnership(paramName = 'userId') {
  return async (req, res, next) => {
    const resourceUserId = req.params[paramName] || req.body?.[paramName];
    const currentUserId = req.user?.sub;

    // Admin can bypass ownership check
    if (req.user?.role === 'admin') {
      return next();
    }

    // User can only access own resources
    if (resourceUserId && resourceUserId !== currentUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this resource',
      });
    }

    next();
  };
}

module.exports = {
  limiters,
  rateLimit: limiters.general,
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
