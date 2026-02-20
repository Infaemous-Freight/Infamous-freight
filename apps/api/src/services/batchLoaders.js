/**
 * Database Batch Loaders
 *
 * Prevents N+1 query problems by batching database queries
 * Uses DataLoader to accumulate queries and execute them in one batch
 */

const DataLoader = require('dataloader');
const { PrismaClient } = require('@prisma/client');

// Use global Prisma instance if available, otherwise create new
const prisma = global.prisma || new PrismaClient();

/**
 * Batch loader for shipments with related data
 */
function createShipmentLoader() {
    return new DataLoader(async (shipmentIds) => {
        // Fetch all shipments in one query instead of multiple
        const shipments = await prisma.shipment.findMany({
            where: { id: { in: shipmentIds } },
            include: {
                user: true,
                driver: true,
                tracking: true,
                events: true,
            },
        });

        // Return in same order as requested IDs
        return shipmentIds.map(
            (id) => shipments.find((s) => s.id === id) || null
        );
    });
}

/**
 * Batch loader for users with their statistics
 */
function createUserLoader() {
    return new DataLoader(async (userIds) => {
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            include: {
                shipments: {
                    select: { id: true },
                    where: { status: { not: 'CANCELLED' } },
                },
                organization: true,
            },
        });

        return userIds.map((id) => users.find((u) => u.id === id) || null);
    });
}

/**
 * Batch loader for tracking updates
 */
function createTrackingLoader() {
    return new DataLoader(async (trackingIds) => {
        const trackings = await prisma.tracking.findMany({
            where: { id: { in: trackingIds } },
            include: {
                events: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        return trackingIds.map((id) => trackings.find((t) => t.id === id) || null);
    });
}

/**
 * Batch loader for organizations with member count
 */
function createOrganizationLoader() {
    return new DataLoader(async (orgIds) => {
        const orgs = await prisma.organization.findMany({
            where: { id: { in: orgIds } },
            include: {
                _count: {
                    select: { users: true, shipments: true },
                },
            },
        });

        return orgIds.map((id) => orgs.find((o) => o.id === id) || null);
    });
}

/**
 * Request context with loaders
 *
 * Attach this to each request to batch queries across that request lifecycle
 * Each request gets fresh loaders to prevent caching issues across requests
 */
function createLoaderContext() {
    return {
        shipmentLoader: createShipmentLoader(),
        userLoader: createUserLoader(),
        trackingLoader: createTrackingLoader(),
        organizationLoader: createOrganizationLoader(),
    };
}

/**
 * Middleware to attach loaders to request
 *
 * Usage: app.use(batchLoaderMiddleware);
 * Then in route handlers: const shipment = await req.loaders.shipmentLoader.load(id);
 */
function batchLoaderMiddleware(req, res, next) {
    try {
        req.loaders = createLoaderContext();
        next();
    } catch (err) {
        next(err);
    }
}

/**
 * Usage Example in Route Handler:
 *
 * router.get('/shipments/:id/with-user', async (req, res, next) => {
 *   try {
 *     // Use batch loader instead of direct query
 *     const shipment = await req.loaders.shipmentLoader.load(req.params.id);
 *     const user = await req.loaders.userLoader.load(shipment.userId);
 *
 *     res.json(new ApiResponse({ data: { shipment, user } }));
 *   } catch (err) {
 *     next(err);
 *   }
 * });
 *
 * Benefits:
 * - First call: req.loaders.shipmentLoader.load(id1) - queued
 * - Second call: req.loaders.shipmentLoader.load(id2) - queued
 * - Both execute together: findMany({id: { in: [id1, id2] }})
 * - Results returned in order without N+1 queries
 */

// Export middleware and loaders
module.exports = {
    // Middleware to attach to Express app
    batchLoaderMiddleware,

    // Loader context creator (for advanced usage)
    createLoaderContext,

    // Individual loader creators (for testing/custom usage)
    createShipmentLoader,
    createUserLoader,
    createTrackingLoader,
    createOrganizationLoader,
};
