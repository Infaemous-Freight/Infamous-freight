const express = require("express");
const { v4: uuid } = require("uuid");
const { prisma } = require("../db/prisma");
const {
  limiters,
  authenticate,
  requireOrganization,
  requireScope,
  auditLog,
} = require("../middleware/security");
const { validateEnum, validatePaginationQuery } = require("../middleware/validation");
const { SHIPMENT_STATUSES } = require("@infamous-freight/shared");
const {
  validateString,
  validateUUID,
  handleValidationErrors,
} = require("../middleware/validation");
const { cacheMiddleware, invalidateCache } = require("../middleware/cache");
const {
  exportToCSV,
  exportToPDF,
  exportToJSON,
} = require("../services/export");
const { emitShipmentUpdate } = require("../services/websocket");

const router = express.Router();

// Get all shipments with optional filtering
router.get(
  "/shipments",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("shipments:read"),
  cacheMiddleware(60),
  auditLog,
  [...validatePaginationQuery(), validateEnum("status", SHIPMENT_STATUSES).optional(), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { status, driverId } = req.query;
      const where = {};

      if (req.user?.role !== "admin") {
        where.userId = req.user?.sub;
      }

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
    } catch (err) {
      next(err);
    }
  },
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
  async (req, res, next) => {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id: req.params.id },
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
    } catch (err) {
      next(err);
    }
  },
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
  async (req, res, next) => {
    try {
      const { reference, trackingId, origin, destination, driverId } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({
          ok: false,
          error: "Origin and destination are required",
        });
      }

      const userId = req.user?.sub;
      const newTrackingId =
        trackingId || reference || `TRK-${uuid().replace(/-/g, "").slice(0, 12)}`;

      // Use transaction to ensure atomic operation
      const result = await prisma.$transaction(
        async (tx) => {
          const shipment = await tx.shipment.create({
            data: {
              trackingId: newTrackingId,
              reference: reference || newTrackingId,
              userId,
              origin,
              destination,
              driverId: driverId || null,
              status: "pending",
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
      if (err.code === "P2002") {
        return res
          .status(409)
          .json({ ok: false, error: "Reference already exists" });
      }
      next(err);
    }
  },
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
  async (req, res, next) => {
    try {
      const { status, driverId } = req.body;
      const updates = {};

      const existing = await prisma.shipment.findUnique({
        where: { id: req.params.id },
        select: { id: true, userId: true },
      });

      if (!existing) {
        return res.status(404).json({ ok: false, error: "Shipment not found" });
      }

      if (req.user?.role !== "admin" && existing.userId !== req.user?.sub) {
        return res.status(403).json({ ok: false, error: "Forbidden" });
      }

      if (status !== undefined) updates.status = status;
      if (driverId !== undefined) updates.driverId = driverId;

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
      if (err.code === "P2025") {
        return res.status(404).json({ ok: false, error: "Shipment not found" });
      }
      next(err);
    }
  },
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
  async (req, res, next) => {
    try {
      const existing = await prisma.shipment.findUnique({
        where: { id: req.params.id },
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
      if (err.code === "P2025") {
        return res.status(404).json({ ok: false, error: "Shipment not found" });
      }
      next(err);
    }
  },
);

// Export shipments
router.get(
  "/shipments/export/:format",
  limiters.general,
  authenticate,
  requireScope("shipments:read"),
  auditLog,
  async (req, res, next) => {
    try {
      const { format } = req.params;
      const { status, driverId } = req.query;

      // Build query
      const where = {};
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
        case "csv":
          const csv = exportToCSV(shipments);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="shipments-${Date.now()}.csv"`,
          );
          res.send(csv);
          break;

        case "pdf":
          const pdf = await exportToPDF(shipments);
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="shipments-${Date.now()}.pdf"`,
          );
          res.send(pdf);
          break;

        case "json":
          const json = exportToJSON(shipments);
          res.setHeader("Content-Type", "application/json");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="shipments-${Date.now()}.json"`,
          );
          res.send(json);
          break;

        default:
          return res.status(400).json({
            ok: false,
            error: "Invalid format. Use: csv, pdf, or json",
          });
      }
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
