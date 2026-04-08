import { createRequire } from "node:module";
import type { RequestHandler } from "express";

const require = createRequire(import.meta.url);
const rbac = require("./rbac.cjs") as {
  requirePermission: (permissions: string | string[]) => RequestHandler;
  requireRole: (roles: string | string[]) => RequestHandler;
  requireMinimumRole: (role: string) => RequestHandler;
  validateResourceAccess: (resource: string) => RequestHandler;
  auditAction: (action: string) => RequestHandler;
  roleLimiter: (options?: Record<string, unknown>) => RequestHandler;
  ROLE_HIERARCHY: Record<string, number>;
};

export const requirePermission = rbac.requirePermission;
export const requireRole = rbac.requireRole;
export const requireMinimumRole = rbac.requireMinimumRole;
export const validateResourceAccess = rbac.validateResourceAccess;
export const auditAction = rbac.auditAction;
export const roleLimiter = rbac.roleLimiter;
export const ROLE_HIERARCHY = rbac.ROLE_HIERARCHY;

export default rbac;
