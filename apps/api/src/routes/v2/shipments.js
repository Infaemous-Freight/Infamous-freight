/**
 * API v2 - Shipments Routes
 * 
 * Breaking changes from v1:
 * - Response format standardized with ApiResponse
 * - Pagination defaults changed (limit: 20 → 50)
 * - Status codes more RESTful (200 for updates → 204)
 * - Error responses include error_code field
 */

const express = require('express');
const router = express.Router();
const { getPrisma } = require('../../db/prisma');
const { ApiResponse } = require('@infamous/shared');
const { authenticate, requireScope } = require('../../middleware/security');
const { validateString, handleValidationErrors } = require('../../middleware/validation');
const { HTTP_STATUS } = require('@infamous/shared');

const prisma = getPrisma();

/**
 * @swagger
 * /api/v2/shipments:
 *   get:
 *     summary: List shipments (v2)
 *     tags: [Shipments v2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CREATED, IN_TRANSIT, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Shipments list with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Shipment'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', authenticate, requireScope('shipments:read'), async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const skip = (page - 1) * limit;

        const where = {
            userId: req.user.sub,
        };

        if (req.query.status) {
            where.status = req.query.status;
        }

        const [shipments, total] = await Promise.all([
            prisma.shipment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    driver: { select: { id: true, name: true, email: true } },
                    tracking: true,
                },
            }),
            prisma.shipment.count({ where }),
        ]);

        res.json(new ApiResponse({
            success: true,
            data: shipments,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }));
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/v2/shipments/{id}:
 *   get:
 *     summary: Get shipment by ID (v2)
 *     tags: [Shipments v2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipment details
 *       404:
 *         description: Shipment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Shipment not found
 *                 error_code:
 *                   type: string
 *                   example: SHIPMENT_NOT_FOUND
 */
router.get('/:id', authenticate, requireScope('shipments:read'), async (req, res, next) => {
    try {
        const shipment = await prisma.shipment.findUnique({
            where: { id: req.params.id },
            include: {
                user: { select: { id: true, name: true, email: true } },
                driver: { select: { id: true, name: true, phone: true } },
                tracking: {
                    include: {
                        events: {
                            orderBy: { timestamp: 'desc' },
                            take: 10,
                        },
                    },
                },
            },
        });

        if (!shipment) {
            return res.status(HTTP_STATUS.NOT_FOUND).json(new ApiResponse({
                success: false,
                error: 'Shipment not found',
                error_code: 'SHIPMENT_NOT_FOUND',
            }));
        }

        // Verify ownership
        if (shipment.userId !== req.user.sub && !req.user.scopes.includes('admin:all')) {
            return res.status(HTTP_STATUS.FORBIDDEN).json(new ApiResponse({
                success: false,
                error: 'Access denied',
                error_code: 'FORBIDDEN',
            }));
        }

        res.json(new ApiResponse({ success: true, data: shipment }));
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/v2/shipments:
 *   post:
 *     summary: Create new shipment (v2)
 *     tags: [Shipments v2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickup_address
 *               - delivery_address
 *               - weight
 *             properties:
 *               pickup_address:
 *                 type: string
 *               delivery_address:
 *                 type: string
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   length:
 *                     type: number
 *                   width:
 *                     type: number
 *                   height:
 *                     type: number
 *     responses:
 *       201:
 *         description: Shipment created successfully
 */
router.post('/',
    authenticate,
    requireScope('shipments:create'),
    [
        validateString('pickup_address', { min: 10, max: 500 }),
        validateString('delivery_address', { min: 10, max: 500 }),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const shipment = await prisma.shipment.create({
                data: {
                    userId: req.user.sub,
                    pickupAddress: req.body.pickup_address,
                    deliveryAddress: req.body.delivery_address,
                    weight: req.body.weight,
                    dimensions: req.body.dimensions,
                    status: 'CREATED',
                },
                include: {
                    tracking: true,
                },
            });

            // Emit WebSocket event
            if (global.wsManager) {
                global.wsManager.broadcast(req.user.sub, 'shipment.created', shipment);
            }

            res.status(HTTP_STATUS.CREATED).json(new ApiResponse({
                success: true,
                data: shipment,
            }));
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @swagger
 * /api/v2/shipments/{id}:
 *   patch:
 *     summary: Update shipment (v2)
 *     tags: [Shipments v2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CREATED, IN_TRANSIT, DELIVERED, CANCELLED]
 *     responses:
 *       204:
 *         description: Shipment updated (no content)
 *       404:
 *         description: Shipment not found
 */
router.patch('/:id', authenticate, requireScope('shipments:update'), async (req, res, next) => {
    try {
        const existing = await prisma.shipment.findUnique({
            where: { id: req.params.id },
        });

        if (!existing) {
            return res.status(HTTP_STATUS.NOT_FOUND).json(new ApiResponse({
                success: false,
                error: 'Shipment not found',
                error_code: 'SHIPMENT_NOT_FOUND',
            }));
        }

        if (existing.userId !== req.user.sub && !req.user.scopes.includes('admin:all')) {
            return res.status(HTTP_STATUS.FORBIDDEN).json(new ApiResponse({
                success: false,
                error: 'Access denied',
                error_code: 'FORBIDDEN',
            }));
        }

        await prisma.shipment.update({
            where: { id: req.params.id },
            data: {
                status: req.body.status,
                updatedAt: new Date(),
            },
        });

        // v2 returns 204 No Content for successful updates
        res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
