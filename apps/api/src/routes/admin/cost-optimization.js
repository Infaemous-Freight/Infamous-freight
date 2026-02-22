/**
 * Cost Optimization Monitoring Routes
 * Track real-time savings and optimization performance
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope, limiters, auditLog } = require("../middleware/security");
const { getCacheStats, resetStats: resetCacheStats } = require("../middleware/cache");
const { getAllBatchStats, calculateBatchEfficiency } = require("../services/batchQueue");
const { getSendQuota } = require("../services/emailService.aws-ses");
const logger = require("../utils/logger");

/**
 * GET /api/admin/cost-optimization/dashboard
 * Get cost optimization dashboard with all metrics
 * Scope: admin:view
 */
router.get(
    "/dashboard",
    limiters.general,
    authenticate,
    requireScope("admin:view"),
    auditLog,
    async (req, res, next) => {
        try {
            // Get cache statistics
            const cacheStats = getCacheStats();

            // Get batch queue statistics
            const batchStats = getAllBatchStats();
            const batchEfficiency = calculateBatchEfficiency();

            // Get AWS SES quota
            let sesQuota = null;
            try {
                sesQuota = await getSendQuota();
            } catch (error) {
                logger.warn("Could not fetch SES quota", { error: error.message });
            }

            // Calculate estimated savings
            const estimatedSavings = {
                awsSES: {
                    monthly: 20,
                    description: "SendGrid → AWS SES migration",
                    status: sesQuota ? "active" : "inactive",
                },
                sentryOptimization: {
                    monthly: 22,
                    description: "Team plan → Developer (free) tier",
                    status: process.env.SENTRY_TRACES_SAMPLE_RATE === "0.1" ? "active" : "inactive",
                },
                bankTransfer: {
                    monthly: 50,
                    description: "Bank transfer adoption (target 20%)",
                    status: process.env.FEATURE_BANK_TRANSFER_ENABLED === "true" ? "active" : "inactive",
                },
                aiSynthetic: {
                    monthly: 12,
                    description: "95% synthetic AI mode",
                    status: process.env.FEATURE_AI_SYNTHETIC_ENHANCED === "true" ? "active" : "inactive",
                },
                apiCaching: {
                    monthly: 35,
                    description: `Redis caching (${cacheStats.hitRate} hit rate)`,
                    status: cacheStats.connected ? "active" : "inactive",
                    actual: cacheStats.hitRate,
                    target: "40-60%",
                },
                batchQueue: {
                    monthly: 30,
                    description: `Request batching (${batchEfficiency.efficiency} efficiency)`,
                    status: process.env.BATCH_QUEUE_ENABLED === "true" ? "active" : "inactive",
                    actual: batchEfficiency.efficiency,
                    target: "10:1",
                },
                stripeNegotiation: {
                    monthly: 20,
                    description: "Volume discount negotiation",
                    status:
                        process.env.STRIPE_RATE_PERCENTAGE === "0.027" ? "negotiated" : "pending negotiation",
                },
            };

            // Calculate total savings
            const totalSavings = Object.values(estimatedSavings).reduce((sum, opt) => {
                return opt.status === "active" || opt.status === "negotiated"
                    ? sum + opt.monthly
                    : sum;
            }, 0);

            // Calculate original vs optimized costs
            const costs = {
                original: {
                    monthly: 2427,
                    annual: 29124,
                },
                optimized: {
                    monthly: 2427 - totalSavings,
                    annual: (2427 - totalSavings) * 12,
                },
                savings: {
                    monthly: totalSavings,
                    annual: totalSavings * 12,
                    percentage: ((totalSavings / 2427) * 100).toFixed(1),
                },
            };

            res.status(200).json({
                success: true,
                data: {
                    timestamp: new Date().toISOString(),
                    costs,
                    optimizations: estimatedSavings,
                    metrics: {
                        cache: cacheStats,
                        batching: {
                            ...batchStats,
                            efficiency: batchEfficiency,
                        },
                        email: sesQuota,
                    },
                    recommendations: generateRecommendations(estimatedSavings, cacheStats, batchStats),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/admin/cost-optimization/cache/stats
 * Get detailed cache statistics
 * Scope: admin:view
 */
router.get(
    "/cache/stats",
    limiters.general,
    authenticate,
    requireScope("admin:view"),
    auditLog,
    async (req, res, next) => {
        try {
            const stats = getCacheStats();

            res.status(200).json({
                success: true,
                data: {
                    ...stats,
                    monthlySavings: 35, // Estimated based on 40% hit rate
                    target: {
                        hitRate: "40-60%",
                        status: parseFloat(stats.hitRate) >= 40 ? "on-track" : "below-target",
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/admin/cost-optimization/cache/reset
 * Reset cache statistics
 * Scope: admin:manage
 */
router.post(
    "/cache/reset",
    limiters.general,
    authenticate,
    requireScope("admin:manage"),
    auditLog,
    async (req, res, next) => {
        try {
            resetCacheStats();

            res.status(200).json({
                success: true,
                message: "Cache statistics reset",
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/admin/cost-optimization/batch/stats
 * Get detailed batch queue statistics
 * Scope: admin:view
 */
router.get(
    "/batch/stats",
    limiters.general,
    authenticate,
    requireScope("admin:view"),
    auditLog,
    async (req, res, next) => {
        try {
            const stats = getAllBatchStats();
            const efficiency = calculateBatchEfficiency();

            res.status(200).json({
                success: true,
                data: {
                    queues: stats,
                    efficiency,
                    monthlySavings: 30, // Estimated based on 80% efficiency
                    target: {
                        efficiency: "10:1",
                        status: parseFloat(efficiency.avgBatchSize) >= 8 ? "on-track" : "below-target",
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/admin/cost-optimization/email/quota
 * Get AWS SES sending quota and usage
 * Scope: admin:view
 */
router.get(
    "/email/quota",
    limiters.general,
    authenticate,
    requireScope("admin:view"),
    auditLog,
    async (req, res, next) => {
        try {
            const quota = await getSendQuota();

            res.status(200).json({
                success: true,
                data: {
                    ...quota,
                    monthlySavings: 20,
                    freeHier: {
                        limit: 62000,
                        used: quota.sentLast24Hours,
                        remaining: quota.remaining,
                        percentUsed: ((quota.sentLast24Hours / 62000) * 100).toFixed(1),
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/admin/cost-optimization/recommendations
 * Get optimization recommendations
 * Scope: admin:view
 */
router.get(
    "/recommendations",
    limiters.general,
    authenticate,
    requireScope("admin:view"),
    auditLog,
    async (req, res, next) => {
        try {
            const cacheStats = getCacheStats();
            const batchStats = getAllBatchStats();

            const recommendations = generateRecommendations({}, cacheStats, batchStats);

            res.status(200).json({
                success: true,
                data: {
                    recommendations,
                    priorityActions: recommendations.filter((r) => r.priority === "high"),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Generate optimization recommendations
 * @param {Object} optimizations - Current optimizations
 * @param {Object} cacheStats - Cache statistics
 * @param {Object} batchStats - Batch statistics
 * @returns {Array} Recommendations
 */
function generateRecommendations(optimizations, cacheStats, batchStats) {
    const recommendations = [];

    // Cache hit rate recommendation
    const hitRate = parseFloat(cacheStats.hitRate);
    if (hitRate < 40) {
        recommendations.push({
            priority: "high",
            category: "caching",
            title: "Increase cache hit rate",
            description: `Current hit rate is ${cacheStats.hitRate}, target is 40-60%`,
            action: "Review cache TTL configuration and increase for stable endpoints",
            potentialSavings: "$15-20/month",
        });
    }

    // Batch efficiency recommendation
    const avgBatchSize = (batchStats.mapbox?.batchSize + batchStats.ai?.batchSize + batchStats.weather?.batchSize) / 3 || 0;
    if (avgBatchSize < 8) {
        recommendations.push({
            priority: "medium",
            category: "batching",
            title: "Increase batch size",
            description: `Current avg batch size is ${avgBatchSize.toFixed(1)}, target is 10`,
            action: "Increase flush interval or batch size limits",
            potentialSavings: "$5-10/month",
        });
    }

    // AWS SES recommendation
    if (!process.env.AWS_SES_ACCESS_KEY) {
        recommendations.push({
            priority: "high",
            category: "email",
            title: "Migrate to AWS SES",
            description: "Still using SendGrid - migrate to AWS SES for free tier",
            action: "Configure AWS SES credentials and test email delivery",
            potentialSavings: "$20/month",
        });
    }

    // Bank transfer recommendation
    if (process.env.FEATURE_BANK_TRANSFER_ENABLED !== "true") {
        recommendations.push({
            priority: "high",
            category: "payments",
            title: "Enable bank transfers",
            description: "Bank transfers have 0% fees vs 2.9% for cards",
            action: "Configure Plaid and enable bank transfer feature",
            potentialSavings: "$50/month (at 20% adoption)",
        });
    }

    // Sentry optimization recommendation
    if (process.env.SENTRY_TRACES_SAMPLE_RATE !== "0.1") {
        recommendations.push({
            priority: "medium",
            category: "monitoring",
            title: "Optimize Sentry sampling",
            description: "Reduce traces sample rate to 10% to stay within free tier",
            action: "Set SENTRY_TRACES_SAMPLE_RATE=0.1 in environment",
            potentialSavings: "$22/month",
        });
    }

    // Stripe negotiation recommendation
    if (process.env.STRIPE_RATE_PERCENTAGE !== "0.027") {
        recommendations.push({
            priority: "medium",
            category: "payments",
            title: "Negotiate Stripe volume discount",
            description: "Request lower rate based on $600K annual volume",
            action: "Contact Stripe sales team with volume data",
            potentialSavings: "$20/month",
        });
    }

    return recommendations;
}

module.exports = router;
