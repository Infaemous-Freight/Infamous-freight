const express = require('express');
const { prisma } = require('../db/prisma');
const { limiters, authenticate, requireScope, auditLog } = require('../middleware/security');
const { validateString, handleValidationErrors } = require('../middleware/validation');
const { HTTP_STATUS, ApiResponse } = require('@infamous-freight/shared');

const router = express.Router();

/**
 * GET /api/copilot/progress/:driverId
 * Get AI copilot progress tracking for a specific driver
 * Scope: copilot:read
 */
router.get(
  '/copilot/progress/:driverId',
  limiters.general,
  authenticate,
  requireScope('copilot:read'),
  auditLog,
  async (req, res, next) => {
    try {
      const { driverId } = req.params;

      // Get the latest progress record for the driver
      const progress = await prisma.copilotProgress.findFirst({
        where: { driverId },
        orderBy: { updatedAt: 'desc' },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      if (!progress) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(
            new ApiResponse({
              success: false,
              error: 'No progress tracking found for this driver',
            })
          );
      }

      // Parse JSON fields with error handling
      let progressData;
      try {
        progressData = {
          ...progress,
          progressDetails: progress.progressDetails ? JSON.parse(progress.progressDetails) : null,
          milestones: progress.milestones ? JSON.parse(progress.milestones) : null,
        };
      } catch (parseError) {
        return res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .json(
            new ApiResponse({
              success: false,
              error: 'Failed to parse progress data',
            })
          );
      }

      res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse({ success: true, data: progressData }));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/copilot/progress/:driverId/history
 * Get AI copilot progress history for a specific driver
 * Scope: copilot:read
 */
router.get(
  '/copilot/progress/:driverId/history',
  limiters.general,
  authenticate,
  requireScope('copilot:read'),
  auditLog,
  async (req, res, next) => {
    try {
      const { driverId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      const history = await prisma.copilotProgress.findMany({
        where: { driverId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit), 100),
        skip: Number(offset),
      });

      // Parse JSON fields for each record with error handling
      let historyData;
      try {
        historyData = history.map((record) => ({
          ...record,
          progressDetails: record.progressDetails ? JSON.parse(record.progressDetails) : null,
          milestones: record.milestones ? JSON.parse(record.milestones) : null,
        }));
      } catch (parseError) {
        return res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .json(
            new ApiResponse({
              success: false,
              error: 'Failed to parse progress history data',
            })
          );
      }

      res
        .status(HTTP_STATUS.OK)
        .json(
          new ApiResponse({
            success: true,
            data: historyData,
            count: historyData.length,
          })
        );
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/copilot/progress
 * Create or update AI copilot progress tracking
 * Scope: copilot:write
 */
router.post(
  '/copilot/progress',
  limiters.general,
  authenticate,
  requireScope('copilot:write'),
  auditLog,
  validateString('driverId'),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        driverId,
        overallProgressScore,
        goalsCompleted,
        goalsTotal,
        improvementRate,
        consistencyScore,
        activeRecommendations,
        completedRecommendations,
        progressDetails,
        milestones,
        engagementScore,
        lastInteraction,
        confidenceLevel,
        effectivenessScore,
        coachingNotes,
        performancePeriodId,
      } = req.body;

      // Verify driver exists
      const driver = await prisma.user.findUnique({
        where: { id: driverId },
      });

      if (!driver) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(
            new ApiResponse({
              success: false,
              error: 'Driver not found',
            })
          );
      }

      // Create new progress record
      const progress = await prisma.copilotProgress.create({
        data: {
          driverId,
          overallProgressScore: overallProgressScore || 0,
          goalsCompleted: goalsCompleted || 0,
          goalsTotal: goalsTotal || 0,
          improvementRate: improvementRate || 0,
          consistencyScore: consistencyScore || 0,
          activeRecommendations: activeRecommendations || 0,
          completedRecommendations: completedRecommendations || 0,
          progressDetails: progressDetails ? JSON.stringify(progressDetails) : null,
          milestones: milestones ? JSON.stringify(milestones) : null,
          engagementScore: engagementScore || 0,
          lastInteraction: lastInteraction ? new Date(lastInteraction) : null,
          confidenceLevel: confidenceLevel || 85,
          effectivenessScore: effectivenessScore || 0,
          coachingNotes,
          performancePeriodId,
        },
      });

      res
        .status(HTTP_STATUS.CREATED)
        .json(new ApiResponse({ success: true, data: progress }));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/copilot/progress/:progressId
 * Update AI copilot progress tracking
 * Scope: copilot:write
 */
router.patch(
  '/copilot/progress/:progressId',
  limiters.general,
  authenticate,
  requireScope('copilot:write'),
  auditLog,
  async (req, res, next) => {
    try {
      const { progressId } = req.params;
      const updateData = { ...req.body };

      // Handle JSON fields
      if (updateData.progressDetails) {
        updateData.progressDetails = JSON.stringify(updateData.progressDetails);
      }
      if (updateData.milestones) {
        updateData.milestones = JSON.stringify(updateData.milestones);
      }
      if (updateData.lastInteraction) {
        updateData.lastInteraction = new Date(updateData.lastInteraction);
      }

      // Remove fields that shouldn't be updated directly
      delete updateData.driverId;
      delete updateData.createdAt;
      delete updateData.id;

      const progress = await prisma.copilotProgress.update({
        where: { id: progressId },
        data: updateData,
      });

      res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse({ success: true, data: progress }));
    } catch (err) {
      if (err.code === 'P2025') {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(
            new ApiResponse({
              success: false,
              error: 'Progress record not found',
            })
          );
      }
      next(err);
    }
  }
);

/**
 * GET /api/copilot/stats
 * Get overall AI copilot statistics across all drivers
 * Scope: copilot:admin
 */
router.get(
  '/copilot/stats',
  limiters.general,
  authenticate,
  requireScope('copilot:admin'),
  auditLog,
  async (req, res, next) => {
    try {
      // Get aggregated statistics
      const totalDrivers = await prisma.copilotProgress.groupBy({
        by: ['driverId'],
        _count: true,
      });

      const avgProgress = await prisma.copilotProgress.aggregate({
        _avg: {
          overallProgressScore: true,
          improvementRate: true,
          consistencyScore: true,
          engagementScore: true,
          effectivenessScore: true,
        },
        _sum: {
          goalsCompleted: true,
          goalsTotal: true,
          activeRecommendations: true,
          completedRecommendations: true,
        },
      });

      const stats = {
        totalDriversTracked: totalDrivers.length,
        averageProgressScore: avgProgress._avg.overallProgressScore || 0,
        averageImprovementRate: avgProgress._avg.improvementRate || 0,
        averageConsistencyScore: avgProgress._avg.consistencyScore || 0,
        averageEngagementScore: avgProgress._avg.engagementScore || 0,
        averageEffectivenessScore: avgProgress._avg.effectivenessScore || 0,
        totalGoalsCompleted: avgProgress._sum.goalsCompleted || 0,
        totalGoalsActive: avgProgress._sum.goalsTotal || 0,
        totalActiveRecommendations: avgProgress._sum.activeRecommendations || 0,
        totalCompletedRecommendations: avgProgress._sum.completedRecommendations || 0,
      };

      res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse({ success: true, data: stats }));
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
