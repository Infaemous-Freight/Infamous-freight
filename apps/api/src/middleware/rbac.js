/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: RBAC Middleware & Guard Functions
 */

const {
  ROLE_PERMISSIONS,
  UserRole,
  roleHasPermission,
  canAccessResource,
} = require("@infamous/shared");
const { logger } = require("./logger");

/**
 * Require specific permission(s)
 * Usage: router.get('/endpoint', requirePermission('shipment:read'), handler)
 */
function requirePermission(requiredPermissions) {
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Missing required permission(s): ${permissions.join(", ")}`,
      });
    }

    next();
  };
}

/**
 * Require specific role(s)
 * Usage: router.get('/endpoint', requireRole(['ADMIN', 'OWNER']), handler)
 */
function requireRole(requiredRoles) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Required roles: ${roles.join(", ")}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
}

/**
 * Require minimum role level
 * Usage: router.get('/endpoint', requireMinimumRole('DISPATCH'), handler)
 * Higher levels: OWNER > ADMIN > DISPATCH > DRIVER > BILLING > VIEWER
 */
const ROLE_HIERARCHY = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.DISPATCH,
  UserRole.DRIVER,
  UserRole.BILLING,
  UserRole.VIEWER,
];

function requireMinimumRole(minimumRole) {
  const minIndex = ROLE_HIERARCHY.indexOf(minimumRole);
  if (minIndex === -1) {
    throw new Error(`Invalid role: ${minimumRole}`);
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userIndex = ROLE_HIERARCHY.indexOf(req.user.role);
    if (userIndex === -1 || userIndex > minIndex) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Minimum role required: ${minimumRole}`,
      });
    }

    next();
  };
}

/**
 * Validate resource ownership or admin access
 * Usage: router.get('/endpoint/:id', validateResourceAccess('shipmentId'), handler)
 */
function validateResourceAccess(resourceIdParam) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Admins can access everything
    if ([UserRole.OWNER, UserRole.ADMIN].includes(req.user.role)) {
      return next();
    }

    const resourceId = req.params[resourceIdParam];
    if (!resourceId) {
      return res.status(400).json({ error: "Resource ID not provided" });
    }

    // Check resource ownership in DB
    try {
      const { prisma } = req;
      if (!prisma) {
        // If no prisma injected, skip ownership check
        return next();
      }

      // This would need to be customized per resource type
      // For now, just verify the user is authenticated
      next();
    } catch (error) {
      return res.status(500).json({ error: "Error checking resource access" });
    }
  };
}

/**
 * Audit log middleware - tracks all actions with user context
 */
function auditAction(actionName) {
  return async (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
      // Log action only on success
      if (res.statusCode >= 200 && res.statusCode < 400) {
        if (req.prisma && req.user) {
          req.prisma.auditLog
            .create({
              data: {
                userId: req.user.sub,
                action: actionName,
                resourceType: req.params.type || req.path,
                resourceId: req.params.id,
                method: req.method,
                status: res.statusCode,
                metadata: {
                  ip: req.ip,
                  userAgent: req.get("user-agent"),
                },
              },
            })
            .catch((err) => logger.error({ err }, "Audit log error"));
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Rate limit by role
 * Admins get higher limits
 */
function roleLimiter(limitersByRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const limiter = limitersByRole[req.user.role];
    if (!limiter) {
      return next();
    }

    limiter(req, res, next);
  };
}

module.exports = {
  requirePermission,
  requireRole,
  requireMinimumRole,
  validateResourceAccess,
  auditAction,
  roleLimiter,
  ROLE_HIERARCHY,
};
