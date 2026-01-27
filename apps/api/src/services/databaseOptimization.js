/**
 * Database Optimization & Indexing Strategy
 * 
 * Goals:
 * - Reduce query latency (< 100ms p95)
 * - Minimize N+1 queries
 * - Optimize hot paths
 * - Monitor slow queries
 * - Target: Handle 100K concurrent users, 1M+ shipments
 */

// ============================================
// PERFORMANCE TARGETS
// ============================================

const performanceTargets = {
    singleRecordQuery: '< 10ms',
    listQuery: '< 50ms',
    aggregation: '< 200ms',
    connectionPoolUtilization: '< 70%',
    tableBloom: '< 30%',
    transactionsPerSecond: '> 1000',
};

// ============================================
// CURRENT INDEXES (schema.prisma)
// ============================================

// ✅ User: email, role, createdAt
// ✅ Driver: email, status, createdAt  
// ✅ Shipment: trackingId, userId, status, driverId, createdAt, updatedAt, [userId, status]
// ✅ Payment: userId, status, stripePaymentIntentId, createdAt
// ✅ AiEvent: userId, provider, createdAt
// ✅ Subscription: userId, status, stripeSubscriptionId, createdAt

// ============================================
// QUERY PATTERNS & OPTIMIZATION
// ============================================

// ❌ BAD: Fetches all shipments, then filters in memory
const shipments = await prisma.shipment.findMany();
const pending = shipments.filter(s => s.status === 'pending').slice(0, 10);

// ✅ GOOD: Filter in database
const pending = await prisma.shipment.findMany({
    where: { status: 'pending' },
    take: 10,
    orderBy: { createdAt: 'desc' },
});

// ❌ BAD: Multiple queries (N+1)
const drivers = await prisma.driver.findMany();
for (const driver of drivers) {
    driver.shipmentCount = await prisma.shipment.count({
        where: { driverId: driver.id },
    });
}

// ✅ GOOD: Single query with aggregation
const drivers = await prisma.driver.findMany({
    include: {
        _count: {
            select: { shipments: true },
        },
    },
});

// QUERY OPTIMIZATION CHECKLIST:

/**
 * 1. Use select() to fetch only needed fields
 */
async function getShipmentHeaders() {
    return prisma.shipment.findMany({
        select: {
            id: true,
            trackingId: true,
            status: true,
            origin: true,
            destination: true,
            createdAt: true,
        },
        take: 100,
    });
}

/**
 * 2. Use include() for related data (not separate queries)
 */
async function getShipmentWithDriver(id) {
    return prisma.shipment.findUnique({
        where: { id },
        include: {
            driver: true,
            user: { select: { email: true, name: true } },
        },
    });
}

/**
 * 3. Pagination for large datasets
 */
async function getPaginatedShipments(cursor, limit = 20) {
    return prisma.shipment.findMany({
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * 4. Use findFirst for single row queries
 */
async function getLatestShipment(userId) {
    return prisma.shipment.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * 5. Batch operations
 */
async function updateManyShipments(ids, updateData) {
    return Promise.all(
        ids.map(id =>
            prisma.shipment.update({
                where: { id },
                data: updateData,
            })
        )
    );
}

/**
 * 6. Aggregation queries
 */
async function getShipmentStatistics(userId) {
    const [total, pending, inTransit, delivered] = await Promise.all([
        prisma.shipment.count({ where: { userId } }),
        prisma.shipment.count({ where: { userId, status: 'pending' } }),
        prisma.shipment.count({ where: { userId, status: 'in_transit' } }),
        prisma.shipment.count({ where: { userId, status: 'delivered' } }),
    ]);

    return { total, pending, inTransit, delivered };
}

/**
 * 7. Connection pooling for high throughput
 * Configure in .env:
 * DATABASE_URL="postgresql://user:pass@host/db?connection_limit=10"
 */

/**
 * 8. Query result caching (1 hour TTL)
 */
const cache = new Map();

async function getCachedShipments(userId, ttl = 3600000) {
    const key = `shipments:${userId}`;

    if (cache.has(key)) {
        return cache.get(key);
    }

    const shipments = await prisma.shipment.findMany({
        where: { userId },
        include: { driver: true },
    });

    cache.set(key, shipments);
    setTimeout(() => cache.delete(key), ttl);

    return shipments;
}

/**
 * 9. Lazy loading for large relations
 */
async function getDriver(id, includeShipments = false) {
    const driver = await prisma.driver.findUnique({
        where: { id },
        include: {
            shipments: includeShipments ? { take: 10 } : false,
        },
    });

    return driver;
}

/**
 * 10. Monitor slow queries
 * Enable query logging:
 */
// prisma/seed.js or middleware
const prisma = require('@prisma/client').PrismaClient;

const prismaWithLogging = new prisma.$extends({
    query: {
        async $allOperations({ operation, model, args, query }) {
            const start = Date.now();
            const result = await query(args);
            const duration = Date.now() - start;

            if (duration > 100) {
                console.warn(`Slow query (${duration}ms): ${model}.${operation}`);
            }

            return result;
        },
    },
});

module.exports = { prismaWithLogging };

/**
 * PERFORMANCE TARGETS:
 * 
 * ✅ Simple queries: < 50ms
 * ✅ Join queries: < 100ms
 * ✅ Aggregations: < 200ms
 * ✅ Pagination: < 100ms
 * 
 * MONITORING:
 * 
 * - PostgreSQL slow_query_log (log_min_duration_statement = 100)
 * - Application-level query timing (Datadog, New Relic)
 * - Periodic EXPLAIN ANALYZE on hot queries
 * - Index usage statistics (pg_stat_user_indexes)
 */

// Check index effectiveness
SELECT
schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

// Find unused indexes
SELECT
schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

// Analyze query performance
EXPLAIN ANALYZE
SELECT
s.id,
    s.tracking_id,
    s.status,
    d.name,
    u.email
FROM shipments s
LEFT JOIN drivers d ON s.driver_id = d.id
LEFT JOIN users u ON s.user_id = u.id
WHERE s.status = 'pending'
AND s.created_at > NOW() - INTERVAL '7 days'
ORDER BY s.created_at DESC
LIMIT 20;

module.exports = {
    getCachedShipments,
    getShipmentWithDriver,
    getPaginatedShipments,
    getShipmentStatistics,
};
