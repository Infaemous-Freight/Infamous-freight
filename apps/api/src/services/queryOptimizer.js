/**
 * Database Query Optimization Service
 * Implements eager loading patterns to prevent N+1 queries
 *
 * @module services/queryOptimizer
 */

const { logger } = require("../middleware/logger");

/**
 * Default eager loading configurations for common queries
 * Maps entity to include relations
 */
const EAGER_LOAD_CONFIGS = {
    shipment: {
        driver: {
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                status: true,
                rating: true,
            },
        },
        user: {
            select: {
                id: true,
                email: true,
                organizationId: true,
            },
        },
    },

    driver: {
        user: {
            select: {
                id: true,
                email: true,
                organizationId: true,
                createdAt: true,
            },
        },
        currentShipment: {
            select: {
                id: true,
                status: true,
                dropoffAddress: true,
                estimatedMiles: true,
            },
        },
    },

    user: {
        organization: {
            select: {
                id: true,
                name: true,
                plan: true,
            },
        },
    },

    invoice: {
        shipment: {
            select: {
                id: true,
                trackingId: true,
                origin: true,
                destination: true,
                rate: true,
            },
        },
        driver: {
            select: {
                id: true,
                name: true,
                email: true,
            },
        },
    },
};

/**
 * Build optimized Prisma include object
 *
 * @param {string} entity - Entity type (shipment, driver, user, etc.)
 * @param {Object} options - Customization options
 * @returns {Object} Prisma include object for eager loading
 *
 * @example
 * const include = buildEagerLoad('shipment');
 * const shipments = await prisma.shipment.findMany({ include });
 */
function buildEagerLoad(entity, options = {}) {
    const baseConfig = EAGER_LOAD_CONFIGS[entity] || {};

    // Allow custom overrides
    return { ...baseConfig, ...options };
}

/**
 * Optimized batch fetch for multiple entities
 * Prevents N+1 queries by loading everything upfront
 *
 * @param {Object} prisma - Prisma client
 * @param {string} entity - Entity type to fetch
 * @param {Object} where - Prisma where clause
 * @param {Object} options - Query options (pagination, sorting, etc.)
 * @returns {Promise<Array>} Array of entities with eager-loaded relations
 *
 * @example
 * const shipments = await batchOptimizedQuery(prisma, 'shipment', {
 *   userId: userId,
 *   status: { in: ['PENDING', 'ASSIGNED'] }
 * });
 */
async function batchOptimizedQuery(prisma, entity, where = {}, options = {}) {
    const startTime = Date.now();

    try {
        const include = buildEagerLoad(entity, options.customLoad);

        // Fetch with optimized eager loading
        const results = await prisma[entity].findMany({
            where,
            include,
            skip: options.skip,
            take: options.take,
            orderBy: options.orderBy || { createdAt: "desc" },
        });

        // Log performance metrics
        const duration = Date.now() - startTime;
        if (duration > 500) {
            logger.warn("Slow query executed", {
                entity,
                duration,
                recordCount: results.length,
                hasWhere: !!where && Object.keys(where).length > 0,
            });
        } else {
            logger.debug("Query completed", {
                entity,
                duration,
                recordCount: results.length,
            });
        }

        return results;
    } catch (err) {
        logger.error("Query optimization failed", {
            entity,
            error: err.message,
        });
        throw err;
    }
}

/**
 * Optimized single record fetch
 *
 * @param {Object} prisma - Prisma client
 * @param {string} entity - Entity type
 * @param {Object} where - Where clause  
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Entity with eager-loaded relations
 */
async function optimizedFindUnique(prisma, entity, where, options = {}) {
    const include = buildEagerLoad(entity, options.customLoad);

    return await prisma[entity].findUnique({
        where,
        include,
    });
}

/**
 * Batch update with optimized fetching of results
 * Returns updated records with relations
 *
 * @param {Object} prisma - Prisma client
 * @param {string} entity - Entity type
 * @param {Object} data - Update data
 * @param {Object} where - Where clause
 * @returns {Promise<Array>} Updated entities with eager-loaded relations
 */
async function batchOptimizedUpdate(prisma, entity, data, where = {}) {
    const include = buildEagerLoad(entity);

    const startTime = Date.now();

    try {
        const results = await prisma[entity].updateMany({
            data,
            where,
        });

        // Fetch updated records with eager loading
        const updated = await prisma[entity].findMany({
            where,
            include,
        });

        const duration = Date.now() - startTime;
        logger.info("Batch update completed", {
            entity,
            updatedCount: results.count,
            duration,
        });

        return updated;
    } catch (err) {
        logger.error("Batch update failed", { entity, error: err.message });
        throw err;
    }
}

/**
 * Aggregate query helper with optimized structure
 * Use for reports/analytics that need calculated fields
 *
 * @param {Object} prisma - Prisma client
 * @param {string} entity - Entity type
 * @param {Object} options - Aggregation options
 * @returns {Promise<Object>} Aggregation result
 */
async function optimizedAggregate(prisma, entity, options = {}) {
    const startTime = Date.now();

    try {
        const result = await prisma[entity].aggregate({
            _count: options._count || true,
            _sum: options._sum,
            _avg: options._avg,
            _min: options._min,
            _max: options._max,
            where: options.where,
        });

        const duration = Date.now() - startTime;
        logger.debug("Aggregation completed", { entity, duration });

        return result;
    } catch (err) {
        logger.error("Aggregation failed", { entity, error: err.message });
        throw err;
    }
}

/**
 * Connection pool health check
 * Monitor active connections to prevent exhaustion
 *
 * @param {Object} prisma - Prisma client
 * @returns {Promise<Object>} Pool health metrics
 */
async function checkConnectionHealth(prisma) {
    try {
        const result = await prisma.$rawQuery`SELECT 1`;
        return {
            healthy: true,
            connected: true,
            timestamp: new Date().toISOString(),
        };
    } catch (err) {
        logger.error("Database connection health check failed", {
            error: err.message,
        });
        return {
            healthy: false,
            connected: false,
            error: err.message,
        };
    }
}

/**
 * Enable query logging for performance monitoring
 * Attach to Prisma $on('query') event
 *
 * @param {Object} prisma - Prisma client
 */
function enableQueryLogging(prisma) {
    prisma.$on("query", (e) => {
        const duration = e.duration;

        if (duration > 1000) {
            logger.warn("Slow database query detected", {
                query: e.query,
                duration,
                params: e.params?.slice(0, 3), // Limit params logged
            });
        } else if (duration > 100) {
            logger.debug("Database query executed", {
                duration,
                paramCount: e.params?.length || 0,
            });
        }
    });
}

module.exports = {
    buildEagerLoad,
    batchOptimizedQuery,
    optimizedFindUnique,
    batchOptimizedUpdate,
    optimizedAggregate,
    checkConnectionHealth,
    enableQueryLogging,
    EAGER_LOAD_CONFIGS,
};
