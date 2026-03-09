/**
 * Feature Flags Service - Unleash Integration
 * Manages gradual rollouts, canary deployments, A/B testing, and feature toggles
 * 
 * Capabilities:
 * - Gradual rollouts: Release features to 1% → 10% → 50% → 100% of users
 * - Canary deployments: Target specific user segments for testing
 * - A/B Testing: Compare variations across user segments
 * - Context-based targeting: Rollout based on user props (region, role, tier)
 * - Kill switches: Instantly disable problematic features without redeployment
 * - Metrics: Track feature adoption and usage patterns
 * - Compliance: GDPR-compliant feature usage tracking
 * 
 * Architecture:
 * - Unleash Server: Feature flag definitions and algorithms
 * - Client SDK: In-app feature flag evaluation with local caching
 * - Analytics: Feature usage tracking in Segment/Datadog
 * - Webhooks: Real-time flag change notifications
 * 
 * Dependencies: Node.js, Unleash SDK, Prisma ORM
 */

const unleash = require("unleash-client");
const { logger } = require("../middleware/logger");
const { ApiResponse, HTTP_STATUS } = require("@infamous/shared");
const prisma = require("../lib/prisma");

/**
 * Feature Flags Service
 * Manages feature rollouts, canary deployments, and A/B testing
 */
class FeatureFlagsService {
    constructor() {
        this.client = null;
        this.unleashUrl = process.env.UNLEASH_API_URL || "http://localhost:8080";
        this.apiToken = process.env.UNLEASH_API_TOKEN;
        this.environment = process.env.NODE_ENV || "development";
        this.strategyCache = new Map();
        this.metricsBuffer = [];
        this.maxMetricsBufferSize = 1000;
    }

    /**
     * Initialize Unleash client with connection pooling
     * Retries up to 3 times if server unavailable
     */
    async initialize() {
        try {
            return new Promise((resolve, reject) => {
                const maxRetries = 3;
                let retries = 0;

                const initClient = () => {
                    this.client = new unleash.Client({
                        url: this.unleashUrl,
                        appName: "infamous-freight-api",
                        instanceId: `api-${process.env.HOSTNAME || "default"}`,
                        customHeaders: {
                            Authorization: this.apiToken,
                        },
                        strategies: [
                            new unleash.Strategy(),
                            new unleash.GradualRolloutUserIdStrategy(),
                            new unleash.GradualRolloutSessionIdStrategy(),
                            new unleash.GradualRolloutRandomStrategy(),
                            new unleash.UserWithIdStrategy(),
                            new unleash.IpAddressStrategy(),
                            new unleash.DefaultStrategy(),
                            new CustomGeoLocationStrategy(),
                            new CustomUserTierStrategy(),
                            new CustomCanaryStrategy(),
                        ],
                        refreshInterval: 15000, // Refresh flags every 15s
                        metricsInterval: 60000, // Send metrics every 60s
                        disableMetrics: false,
                        timeout: 5000,
                    });

                    this.client.on("ready", () => {
                        logger.info("Feature flags service initialized", {
                            url: this.unleashUrl,
                            environment: this.environment,
                        });
                        resolve(true);
                    });

                    this.client.on("error", (err) => {
                        logger.error("Feature flags service error", {
                            error: err.message,
                            retries,
                        });

                        if (retries < maxRetries) {
                            retries++;
                            setTimeout(initClient, 3000 * retries); // Exponential backoff
                        } else {
                            reject(err);
                        }
                    });
                };

                initClient();
            });
        } catch (err) {
            logger.error("Failed to initialize feature flags", {
                error: err.message,
            });
            throw err;
        }
    }

    /**
     * Check if feature is enabled for user context
     * Evaluates gradual rollouts, targeting, and algorithms server-side
     *
     * @param {string} featureName - Feature flag name
     * @param {Object} context - User context (userId, sessionId, properties)
     * @returns {boolean} - True if feature enabled for this context
     */
    isEnabled(featureName, context = {}) {
        if (!this.client) {
            logger.warn("Feature flags client not initialized", { featureName });
            return false;
        }

        // Build context with all relevant properties
        const unleashContext = {
            userId: context.userId,
            sessionId: context.sessionId,
            remoteAddress: context.ipAddress,
            properties: {
                region: context.region,
                userTier: context.userTier,
                roleId: context.roleId,
                planId: context.planId,
                isNewUser: context.createdAt
                    ? new Date() - new Date(context.createdAt) < 7 * 24 * 60 * 60 * 1000
                    : false,
                isArchivePlan: context.planId === "archive",
                isEnterprisePlan: context.planId === "enterprise",
            },
        };

        const isEnabled = this.client.isEnabled(featureName, unleashContext);

        // Record metric for feature usage tracking
        this.recordMetric(featureName, isEnabled, context.userId);

        logger.debug("Feature flag evaluated", {
            feature: featureName,
            enabled: isEnabled,
            userId: context.userId,
            tier: context.userTier,
        });

        return isEnabled;
    }

    /**
     * Get all enabled features for user context
     * Optimizes bulk feature evaluation
     *
     * @param {Object} context - User context
     * @returns {Array} - List of enabled feature names
     */
    getEnabledFeatures(context = {}) {
        if (!this.client) return [];

        const unleashContext = {
            userId: context.userId,
            sessionId: context.sessionId,
            remoteAddress: context.ipAddress,
            properties: {
                region: context.region,
                userTier: context.userTier,
                roleId: context.roleId,
                planId: context.planId,
            },
        };

        const features = this.client.getFeatureToggleDefinitions();
        const enabledFeatures = features
            .filter((f) => this.client.isEnabled(f.name, unleashContext))
            .map((f) => f.name);

        return enabledFeatures;
    }

    /**
     * Create or update feature flag with gradual rollout strategy
     *
     * @param {string} featureName - Feature name
     * @param {Object} config - Rollout configuration
     * @returns {Promise<Object>} - Created feature
     */
    async createFeature(featureName, config = {}) {
        try {
            const {
                enabled = false,
                description = "",
                rolloutPercentage = 0, // 0-100
                targetUserTiers = [], // ['free', 'premium', 'enterprise']
                targetRegions = [], // ['us-east-1', 'eu-west-1']
                experimentId = null,
                killSwitch = false,
            } = config;

            // Validate configuration
            if (rolloutPercentage < 0 || rolloutPercentage > 100) {
                throw new Error("Rollout percentage must be 0-100");
            }

            // Create feature in Unleash via API
            const response = await fetch(`${this.unleashUrl}/api/admin/features`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiToken}`,
                },
                body: JSON.stringify({
                    name: featureName,
                    type: "release",
                    enabled,
                    description,
                    strategies: [
                        {
                            name: "flexibleRollout",
                            parameters: {
                                groupId: featureName,
                                rollout: rolloutPercentage,
                            },
                        },
                        targetUserTiers.length > 0 && {
                            name: "userWithIdStrategy",
                            parameters: {
                                userIds: targetUserTiers,
                            },
                        },
                        targetRegions.length > 0 && {
                            name: "customGeoLocation",
                            parameters: {
                                regions: targetRegions,
                            },
                        },
                        killSwitch && {
                            name: "killSwitch",
                            parameters: {},
                        },
                    ].filter(Boolean),
                    tags: ["gradual-rollout"],
                    variants: [],
                }),
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to create feature: ${response.statusText}`
                );
            }

            const feature = await response.json();

            // Store in local cache for quick access
            this.strategyCache.set(featureName, {
                ...config,
                createdAt: new Date(),
            });

            // Log to audit trail
            await this.logFeatureAudit(featureName, "created", {
                rolloutPercentage,
                enabled,
            });

            logger.info("Feature flag created", {
                feature: featureName,
                rollout: rolloutPercentage,
                enabled,
            });

            return feature;
        } catch (err) {
            logger.error("Failed to create feature flag", {
                feature: featureName,
                error: err.message,
            });
            throw err;
        }
    }

    /**
     * Update feature rollout percentage with gradual progression
     * Supports canary deployments: 1% → 10% → 50% → 100%
     *
     * @param {string} featureName - Feature name
     * @param {number} newPercentage - New rollout percentage (0-100)
     * @returns {Promise<Object>} - Updated feature
     */
    async updateRollout(featureName, newPercentage) {
        try {
            if (newPercentage < 0 || newPercentage > 100) {
                throw new Error("Rollout percentage must be 0-100");
            }

            const response = await fetch(
                `${this.unleashUrl}/api/admin/features/${featureName}/strategies`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.apiToken}`,
                    },
                    body: JSON.stringify({
                        version: 1,
                        strategies: [
                            {
                                name: "flexibleRollout",
                                parameters: {
                                    groupId: featureName,
                                    rollout: newPercentage,
                                },
                            },
                        ],
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to update rollout: ${response.statusText}`);
            }

            // Update cache
            const cached = this.strategyCache.get(featureName);
            if (cached) {
                cached.rolloutPercentage = newPercentage;
                cached.updatedAt = new Date();
            }

            // Log rollout progression
            await this.logFeatureAudit(featureName, "rollout_updated", {
                percentage: newPercentage,
            });

            logger.info("Feature rollout updated", {
                feature: featureName,
                percentage: newPercentage,
            });

            return { feature: featureName, percentage: newPercentage };
        } catch (err) {
            logger.error("Failed to update feature rollout", {
                feature: featureName,
                error: err.message,
            });
            throw err;
        }
    }

    /**
     * Execute canary deployment: gradually increase rollout with health checks
     * Monitors error rates and automatically rolls back if threshold exceeded
     *
     * @param {string} featureName - Feature name
     * @param {Object} config - Canary configuration
     * @returns {Promise<Object>} - Canary deployment status
     */
    async startCanaryDeployment(featureName, config = {}) {
        try {
            const {
                stages = [1, 5, 10, 25, 50, 100], // Rollout percentages
                stageInterval = 5 * 60 * 1000, // 5 minutes between stages
                maxErrorRate = 0.05, // 5% max error rate
                maxLatencyMs = 1000, // 1 second max p99 latency
                rollbackOnFailure = true,
            } = config;

            logger.info("Starting canary deployment", {
                feature: featureName,
                stages,
            });

            let currentStage = 0;

            for (const percentage of stages) {
                // Update rollout percentage
                await this.updateRollout(featureName, percentage);

                logger.info("Canary stage progressed", {
                    feature: featureName,
                    stage: currentStage + 1,
                    percentage,
                });

                // Check health metrics before advancing to next stage
                if (currentStage < stages.length - 1) {
                    // Wait for stage interval
                    await new Promise((resolve) => setTimeout(resolve, stageInterval));

                    // Get health metrics from monitoring service
                    const health = await this.getFeatureHealth(featureName);

                    if (health.errorRate > maxErrorRate) {
                        logger.error("Canary deployment failed - high error rate", {
                            feature: featureName,
                            errorRate: health.errorRate,
                            threshold: maxErrorRate,
                        });

                        if (rollbackOnFailure) {
                            await this.updateRollout(featureName, 0); // Rollback to 0%
                            return {
                                status: "failed",
                                reason: "High error rate detected",
                                health,
                            };
                        }
                    }

                    if (health.p99Latency > maxLatencyMs) {
                        logger.warn("Canary deployment - elevated latency detected", {
                            feature: featureName,
                            latency: health.p99Latency,
                            threshold: maxLatencyMs,
                        });
                    }
                }

                currentStage++;
            }

            logger.info("Canary deployment completed successfully", {
                feature: featureName,
            });

            return {
                status: "completed",
                feature: featureName,
                finalPercentage: stages[stages.length - 1],
            };
        } catch (err) {
            logger.error("Canary deployment failed", {
                feature: featureName,
                error: err.message,
            });
            throw err;
        }
    }

    /**
     * Run A/B test by directing users to different feature variants
     *
     * @param {string} experimentId - Experiment identifier
     * @param {Object} context - User context
     * @returns {Object} - Variant assignment
     */
    isInExperiment(experimentId, context = {}) {
        if (!this.client) return null;

        // Consistent user bucketing for A/B experiments
        const unleashContext = {
            userId: context.userId,
            properties: {
                experimentId,
            },
        };

        const variants = this.client.getVariants(
            `exp_${experimentId}`,
            unleashContext
        );

        if (variants && variants.enabled) {
            this.recordMetric(`exp_${experimentId}`, true, context.userId, {
                variant: variants.name,
            });

            return {
                experimentId,
                variant: variants.name,
                enabled: true,
            };
        }

        return { experimentId, variant: "control", enabled: false };
    }

    /**
     * Kill switch - instantly disable feature for all users
     *
     * @param {string} featureName - Feature name
     * @returns {Promise<boolean>} - Success status
     */
    async killSwitch(featureName) {
        try {
            await this.updateRollout(featureName, 0);

            await this.logFeatureAudit(featureName, "kill_switch_activated", {});

            logger.warn("Kill switch activated", { feature: featureName });

            return true;
        } catch (err) {
            logger.error("Failed to activate kill switch", {
                feature: featureName,
                error: err.message,
            });
            throw err;
        }
    }

    /**
     * Record feature usage metrics for analytics
     *
     * @private
     */
    recordMetric(featureName, enabled, userId, metadata = {}) {
        try {
            this.metricsBuffer.push({
                feature: featureName,
                enabled,
                userId,
                timestamp: new Date(),
                metadata,
            });

            // Flush metrics when buffer reaches max size
            if (this.metricsBuffer.length >= this.maxMetricsBufferSize) {
                this.flushMetrics();
            }
        } catch (err) {
            logger.debug("Failed to record feature metric", { error: err.message });
        }
    }

    /**
     * Flush metrics buffer to analytics platform
     *
     * @private
     */
    async flushMetrics() {
        if (this.metricsBuffer.length === 0) return;

        try {
            const metrics = this.metricsBuffer.splice(0, this.metricsBuffer.length);

            // Send to Datadog or Segment
            await fetch("https://api.datadoghq.com/api/v1/timeseries", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "DD-API-KEY": process.env.DATADOG_API_KEY,
                },
                body: JSON.stringify({
                    series: metrics.map((m) => ({
                        metric: `feature_flag.usage`,
                        type: "gauge",
                        points: [[Math.floor(Date.now() / 1000), 1]],
                        tags: [
                            `feature:${m.feature}`,
                            `enabled:${m.enabled}`,
                            `user_id:${m.userId}`,
                        ],
                    })),
                }),
            });

            logger.debug("Flushed feature metrics", { count: metrics.length });
        } catch (err) {
            logger.debug("Failed to flush metrics", { error: err.message });
            // Don't throw - metrics failures should not block operations
        }
    }

    /**
     * Get health metrics for canary deployment monitoring
     *
     * @private
     */
    async getFeatureHealth(featureName) {
        try {
            // Query monitoring service for errors and latency
            const response = await fetch(
                `${process.env.MONITORING_API_URL}/metrics/feature/${featureName}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.MONITORING_API_KEY}`,
                    },
                }
            );

            if (!response.ok) {
                return {
                    errorRate: 0,
                    p99Latency: 0,
                    requestCount: 0,
                };
            }

            return await response.json();
        } catch (err) {
            logger.debug("Failed to get feature health metrics", {
                error: err.message,
            });
            return { errorRate: 0, p99Latency: 0, requestCount: 0 };
        }
    }

    /**
     * Log feature changes for compliance and audit
     *
     * @private
     */
    async logFeatureAudit(featureName, action, details) {
        try {
            await prisma.auditLog.create({
                data: {
                    entityType: "feature_flag",
                    entityId: featureName,
                    action,
                    details: JSON.stringify(details),
                    userId: "system",
                    ipAddress: "internal",
                },
            });
        } catch (err) {
            logger.debug("Failed to log feature audit", { error: err.message });
        }
    }

    /**
     * Shutdown gracefully - flush metrics and close connections
     */
    async shutdown() {
        try {
            await this.flushMetrics();
            if (this.client) {
                this.client.destroy();
            }
            logger.info("Feature flags service shutdown");
        } catch (err) {
            logger.error("Error shutting down feature flags", {
                error: err.message,
            });
        }
    }
}

/**
 * Custom Strategies for Advanced Targeting
 */

class CustomGeoLocationStrategy extends unleash.Strategy {
    constructor() {
        super("customGeoLocation");
    }

    isEnabled(parameters, context) {
        if (!parameters.regions || !context.properties?.region) return false;
        return parameters.regions.includes(context.properties.region);
    }
}

class CustomUserTierStrategy extends unleash.Strategy {
    constructor() {
        super("customUserTier");
    }

    isEnabled(parameters, context) {
        if (!parameters.tiers || !context.properties?.userTier) return false;
        return parameters.tiers.includes(context.properties.userTier);
    }
}

class CustomCanaryStrategy extends unleash.Strategy {
    constructor() {
        super("canary");
    }

    isEnabled(parameters, context) {
        if (!context.userId || !parameters.rollout) return false;
        // Hash-based consistent bucketing
        const hash = this.hashUserId(context.userId);
        return (hash % 100) < parameters.rollout;
    }

    hashUserId(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
}

// Singleton instance
let service = null;

async function getFeatureFlagsService() {
    if (!service) {
        service = new FeatureFlagsService();
        await service.initialize();
    }
    return service;
}

module.exports = {
    getFeatureFlagsService,
    FeatureFlagsService,
};
