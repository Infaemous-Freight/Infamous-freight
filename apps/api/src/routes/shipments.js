const express = require("express");
const { randomUUID } = require("crypto");
const Sentry = require("@sentry/node");
const { prisma } = require("../db/prisma");
const { asyncHandler, ConflictError, NotFoundError } = require("../lib/errors");
const {
  limiters,
  authenticate,
  requireOrganization,
  requireScope,
  auditLog,
} = require("../middleware/security");
const {
  validateEnum,
  validateEnumQuery,
  validatePaginationQuery,
} = require("../middleware/validation");
const { SHIPMENT_STATUSES } = require("@infamous-freight/shared");
const {
  validateString,
  validateUUID,
  handleValidationErrors,
} = require("../middleware/validation");
const { cacheMiddleware, invalidateCache } = require("../middleware/cache");
const { exportToCSV, exportToPDF, exportToJSON } = require("../services/export");
const { emitShipmentUpdate } = require("../services/websocket");
const {
  validateShipmentUpdate,
  logStatusChange,
  getShipmentStateInfo,
} = require("../services/shipmentValidator");

const router = express.Router();
const resolveTenantContext = (req) => {
  const tenantId = req.auth?.organizationId || req.user?.tenantId || req.user?.organizationId;
  return {
    tenantId: tenantId || null,
    orgId: req.user?.organizationId || req.user?.orgId || tenantId || null,
  };
};
const shipmentTenantScope = ({ tenantId, orgId }) => {
  if (tenantId) return { tenantId };
  if (orgId) return { orgId };
  return null;
};

// Get all shipments with optional filtering
router.get(
  "/shipments",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("shipments:read"),
  cacheMiddleware(60),
  auditLog,
  [
    ...validatePaginationQuery(),
    validateEnumQuery("status", SHIPMENT_STATUSES).optional(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
      const { status, driverId } = req.query;
      const where = {};
      const { tenantId, orgId } = resolveTenantContext(req);
      const tenantScope = shipmentTenantScope({ tenantId, orgId });
      if (!tenantScope) {
        return res.status(403).json({ ok: false, error: "Tenant context is required" });
      }

      if (req.user?.role !== "admin") {
        where.userId = req.user?.sub;
      }
      Object.assign(where, tenantScope);

      if (status) where.status = status;
      if (driverId) where.driverId = driverId;

      const shipments = await prisma.shipment.findMany({
        where,
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json({ ok: true, shipments });
  }),
);

// Get shipment by ID
router.get(
  "/shipments/:id",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("shipments:read"),
  cacheMiddleware(60),
  auditLog,
  validateUUID("id"),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
      const { tenantId, orgId } = resolveTenantContext(req);
      const tenantScope = shipmentTenantScope({ tenantId, orgId });
      if (!tenantScope) {
        return res.status(403).json({ ok: false, error: "Tenant context is required" });
      }
      const shipment = await prisma.shipment.findFirst({
        where: {
          id: req.params.id,
          ...tenantScope,
        },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              status: true,
            },
          },
        },
      });

      if (!shipment) {
        return res.status(404).json({ ok: false, error: "Shipment not found" });
      }

      if (req.user?.role !== "admin" && shipment.userId !== req.user?.sub) {
        return res.status(403).json({ ok: false, error: "Forbidden" });
      }

      res.json({ ok: true, shipment });
  }),
);

// Create shipment with transaction
router.post(
  "/shipments",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("shipments:write"),
  auditLog,
  [
    validateString("origin", { maxLength: 200 }),
    validateString("destination", { maxLength: 200 }),
    validateString("trackingId", { maxLength: 64 }).optional(),
    validateString("reference", { maxLength: 64 }).optional(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    try {
      const { reference, trackingId, origin, destination, driverId } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({
          ok: false,
          error: "Origin and destination are required",
        });
      }

      const userId = req.user?.sub;
      const { tenantId, orgId } = resolveTenantContext(req);
      if (!tenantId && !orgId) {
        return res.status(403).json({ ok: false, error: "Tenant context is required" });
      }
      const newTrackingId =
        trackingId || reference || `TRK-${randomUUID().replace(/-/g, "").slice(0, 12)}`;

      // Use transaction to ensure atomic operation
      Sentry.addBreadcrumb({
        category: "database",
        message: "Creating shipment with transaction",
        level: "info",
        data: { userId, origin, destination },
      });

      const result = await prisma.$transaction(
        async (tx) => {
          const shipment = await tx.shipment.create({
            data: {
              trackingId: newTrackingId,
              reference: reference || newTrackingId,
              userId,
              tenantId,
              orgId,
              origin,
              destination,
              driverId: driverId || null,
              status: "CREATED",
            },
            include: {
              driver: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  status: true,
                },
              },
            },
          });

          // Log AI event
          await tx.aiEvent.create({
            data: {
              userId,
              command: "shipment.created",
              response: JSON.stringify({
                shipmentId: shipment.id,
                trackingId: shipment.trackingId,
              }),
              provider: "system",
            },
          });

          return shipment;
        },
        {
          timeout: 30000,
        },
      );

      res.status(201).json({ ok: true, shipment: result });

      await invalidateCache(`*shipments*${userId || ""}*`);

      // Emit WebSocket event
      emitShipmentUpdate(result.id, {
        type: "created",
        shipment: result,
      });
  } catch (err) {
      if (err.code === "P2002") throw new ConflictError("Reference already exists");
      Sentry.captureException(err);
      throw err;
    }
  }),
);

// Update shipment status with transaction
router.patch(
  "/shipments/:id",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("shipments:write"),
  auditLog,
  [
    validateUUID("id"),
    validateEnum("status", SHIPMENT_STATUSES).optional(),
    validateString("driverId", { maxLength: 100 }).optional(),
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    try {
      const { status, driverId } = req.body;
      const updates = {};
      const { tenantId, orgId } = resolveTenantContext(req);
      const tenantScope = shipmentTenantScope({ tenantId, orgId });
      if (!tenantScope) {
        return res.status(403).json({ ok: false, error: "Tenant context is required" });
      }

      // Fetch full shipment for validation
      const existing = await prisma.shipment.findFirst({
        where: {
          id: req.params.id,
          ...tenantScope,
        },
        select: {
          id: true,
          userId: true,
          status: true,
          driverId: true,
          trackingId: true,
          createdAt: true,
        },
      });

      if (!existing) {
        return res.status(404).json({ ok: false, error: "Shipment not found" });
      }

      if (req.user?.role !== "admin" && existing.userId !== req.user?.sub) {
        return res.status(403).json({ ok: false, error: "Forbidden" });
      }

      if (status !== undefined) updates.status = status;
      if (driverId !== undefined) updates.driverId = driverId;

      // Validate shipment state machine and business rules
      const validation = validateShipmentUpdate(existing, updates);
      if (!validation.valid) {
        Sentry.addBreadcrumb({
          category: "validation",
          message: "Invalid shipment update",
          level: "warning",
          data: {
            shipmentId: req.params.id,
            errors: validation.errors,
            attempted: updates,
          },
        });

        return res.status(400).json({
          ok: false,
          error: "Invalid shipment state transition",
          details: validation.errors,
          current: existing.status,
          requested: updates.status,
        });
      }

      Sentry.addBreadcrumb({
        category: "database",
        message: "Updating shipment with transaction",
        level: "info",
        data: { shipmentId: req.params.id, updates },
      });

      const result = await prisma.$transaction(
        async (tx) => {
          const shipment = await tx.shipment.update({
            where: { id: req.params.id },
            data: updates,
            include: {
              driver: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  status: true,
                },
              },
            },
          });

          // Log AI event for status change
          if (status) {
            await tx.aiEvent.create({
              data: {
                userId: shipment.userId,
                command: "shipment.status.changed",
                response: JSON.stringify({
                  shipmentId: shipment.id,
                  trackingId: shipment.trackingId,
                  newStatus: status,
                }),
                provider: "system",
              },
            });

            // Audit log status change
            logStatusChange({
              shipmentId: shipment.id,
              fromStatus: existing.status,
              toStatus: status,
              userId: req.user?.sub,
              reason: "Status update via API",
            });
          }

          return shipment;
        },
        {
          timeout: 30000,
        },
      );

      res.json({ ok: true, shipment: result });

      await invalidateCache(`*shipments*${result.userId || ""}*`);

      // Emit WebSocket event
      emitShipmentUpdate(result.id, {
        type: "updated",
        shipment: result,
        changes: updates,
      });
  } catch (err) {
      if (err.code === "P2025") throw new NotFoundError("Shipment not found");
      Sentry.captureException(err);
      throw err;
    }
  }),
);

// Delete shipment
router.delete(
  "/shipments/:id",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("shipments:write"),
  auditLog,
  [validateUUID("id"), handleValidationErrors],
  asyncHandler(async (req, res) => {
    try {
      const { tenantId, orgId } = resolveTenantContext(req);
      const tenantScope = shipmentTenantScope({ tenantId, orgId });
      if (!tenantScope) {
        return res.status(403).json({ ok: false, error: "Tenant context is required" });
      }
      const existing = await prisma.shipment.findFirst({
        where: {
          id: req.params.id,
          ...tenantScope,
        },
        select: { id: true, userId: true },
      });

      if (!existing) {
        return res.status(404).json({ ok: false, error: "Shipment not found" });
      }

      if (req.user?.role !== "admin" && existing.userId !== req.user?.sub) {
        return res.status(403).json({ ok: false, error: "Forbidden" });
      }

      await prisma.shipment.delete({
        where: { id: req.params.id },
      });

      res.json({ ok: true, message: "Shipment deleted successfully" });

      await invalidateCache("*shipments*");
  } catch (err) {
      if (err.code === "P2025") throw new NotFoundError("Shipment not found");
      Sentry.captureException(err);
      throw err;
    }
  }),
);

// Export shipments
router.get(
  "/shipments/export/:format",
  limiters.export,
  authenticate,
  requireOrganization,
  requireScope("shipments:read"),
  auditLog,
  [validateEnumQuery("status", SHIPMENT_STATUSES).optional(), handleValidationErrors],
  asyncHandler(async (req, res) => {
      const { format } = req.params;
      const { status, driverId } = req.query;
      const { tenantId, orgId } = resolveTenantContext(req);
      const tenantScope = shipmentTenantScope({ tenantId, orgId });
      if (!tenantScope) {
        return res.status(403).json({ ok: false, error: "Tenant context is required" });
      }

      // Build query
      const where = {};
      Object.assign(where, tenantScope);
      if (status) where.status = status;
      if (driverId) where.driverId = driverId;

      // Fetch shipments
      const shipments = await prisma.shipment.findMany({
        where,
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Export based on format
      switch (format.toLowerCase()) {
        case "csv": {
          const csv = exportToCSV(shipments);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="shipments-${Date.now()}.csv"`,
          );
          res.send(csv);
          break;
        }

        case "pdf": {
          const pdf = await exportToPDF(shipments);
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="shipments-${Date.now()}.pdf"`,
          );
          res.send(pdf);
          break;
        }

        case "json": {
          const json = exportToJSON(shipments);
          res.setHeader("Content-Type", "application/json");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="shipments-${Date.now()}.json"`,
          );
          res.send(json);
          break;
        }

        default:
          return res.status(400).json({
            ok: false,
            error: "Invalid format. Use: csv, pdf, or json",
          });
      }
  }),
);

module.exports = router;
