/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Logistics Management API Routes
 */

const express = require('express');
const router = express.Router();
const { LogisticsService } = require('../services/logisticsService');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireScope, limiters, auditLog } = require('../middleware/security');
const { body, param, query, validationResult } = require('express-validator');
const { validateString, handleValidationErrors } = require('../middleware/validation');

const prisma = new PrismaClient();
const logisticsService = new LogisticsService(prisma);

// ==================== SHIPMENT MANAGEMENT ROUTES ====================

/**
 * POST /api/logistics/shipments
 * Create a new shipment with automatic routing and assignment
 */
router.post(
    '/shipments',
    limiters.general,
    authenticate,
    requireScope('logistics:create'),
    [
        body('customerId').isString().notEmpty(),
        body('origin').isObject(),
        body('origin.address').isString().notEmpty(),
        body('origin.lat').isFloat({ min: -90, max: 90 }),
        body('origin.lng').isFloat({ min: -180, max: 180 }),
        body('destination').isObject(),
        body('destination.address').isString().notEmpty(),
        body('destination.lat').isFloat({ min: -90, max: 90 }),
        body('destination.lng').isFloat({ min: -180, max: 180 }),
        body('cargo').isObject(),
        body('cargo.type').isString().notEmpty(),
        body('cargo.weight').isFloat({ min: 0 }),
        body('cargo.volume').optional().isFloat({ min: 0 }),
        body('priority').optional().isIn(['low', 'standard', 'high', 'urgent']),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const result = await logisticsService.createShipment(req.body);
            res.status(201).json({
                success: true,
                data: result,
                message: 'Shipment created successfully',
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/logistics/shipments/track/:trackingNumber
 * Track shipment in real-time
 */
router.get(
    '/shipments/track/:trackingNumber',
    limiters.general,
    [
        param('trackingNumber').isString().notEmpty(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const tracking = await logisticsService.trackShipment(req.params.trackingNumber);
            res.json({
                success: true,
                data: tracking,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PUT /api/logistics/shipments/:id/status
 * Update shipment status with notifications
 */
router.put(
    '/shipments/:id/status',
    limiters.general,
    authenticate,
    requireScope('logistics:update'),
    auditLog,
    [
        param('id').isString().notEmpty(),
        body('status').isIn([
            'pending',
            'assigned',
            'picked_up',
            'in_transit',
            'out_for_delivery',
            'delivered',
            'delayed',
            'cancelled',
        ]),
        body('location').optional().isObject(),
        body('notes').optional().isString(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { status, location, notes } = req.body;
            const shipment = await logisticsService.updateShipmentStatus(
                req.params.id,
                status,
                location,
                notes
            );
            res.json({
                success: true,
                data: shipment,
                message: `Shipment status updated to ${status}`,
            });
        } catch (error) {
            next(error);
        }
    }
);

// ==================== WAREHOUSE MANAGEMENT ROUTES ====================

/**
 * GET /api/logistics/warehouses/:id/status
 * Get comprehensive warehouse status and metrics
 */
router.get(
    '/warehouses/:id/status',
    limiters.general,
    authenticate,
    requireScope('logistics:view'),
    [
        param('id').isString().notEmpty(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const status = await logisticsService.getWarehouseStatus(req.params.id);
            res.json({
                success: true,
                data: status,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/logistics/warehouses/receive
 * Receive incoming goods at warehouse
 */
router.post(
    '/warehouses/receive',
    limiters.general,
    authenticate,
    requireScope('logistics:warehouse'),
    auditLog,
    [
        body('warehouseId').isString().notEmpty(),
        body('shipmentId').optional().isString(),
        body('items').isArray().notEmpty(),
        body('items.*.productId').isString().notEmpty(),
        body('items.*.quantity').isInt({ min: 1 }),
        body('items.*.unitValue').optional().isFloat({ min: 0 }),
        body('receivedBy').isString().notEmpty(),
        body('condition').optional().isIn(['good', 'damaged', 'partial']),
        body('notes').optional().isString(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const result = await logisticsService.receiveGoods(req.body);
            res.status(201).json({
                success: true,
                data: result,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/logistics/warehouses/pick
 * Pick items for outbound shipment
 */
router.post(
    '/warehouses/pick',
    limiters.general,
    authenticate,
    requireScope('logistics:warehouse'),
    auditLog,
    [
        body('warehouseId').isString().notEmpty(),
        body('orderId').isString().notEmpty(),
        body('items').isArray().notEmpty(),
        body('items.*.productId').isString().notEmpty(),
        body('items.*.quantity').isInt({ min: 1 }),
        body('pickerId').isString().notEmpty(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const result = await logisticsService.pickItems(req.body);
            res.status(201).json({
                success: true,
                data: result,
                message: 'Pick list created successfully',
            });
        } catch (error) {
            next(error);
        }
    }
);

// ==================== INVENTORY MANAGEMENT ROUTES ====================

/**
 * GET /api/logistics/inventory
 * Get comprehensive inventory report with analytics
 */
router.get(
    '/inventory',
    limiters.general,
    authenticate,
    requireScope('logistics:view'),
    [
        query('warehouseId').optional().isString(),
        query('productId').optional().isString(),
        query('lowStock').optional().isBoolean(),
        query('category').optional().isString(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const report = await logisticsService.getInventoryReport(req.query);
            res.json({
                success: true,
                data: report,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/logistics/inventory/transfer
 * Transfer inventory between warehouses
 */
router.post(
    '/inventory/transfer',
    limiters.general,
    authenticate,
    requireScope('logistics:warehouse'),
    auditLog,
    [
        body('productId').isString().notEmpty(),
        body('fromWarehouseId').isString().notEmpty(),
        body('toWarehouseId').isString().notEmpty(),
        body('quantity').isInt({ min: 1 }),
        body('reason').optional().isString(),
        body('requestedBy').isString().notEmpty(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const result = await logisticsService.transferInventory(req.body);
            res.status(201).json({
                success: true,
                data: result,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/logistics/inventory/cycle-count
 * Perform inventory cycle count
 */
router.post(
    '/inventory/cycle-count',
    limiters.general,
    authenticate,
    requireScope('logistics:warehouse'),
    auditLog,
    [
        body('warehouseId').isString().notEmpty(),
        body('zone').optional().isString(),
        body('items').isArray().notEmpty(),
        body('items.*.productId').isString().notEmpty(),
        body('items.*.countedQuantity').isInt({ min: 0 }),
        body('countedBy').isString().notEmpty(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const result = await logisticsService.cycleCount(req.body);
            res.status(201).json({
                success: true,
                data: result,
                message: `Cycle count completed with ${result.accuracy.toFixed(1)}% accuracy`,
            });
        } catch (error) {
            next(error);
        }
    }
);

// ==================== FLEET MANAGEMENT ROUTES ====================

/**
 * GET /api/logistics/fleet/status
 * Get fleet status and analytics
 */
router.get(
    '/fleet/status',
    limiters.general,
    authenticate,
    requireScope('logistics:view'),
    async (req, res, next) => {
        try {
            const status = await logisticsService.getFleetStatus();
            res.json({
                success: true,
                data: status,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/logistics/fleet/maintenance
 * Schedule vehicle maintenance
 */
router.post(
    '/fleet/maintenance',
    limiters.general,
    authenticate,
    requireScope('logistics:fleet'),
    auditLog,
    [
        body('vehicleId').isString().notEmpty(),
        body('maintenanceType').isIn([
            'routine',
            'repair',
            'inspection',
            'tire_change',
            'oil_change',
            'brake_service',
        ]),
        body('scheduledDate').isISO8601(),
        body('description').isString().notEmpty(),
        body('estimatedCost').optional().isFloat({ min: 0 }),
        body('priority').optional().isIn(['routine', 'high', 'critical']),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const maintenance = await logisticsService.scheduleMaintenance(req.body);
            res.status(201).json({
                success: true,
                data: maintenance,
                message: 'Maintenance scheduled successfully',
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/logistics/fleet/optimize
 * Optimize fleet deployment for pending shipments
 */
router.post(
    '/fleet/optimize',
    limiters.general,
    authenticate,
    requireScope('logistics:fleet'),
    [
        body('shipments').isArray().notEmpty(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const result = await logisticsService.optimizeFleetDeployment(req.body.shipments);
            res.json({
                success: true,
                data: result,
                message: `Optimized deployment for ${result.assignments.length} shipments`,
            });
        } catch (error) {
            next(error);
        }
    }
);

// ==================== LOAD OPTIMIZATION ROUTES ====================

/**
 * POST /api/logistics/load/consolidate
 * Optimize load consolidation for multiple shipments
 */
router.post(
    '/load/consolidate',
    limiters.general,
    authenticate,
    requireScope('logistics:optimize'),
    [
        body('shipments').isArray().notEmpty(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const result = await logisticsService.optimizeLoadConsolidation(req.body.shipments);
            res.json({
                success: true,
                data: result,
                message: `Identified $${result.totalSavings.toFixed(2)} in potential savings`,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/logistics/load/distribute
 * Calculate optimal load distribution across vehicles
 */
router.post(
    '/load/distribute',
    limiters.general,
    authenticate,
    requireScope('logistics:optimize'),
    [
        body('items').isArray().notEmpty(),
        body('items.*.weight').isFloat({ min: 0 }),
        body('vehicleCapacity').isFloat({ min: 0 }),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const result = logisticsService.calculateLoadDistribution(
                req.body.items,
                req.body.vehicleCapacity
            );
            res.json({
                success: true,
                data: result,
                message: `Load distributed across ${result.vehiclesNeeded} vehicle(s)`,
            });
        } catch (error) {
            next(error);
        }
    }
);

// ==================== SUPPLY CHAIN ANALYTICS ROUTES ====================

/**
 * GET /api/logistics/analytics
 * Get comprehensive supply chain analytics
 */
router.get(
    '/analytics',
    limiters.general,
    authenticate,
    requireScope('logistics:view'),
    [
        query('timeRange').optional().isInt({ min: 1, max: 365 }),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const timeRange = parseInt(req.query.timeRange) || 30;
            const analytics = await logisticsService.getSupplyChainAnalytics(timeRange);
            res.json({
                success: true,
                data: analytics,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/logistics/health
 * Health check endpoint for logistics service
 */
router.get('/health', async (req, res) => {
    res.json({
        status: 'healthy',
        service: 'logistics',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
