import rbac from "./rbac.js";
export const requirePermission = rbac.requirePermission;
export const requireRole = rbac.requireRole;
export const requireMinimumRole = rbac.requireMinimumRole;
export const validateResourceAccess = rbac.validateResourceAccess;
export const auditAction = rbac.auditAction;
export const roleLimiter = rbac.roleLimiter;
export const ROLE_HIERARCHY = rbac.ROLE_HIERARCHY;

export default rbac;
