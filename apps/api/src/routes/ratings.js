/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Driver Rating & Review System
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { prisma } = require('../database');
const { authenticate, requireScope, limiters, auditLog } = require('../middleware/security');
const { handleValidationErrors } = require('../middleware/validation');
const logger = require('../lib/structuredLogging');

/**
 * POST /jobs/:jobId/rate - Shipper rates driver after delivery
 */
router.post(
    '/jobs/:jobId/rate',
    limiters.general,
    authenticate,
    requireScope('shipment:rate'),
    [
        param('jobId').isUUID().withMessage('Invalid job ID'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
        body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment too long'),
    ],
    handleValidationErrors,
    auditLog,
    async (req, res, next) => {
        try {
            const { jobId } = req.params;
            const { rating, comment } = req.body;
            const shipperId = req.user.sub;

            // Verify job exists and shipper owns it
            const job = await prisma.job.findUnique({
                where: { id: jobId },
                include: { driver: true },
            });

            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            if (job.shipperId !== shipperId) {
                return res.status(403).json({ error: 'Not authorized to rate this job' });
            }

            if (job.status !== 'COMPLETED' && job.status !== 'DELIVERED') {
                return res.status(400).json({
                    error: 'Can only rate completed deliveries',
                });
            }

            // Check if rating already exists
            const existingRating = await prisma.driverRating.findFirst({
                where: {
                    jobId,
                    ratedBy: shipperId,
                },
            });

            if (existingRating) {
                return res.status(409).json({ error: 'You have already rated this job' });
            }

            // Create rating
            const driverRating = await prisma.driverRating.create({
                data: {
                    jobId,
                    driverId: job.driverId,
                    ratedBy: shipperId,
                    rating,
                    comment: comment || null,
                },
            });

            // Update driver's average rating
            const ratings = await prisma.driverRating.findMany({
                where: { driverId: job.driverId },
                select: { rating: true },
            });

            const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

            await prisma.driverProfile.update({
                where: { userId: job.driverId },
                data: {
                    rating: parseFloat(avgRating.toFixed(2)),
                },
            });

            logger.info('Driver rated', {
                jobId,
                driverId: job.driverId,
                rating,
                shipperId,
            });

            res.status(201).json({
                success: true,
                data: driverRating,
            });
        } catch (error) {
            logger.error('Failed to create driver rating', { error: error.message });
            next(error);
        }
    }
);

/**
 * GET /drivers/:driverId/ratings - Get driver's ratings and reviews
 */
router.get(
    '/drivers/:driverId/ratings',
    limiters.general,
    [param('driverId').isUUID().withMessage('Invalid driver ID')],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { driverId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.min(100, parseInt(limit) || 20);
            const skip = (pageNum - 1) * limitNum;

            // Get driver's profile
            const driver = await prisma.driverProfile.findUnique({
                where: { userId: driverId },
                select: {
                    userId: true,
                    rating: true,
                    acceptanceRate: true,
                    completionRate: true,
                },
            });

            if (!driver) {
                return res.status(404).json({ error: 'Driver not found' });
            }

            // Get ratings with pagination
            const [ratings, total] = await Promise.all([
                prisma.driverRating.findMany({
                    where: { driverId },
                    include: {
                        job: { select: { id: true, dropoff: true, createdAt: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limitNum,
                }),
                prisma.driverRating.count({ where: { driverId } }),
            ]);

            const formattedRatings = ratings.map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                jobId: r.job.id,
                jobLocation: r.job.dropoff,
                ratedAt: r.createdAt,
            }));

            res.status(200).json({
                success: true,
                data: {
                    driver: {
                        driverId: driver.userId,
                        avgRating: driver.rating || 0,
                        ratingCount: total,
                        acceptanceRate: driver.acceptanceRate || 0,
                        completionRate: driver.completionRate || 0,
                    },
                    ratings: formattedRatings,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum),
                    },
                },
            });
        } catch (error) {
            logger.error('Failed to get driver ratings', { error: error.message });
            next(error);
        }
    }
);

/**
 * GET /drivers/stats/leaderboard - Driver leaderboard by rating
 */
router.get(
    '/drivers/stats/leaderboard',
    limiters.general,
    async (req, res, next) => {
        try {
            const { limit = 50 } = req.query;
            const limitNum = Math.min(100, parseInt(limit) || 50);

            const drivers = await prisma.driverProfile.findMany({
                select: {
                    userId: true,
                    rating: true,
                    acceptanceRate: true,
                    completionRate: true,
                    totalEarnings: true,
                },
                where: {
                    rating: { gt: 0 },
                },
                orderBy: [
                    { rating: 'desc' },
                    { acceptanceRate: 'desc' },
                    { completionRate: 'desc' },
                ],
                take: limitNum,
            });

            const leaderboard = drivers.map((driver, index) => ({
                rank: index + 1,
                driverId: driver.userId,
                rating: driver.rating || 0,
                acceptanceRate: driver.acceptanceRate || 0,
                completionRate: driver.completionRate || 0,
                earnings: (driver.totalEarnings || 0) / 100,
            }));

            res.status(200).json({
                success: true,
                data: leaderboard,
            });
        } catch (error) {
            logger.error('Failed to get leaderboard', { error: error.message });
            next(error);
        }
    }
);

/**
 * DELETE /ratings/:ratingId - Admin delete inappropriate rating
 */
router.delete(
    '/ratings/:ratingId',
    limiters.general,
    authenticate,
    requireScope('admin:ratings'),
    [param('ratingId').isUUID().withMessage('Invalid rating ID')],
    handleValidationErrors,
    auditLog,
    async (req, res, next) => {
        try {
            const { ratingId } = req.params;

            const rating = await prisma.driverRating.findUnique({
                where: { id: ratingId },
            });

            if (!rating) {
                return res.status(404).json({ error: 'Rating not found' });
            }

            await prisma.driverRating.delete({
                where: { id: ratingId },
            });

            // Recalculate driver rating
            const ratings = await prisma.driverRating.findMany({
                where: { driverId: rating.driverId },
                select: { rating: true },
            });

            const avgRating = ratings.length > 0 ?
                ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length :
                0;

            await prisma.driverProfile.update({
                where: { userId: rating.driverId },
                data: { rating: parseFloat(avgRating.toFixed(2)) },
            });

            logger.info('Rating deleted', {
                ratingId,
                driverId: rating.driverId,
                admin: req.user.sub,
            });

            res.status(200).json({
                success: true,
                message: 'Rating deleted and driver rating recalculated',
            });
        } catch (error) {
            logger.error('Failed to delete rating', { error: error.message });
            next(error);
        }
    }
);

/**
 * GET /drivers/:driverId/rating-summary - Quick rating summary for driver
 */
router.get(
    '/drivers/:driverId/rating-summary',
    limiters.general,
    [param('driverId').isUUID().withMessage('Invalid driver ID')],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { driverId } = req.params;

            const [driver, ratingDistribution] = await Promise.all([
                prisma.driverProfile.findUnique({
                    where: { userId: driverId },
                    select: { rating: true, acceptanceRate: true, completionRate: true },
                }),
                prisma.driverRating.groupBy({
                    by: ['rating'],
                    where: { driverId },
                    _count: true,
                    orderBy: { rating: 'desc' },
                }),
            ]);

            if (!driver) {
                return res.status(404).json({ error: 'Driver not found' });
            }

            const total = ratingDistribution.reduce((sum, r) => sum + r._count, 0);

            const distribution = {
                5: 0,
                4: 0,
                3: 0,
                2: 0,
                1: 0,
            };

            ratingDistribution.forEach((r) => {
                distribution[r.rating] = r._count;
            });

            res.status(200).json({
                success: true,
                data: {
                    driverId,
                    avgRating: driver.rating || 0,
                    totalRatings: total,
                    acceptanceRate: driver.acceptanceRate || 0,
                    completionRate: driver.completionRate || 0,
                    distribution,
                },
            });
        } catch (error) {
            logger.error('Failed to get rating summary', { error: error.message });
            next(error);
        }
    }
);

module.exports = router;
