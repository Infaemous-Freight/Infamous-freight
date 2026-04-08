import rateLimit from "express-rate-limit";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { logger } from "../lib/logger.js";

type ScopedRequest = Request & {
  user?: {
    sub?: string;
    role?: string;
    permissions?: string[];
  };
  auth?: {
    userId?: string;
    role?: string;
    scopes?: string[] | string;
  };
};

const normalize = (value: string) => value.trim().toLowerCase();

export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 100,
  admin: 90,
  finance: 80,
  broker: 70,
  shipper: 60,
  carrier_admin: 55,
  dispatcher: 50,
  carrier: 45,
  driver: 40,
  customer: 20,
  viewer: 10,
};

const getUserRole = (req: ScopedRequest) => normalize(req.user?.role || req.auth?.role || "viewer");

const getScopes = (req: ScopedRequest): string[] => {
  if (Array.isArray(req.user?.permissions)) return req.user.permissions;
  if (Array.isArray(req.auth?.scopes)) return req.auth.scopes;
  if (typeof req.auth?.scopes === "string") return req.auth.scopes.split(" ").filter(Boolean);
  return [];
};

const hasScope = (req: ScopedRequest, scope: string): boolean => {
  const scopes = getScopes(req);
  return scopes.includes("*") || scopes.includes(scope);
};

export const requirePermission = (permissions: string | string[]): RequestHandler => {
  const required = Array.isArray(permissions) ? permissions : [permissions];
  return (req: ScopedRequest, res: Response, next: NextFunction) => {
    if (!req.user && !req.auth) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const granted = required.every((permission) => hasScope(req, permission));
    if (!granted) {
      return res.status(403).json({ error: "Insufficient permissions", required });
    }

    return next();
  };
};

export const requireRole = (role: string | string[]): RequestHandler => {
  const allowed = (Array.isArray(role) ? role : [role]).map(normalize);

  return (req: ScopedRequest, res: Response, next: NextFunction) => {
    if (!req.user && !req.auth) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = getUserRole(req);
    if (!allowed.includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Insufficient role", required: allowed, current: userRole });
    }

    return next();
  };
};

export const requireMinimumRole = (role: string): RequestHandler => {
  const minimum = ROLE_HIERARCHY[normalize(role)] ?? 0;

  return (req: ScopedRequest, res: Response, next: NextFunction) => {
    if (!req.user && !req.auth) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const currentRole = getUserRole(req);
    const currentLevel = ROLE_HIERARCHY[currentRole] ?? 0;

    if (currentLevel < minimum) {
      return res
        .status(403)
        .json({ error: "Insufficient role level", required: role, current: currentRole });
    }

    return next();
  };
};

export const validateResourceAccess = (_resource: string): RequestHandler => {
  return (_req: ScopedRequest, _res: Response, next: NextFunction) => next();
};

export const auditAction = (action: string): RequestHandler => {
  return (req: ScopedRequest, _res: Response, next: NextFunction) => {
    logger.info(
      {
        action,
        userId: req.user?.sub || req.auth?.userId,
        role: getUserRole(req),
        path: req.originalUrl || req.path,
        method: req.method,
      },
      "RBAC audit",
    );
    return next();
  };
};

export const roleLimiter = (options: Record<string, unknown> = {}): RequestHandler => {
  const limiter = rateLimit({
    windowMs: Number(options.windowMs ?? 15 * 60 * 1000),
    max: Number(options.max ?? 300),
    standardHeaders: true,
    legacyHeaders: false,
  });
  return (req: Request, res: Response, next: NextFunction) => limiter(req, res, next);
};

export default {
  requirePermission,
  requireRole,
  requireMinimumRole,
  validateResourceAccess,
  auditAction,
  roleLimiter,
  ROLE_HIERARCHY,
};
