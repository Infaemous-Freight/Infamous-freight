/**
 * Database Query Performance Guidelines
 * 
 * Critical optimization strategies for production
 */

// ❌ BAD: N+1 query problem - Multiple queries in loop
async function getShipmentsWithDriverBad() {
    const shipments = await prisma.shipment.findMany();
    for (const shipment of shipments) {
        shipment.driver = await prisma.driver.findUnique({
            where: { id: shipment.driverId },
        });
    }
    return shipments;
}

// ✅ GOOD: Use include to fetch related data in single query
async function getShipmentsWithDriver() {
    return await prisma.shipment.findMany({
        include: {
            driver: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    status: true,
                },
            },
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
        },
        where: {
            status: { not: 'archived' },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
}

// ✅ GOOD: Use select to fetch only needed fields
async function getShipmentsSummary() {
    return await prisma.shipment.findMany({
        select: {
            id: true,
            trackingId: true,
            status: true,
            origin: true,
            destination: true,
            createdAt: true,
        },
        where: {
            createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
        },
        take: 100,
    });
}

// ✅ GOOD: Pagination with cursor-based navigation
async function getPaginatedShipments(cursor = null, limit = 20) {
    return await prisma.shipment.findMany({
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        include: { driver: true, user: true },
        orderBy: { createdAt: 'desc' },
    });
}

// ✅ GOOD: Batch operations to reduce database roundtrips
async function updateShipmentsInBatch(shipmentIds, updateData) {
    return await Promise.all(
        shipmentIds.map((id) =>
            prisma.shipment.update({
                where: { id },
                data: updateData,
            })
        )
    );
}

// ✅ GOOD: Use findMany with aggregation for counts
async function getShipmentStats() {
    const [total, pending, inTransit, delivered] = await Promise.all([
        prisma.shipment.count(),
        prisma.shipment.count({ where: { status: 'pending' } }),
        prisma.shipment.count({ where: { status: 'in_transit' } }),
        prisma.shipment.count({ where: { status: 'delivered' } }),
    ]);

    return { total, pending, inTransit, delivered };
}

// ✅ GOOD: Indexing strategy - Ensure indexes on:
// - Frequently queried fields: email, userId, status, createdAt
// - Foreign keys: driverId, userId
// - Unique fields: trackingId, stripePaymentIntentId
// - Combination indexes: (userId, status), (status, createdAt)

module.exports = {
    getShipmentsWithDriver,
    getShipmentsSummary,
    getPaginatedShipments,
    updateShipmentsInBatch,
    getShipmentStats,
};
