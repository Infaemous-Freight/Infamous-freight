import expressRateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";

type ScopedRequest = Request & {
  correlationId?: string;
};

const keyFromReq = (req: Request) => req.ip || "unknown";

export const createLimiter = (name: string, options: Record<string, any> = {}) => {
  const windowMinutes = Number.parseInt(String(options.windowMs ?? "15"), 10);
  const limiter = expressRateLimit({
    ...options,
    windowMs: windowMinutes * 60 * 1000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      if (req.method === "OPTIONS") return true;
      if (req.path === "/api/health" || req.path === "/api/health/live") return true;
      return Boolean(options.skip?.(req));
    },
  });

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "OPTIONS") return next();
    return limiter(req, res, next);
  };
};

export const createTunedLimiter = (name: string, config: Record<string, any>) =>
  createLimiter(name, {
    windowMs: config.windowMinutes || 60,
    max: config.maxRequests || 10,
    keyGenerator: config.keyGenerator || ((req: ScopedRequest) => req.user?.sub || keyFromReq(req)),
    message: config.message || { error: `Rate limit exceeded for ${name}` },
    skip: config.skip,
  });

export const limiters = {
  general: createLimiter("general", {
    windowMs: "15",
    max: Number.parseInt(process.env.RATE_LIMIT_GENERAL_MAX || "100", 10),
    keyGenerator: (req: ScopedRequest) => req.user?.sub || keyFromReq(req),
    message: { error: "Too many requests. Please try again later." },
  }),
  auth: createLimiter("auth", {
    windowMs: "15",
    max: Number.parseInt(process.env.RATE_LIMIT_AUTH_MAX || "5", 10),
    keyGenerator: (req: Request) => keyFromReq(req),
    message: { error: "Too many authentication attempts. Try again later." },
  }),
  ai: createLimiter("ai", {
    windowMs: "1",
    max: Number.parseInt(process.env.RATE_LIMIT_AI_MAX || "20", 10),
    keyGenerator: (req: ScopedRequest) => req.user?.sub || keyFromReq(req),
    message: { error: "AI service rate limit exceeded." },
  }),
  billing: createLimiter("billing", {
    windowMs: "15",
    max: Number.parseInt(process.env.RATE_LIMIT_BILLING_MAX || "30", 10),
    keyGenerator: (req: ScopedRequest) => req.user?.sub || keyFromReq(req),
    message: { error: "Billing rate limit exceeded." },
  }),
  voice: createLimiter("voice", {
    windowMs: "1",
    max: Number.parseInt(process.env.RATE_LIMIT_VOICE_MAX || "20", 10),
    keyGenerator: (req: ScopedRequest) => req.user?.sub || keyFromReq(req),
    message: { error: "Voice endpoint rate limit exceeded." },
  }),
};

export const rateLimitMetrics = {
  recordHit: () => {},
  recordBlocked: () => {},
  recordSuccess: () => {},
};

export const authenticate = (req: ScopedRequest, res: Response, next: NextFunction) => {
  try {
    const header = (req.headers.authorization || req.headers.Authorization) as string | undefined;
    const allowXUserId =
      process.env.ALLOW_X_USER_ID === "true" ||
      ["development", "test"].includes(process.env.NODE_ENV || "");

    if ((!header || !header.startsWith("Bearer ")) && req.headers["x-user-id"] && allowXUserId) {
      const userId = String(req.headers["x-user-id"]);
      const role = String((req.headers["x-role"] as string | undefined) || "driver") as any;
      req.user = {
        id: userId,
        sub: userId,
        email: String((req.headers["x-email"] as string | undefined) || `${userId}@local.invalid`),
        role,
        scopes: ["user:avatar"],
      };
      req.auth = {
        userId,
        role,
        tokenType: "access",
        organizationId: req.headers["x-org-id"] as string | undefined,
      };
      return next();
    }

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token" });
    }

    const token = header.replace("Bearer ", "");
    const secret = process.env.JWT_SECRET || env.jwtSecret;
    if (!secret) return res.status(500).json({ error: "Server auth misconfiguration" });

    const payload = jwt.verify(token, secret) as Record<string, any>;
    req.user = {
      id: String(payload.sub),
      sub: String(payload.sub),
      email: String(payload.email || `${payload.sub}@local.invalid`),
      role: payload.role as any,
      name: payload.name,
      scopes: payload.scopes,
      permissions: payload.permissions,
      organizationId: payload.org_id,
      tenantId: payload.tenant_id,
      exp: payload.exp,
    };
    req.auth = {
      userId: String(payload.sub),
      role: payload.role,
      tokenType: payload.type || "access",
      organizationId: payload.org_id,
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authenticateFlexible = authenticate;

export const requireOrganization = (req: ScopedRequest, res: Response, next: NextFunction) => {
  if (!req.auth?.organizationId) {
    return res
      .status(401)
      .json({ error: "No organization", message: "JWT must include org_id claim" });
  }
  return next();
};

export const requireScope = (required: string | string[]) => {
  const requiredScopes = Array.isArray(required) ? required : [required];
  return (req: ScopedRequest, res: Response, next: NextFunction) => {
    const rawScopes = req.user?.scopes;
    const userScopes = Array.isArray(rawScopes)
      ? rawScopes
      : typeof rawScopes === "string"
        ? rawScopes.split(" ").filter(Boolean)
        : [];
    const hasAll = requiredScopes.every((scope) => userScopes.includes(scope));
    if (!hasAll) {
      return res.status(403).json({
        error: "Insufficient scope",
        code: "INSUFFICIENT_PERMISSIONS",
        required: requiredScopes,
        correlationId: req.correlationId,
      });
    }
    return next();
  };
};

export const auditLog = (req: ScopedRequest, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.info("request", {
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      duration,
      user: req.user?.sub,
      ip: req.ip,
      correlationId: req.correlationId,
    });
  });
  return next();
};

export const validateUserOwnership = (paramName = "userId") => {
  return (req: ScopedRequest, res: Response, next: NextFunction) => {
    const resourceUserId =
      (req.params as Record<string, string | undefined>)[paramName] ||
      (req.body as any)?.[paramName];
    const currentUserId = req.user?.sub;
    if (resourceUserId && resourceUserId !== currentUserId) {
      return res
        .status(403)
        .json({ error: "Forbidden", message: "You do not have access to this resource" });
    }
    return next();
  };
};

export const rateLimit = limiters.general;

export default {
  limiters,
  rateLimit,
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
