/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Dispatch Management Routes
 * Features: Assignments, optimization, real-time tracking, driver-load matching
 */

const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const { prisma } = require("../lib/prismaClient");
const { authenticate, requireScope } = require("../middleware/security");
const { requirePermission, auditAction } = require("../middleware/rbac");
const { limiters } = require("../middleware/security");
const { Permission } = require("@infamous-freight/shared");

const router = express.Router();

// ==================== DRIVERS ====================

/**
 * GET /api/dispatch/drivers
 * List all active drivers with their current assignments
 */
router.get(
    "/drivers",
    limiters.general,
    authenticate,
    requirePermission(Permission.DRIVER_READ),
    async (req, res, next) => {
        try {
            const { status = "ACTIVE", limit = 50, offset = 0 } = req.query;

            const drivers = await prisma.driver.findMany({
                where: status ? { status } : undefined,
                include: {
                    currentAssignment: {
                        include: {
                            shipment: true
                        }
                    },
                    auditLogs: {
                        orderBy: { createdAt: "desc" },
                        take: 5
                    }
                },
                orderBy: { createdAt: "desc" },
                take: parseInt(limit),
                skip: parseInt(offset)
            });

            const total = await prisma.driver.count({
                where: status ? { status } : undefined
            });

            res.json({
                success: true,
                data: drivers,
                pagination: { total, limit: parseInt(limit), offset: parseInt(offset) }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/dispatch/drivers/:id
 * Get driver details with assignment history
 */
router.get(
    "/drivers/:id",
    limiters.general,
    authenticate,
    requirePermission(Permission.DRIVER_READ),
    param("id").isUUID(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const driver = await prisma.driver.findUnique({
                where: { id: req.params.id },
                include: {
                    currentAssignment: {
                        include: { shipment: true }
                    },
                    assignments: {
                        include: { shipment: true },
                        orderBy: { createdAt: "desc" },
                        take: 20
                    },
                    auditLogs: {
                        orderBy: { createdAt: "desc" },
                        take: 50
                    }
                }
            });

            if (!driver) {
                return res.status(404).json({ error: "Driver not found" });
            }

            res.json({ success: true, data: driver });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/dispatch/drivers
 * Create a new driver
 */
router.post(
    "/drivers",
    limiters.general,
    authenticate,
    requirePermission(Permission.DRIVER_CREATE),
    auditAction("DRIVER_CREATED"),
    body("name").isString().notEmpty(),
    body("email").isEmail().optional(),
    body("phone").isMobilePhone().optional(),
    body("licenseNumber").isString().notEmpty(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const driver = await prisma.driver.create({
                data: {
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                    licenseNumber: req.body.licenseNumber,
                    status: "ACTIVE"
                }
            });

            res.status(201).json({ success: true, data: driver });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/dispatch/drivers/:id
 * Update driver info
 */
router.patch(
    "/drivers/:id",
    limiters.general,
    authenticate,
    requirePermission(Permission.DRIVER_UPDATE),
    auditAction("DRIVER_UPDATED"),
    param("id").isUUID(),
    body("name").isString().optional(),
    body("status").isIn(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
    body("phone").isMobilePhone().optional(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const driver = await prisma.driver.update({
                where: { id: req.params.id },
                data: req.body
            });

            res.json({ success: true, data: driver });
        } catch (error) {
            next(error);
        }
    }
);

// ==================== ASSIGNMENTS ====================

/**
 * GET /api/dispatch/assignments
 * List all assignments with filters
 */
router.get(
    "/assignments",
    limiters.general,
    authenticate,
    requirePermission(Permission.DISPATCH_READ),
    async (req, res, next) => {
        try {
            const { status, driverId, limit = 50, offset = 0 } = req.query;

            const where = {};
            if (status) where.status = status;
            if (driverId) where.driverId = driverId;

            const assignments = await prisma.assignment.findMany({
                where,
                include: {
                    driver: true,
                    shipment: true
                },
                orderBy: { createdAt: "desc" },
                take: parseInt(limit),
                skip: parseInt(offset)
            });

            const total = await prisma.assignment.count({ where });

            res.json({
                success: true,
                data: assignments,
                pagination: { total, limit: parseInt(limit), offset: parseInt(offset) }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/dispatch/assignments
 * Create assignment (assign shipment to driver)
 * Triggers dispatch agent
 */
router.post(
    "/assignments",
    limiters.general,
    authenticate,
    requirePermission(Permission.DISPATCH_CREATE),
    auditAction("ASSIGNMENT_CREATED"),
    body("driverId").isUUID(),
    body("shipmentId").isUUID(),
    body("optimizationHint").isString().optional(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { driverId, shipmentId, optimizationHint } = req.body;

            // Verify driver exists and is active
            const driver = await prisma.driver.findUnique({
                where: { id: driverId }
            });
            if (!driver || driver.status !== "ACTIVE") {
                return res.status(400).json({ error: "Driver is not available" });
            }

            // Verify shipment exists
            const shipment = await prisma.shipment.findUnique({
                where: { id: shipmentId }
            });
            if (!shipment) {
                return res.status(404).json({ error: "Shipment not found" });
            }

            // Create assignment
            const assignment = await prisma.assignment.create({
                data: {
                    driverId,
                    shipmentId,
                    status: "ASSIGNED",
                    optimizationHint,
                    assignedAt: new Date(),
                    assignedBy: req.user.sub
                }
            });

            // Update shipment status
            await prisma.shipment.update({
                where: { id: shipmentId },
                data: { status: "ASSIGNED", assignedToId: driverId }
            });

            // Trigger dispatch optimization agent
            if (req.agentEngine) {
                await req.agentEngine.emit("shipment.assigned", {
                    shipmentId,
                    driverId,
                    assignmentId: assignment.id,
                    hint: optimizationHint
                });
            }

            res.status(201).json({ success: true, data: assignment });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/dispatch/assignments/:id
 * Update assignment status (e.g., IN_TRANSIT, DELIVERED)
 */
router.patch(
    "/assignments/:id",
    limiters.general,
    authenticate,
    requirePermission(Permission.DISPATCH_UPDATE),
    auditAction("ASSIGNMENT_UPDATED"),
    param("id").isUUID(),
    body("status").isIn(["ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]),
    body("location").isObject().optional(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { status, location, notes } = req.body;

            const assignment = await prisma.assignment.update({
                where: { id: req.params.id },
                data: {
                    status,
                    currentLocation: location,
                    notes,
                    ...(status === "DELIVERED" && { deliveredAt: new Date() })
                },
                include: { shipment: true, driver: true }
            });

            // Update shipment status if relevant
            if (status === "DELIVERED") {
                await prisma.shipment.update({
                    where: { id: assignment.shipmentId },
                    data: { status: "DELIVERED" }
                });
            }

            res.json({ success: true, data: assignment });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/dispatch/assignments/:id/cancel
 * Cancel an assignment
 */
router.post(
    "/assignments/:id/cancel",
    limiters.general,
    authenticate,
    requirePermission(Permission.DISPATCH_CANCEL),
    auditAction("ASSIGNMENT_CANCELLED"),
    param("id").isUUID(),
    body("reason").isString(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const assignment = await prisma.assignment.update({
                where: { id: req.params.id },
                data: {
                    status: "CANCELLED",
                    notes: req.body.reason,
                    cancelledAt: new Date(),
                    cancelledBy: req.user.sub
                }
            });

            // Reset shipment to CREATED
            await prisma.shipment.update({
                where: { id: assignment.shipmentId },
                data: { status: "CREATED", assignedToId: null }
            });

            res.json({ success: true, data: assignment });
        } catch (error) {
            next(error);
        }
    }
);

// ==================== OPTIMIZATION ====================

/**
 * POST /api/dispatch/optimize
 * Suggest optimal assignments for pending shipments
 * Triggers dispatch agent with optimization heuristics
 */
router.post(
    "/optimize",
    limiters.general,
    authenticate,
    requirePermission(Permission.DISPATCH_CREATE),
    body("shipmentIds").isArray().optional(),
    body("algorithm").isIn(["NEAREST", "LOAD_BALANCE", "TIME_WINDOW"]).optional(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { shipmentIds, algorithm = "LOAD_BALANCE" } = req.body;

            // Get pending shipments
            const shipments = await prisma.shipment.findMany({
                where: {
                    status: "CREATED",
                    ...(shipmentIds && { id: { in: shipmentIds } })
                },
                take: 50
            });

            if (shipments.length === 0) {
                return res.json({ success: true, data: { suggestions: [] } });
            }

            // Get active drivers
            const drivers = await prisma.driver.findMany({
                where: { status: "ACTIVE" },
                include: { assignments: { where: { status: { in: ["ASSIGNED", "IN_TRANSIT"] } } } }
            });

            // Trigger optimization agent
            if (req.agentEngine) {
                await req.agentEngine.emit("dispatch.optimize", {
                    shipmentIds: shipments.map((s) => s.id),
                    driverIds: drivers.map((d) => d.id),
                    algorithm,
                    userId: req.user.sub
                });
            }

            res.json({
                success: true,
                data: {
                    optimizationTriggered: true,
                    shipmentCount: shipments.length,
                    driverCount: drivers.length,
                    algorithm
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
