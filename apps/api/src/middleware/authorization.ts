import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";
import { ApiError } from "../utils/errors.js";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: ["billing:update"],
  ADMIN: ["billing:update"],
  BILLING: ["billing:update"],
};

function normalizeRole(role?: string): string | null {
  if (!role) return null;
  return role.toUpperCase();
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = normalizeRole(req.auth?.role);

    if (!role) {
      next(new ApiError(403, "ROLE_REQUIRED", "Role is required for this operation"));
      return;
    }

    if (!(ROLE_PERMISSIONS[role] ?? []).includes(permission)) {
      logger.warn(
        {
          userId: req.auth?.userId,
          role,
          permission,
          requestId: req.headers["x-request-id"],
          path: req.path,
          method: req.method,
          denialReason: "RBAC_PERMISSION_DENIED",
        },
        "Access denied by RBAC policy",
      );
      next(new ApiError(403, "PERMISSION_DENIED", "You do not have permission for this operation"));
      return;
    }

    next();
  };
}

export function requireRole(requiredRoles: string[]) {
  const normalizedRequired = requiredRoles.map((role) => role.toUpperCase());

  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = normalizeRole(req.auth?.role ?? (req.user as any)?.role);

    if (!role) {
      next(new ApiError(403, "ROLE_REQUIRED", "Role is required for this operation"));
      return;
    }

    if (!normalizedRequired.includes(role)) {
      logger.warn(
        {
          userId: req.auth?.userId,
          role,
          requiredRoles: normalizedRequired,
          requestId: req.headers["x-request-id"],
          path: req.path,
          method: req.method,
          denialReason: "RBAC_ROLE_DENIED",
        },
        "Access denied by RBAC role policy",
      );
      next(new ApiError(403, "PERMISSION_DENIED", "You do not have permission for this operation"));
      return;
    }

    next();
  };
}
