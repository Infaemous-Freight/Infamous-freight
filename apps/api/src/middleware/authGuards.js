/**
 * Shipper Portal Authentication
 * Middleware to ensure shipper-only access and org isolation
 */

const logger = require("./logger");
const { ApiResponse, HTTP_STATUS } = require("@infamous/shared");

/**
 * Require shipper role
 * Ensures user is authenticated and has shipper role
 */
const requireShipper = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        new ApiResponse({
          success: false,
          error: "Authentication required",
        }),
      );
    }

    if (req.user.role !== "shipper") {
      logger.warn("Non-shipper access attempt", {
        userId: req.user.sub,
        role: req.user.role,
        path: req.path,
      });

      return res.status(HTTP_STATUS.FORBIDDEN).json(
        new ApiResponse({
          success: false,
          error: "Shipper role required",
        }),
      );
    }

    next();
  } catch (err) {
    logger.error("Shipper auth check failed", { error: err.message });
    next(err);
  }
};

/**
 * Require driver role
 */
const requireDriver = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        new ApiResponse({
          success: false,
          error: "Authentication required",
        }),
      );
    }

    if (req.user.role !== "driver") {
      logger.warn("Non-driver access attempt", {
        userId: req.user.sub,
        role: req.user.role,
        path: req.path,
      });

      return res.status(HTTP_STATUS.FORBIDDEN).json(
        new ApiResponse({
          success: false,
          error: "Driver role required",
        }),
      );
    }

    next();
  } catch (err) {
    logger.error("Driver auth check failed", { error: err.message });
    next(err);
  }
};

/**
 * Require admin role
 */
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        new ApiResponse({
          success: false,
          error: "Authentication required",
        }),
      );
    }

    if (req.user.role !== "admin") {
      logger.warn("Non-admin access attempt", {
        userId: req.user.sub,
        role: req.user.role,
        path: req.path,
      });

      return res.status(HTTP_STATUS.FORBIDDEN).json(
        new ApiResponse({
          success: false,
          error: "Admin role required",
        }),
      );
    }

    next();
  } catch (err) {
    logger.error("Admin auth check failed", { error: err.message });
    next(err);
  }
};

/**
 * Organization isolation
 * Ensure shipper can only access their organization's data
 */
const enforceOrgIsolation = (req, res, next) => {
  try {
    if (req.user.role !== "shipper") {
      return next(); // Not applicable to non-shipper roles
    }

    const orgIdInRequest = req.params.organizationId || req.query.organizationId;

    if (orgIdInRequest && orgIdInRequest !== req.user.organizationId) {
      logger.warn("Cross-organization access attempt", {
        userId: req.user.sub,
        ownOrgId: req.user.organizationId,
        requestedOrgId: orgIdInRequest,
      });

      return res.status(HTTP_STATUS.FORBIDDEN).json(
        new ApiResponse({
          success: false,
          error: "Access denied",
        }),
      );
    }

    next();
  } catch (err) {
    logger.error("Org isolation check failed", { error: err.message });
    next(err);
  }
};

module.exports = {
  requireShipper,
  requireDriver,
  requireAdmin,
  enforceOrgIsolation,
};
