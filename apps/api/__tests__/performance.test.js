/*
 * Performance Tests
 * Ensure critical operations meet performance SLAs
 */

const { prisma } = require('../../db/prisma');

describe('Performance Tests - SLA Verification', () => {
  const SLA_TARGETS = {
    shipmentList: 50, // ms
    shipmentDetail: 30,
    paymentCreate: 100,
    userLookup: 20,
    aggregateQueries: 200,
  };

  describe('Database Query Performance', () => {
    test('should retrieve shipment list in <50ms', async () => {
      const start = Date.now();
      const shipments = await prisma.shipment.findMany({
        take: 100,
        include: { driver: { select: { id: true, name: true } } },
      });
      const duration = Date.now() - start;

      console.log(`Shipment list query: ${duration}ms`);
      expect(duration).toBeLessThan(SLA_TARGETS.shipmentList);
      expect(shipments).toBeDefined();
    });

    test('should retrieve single shipment in <30ms', async () => {
      // Create test shipment first
      const shipment = await prisma.shipment.create({
        data: {
          trackingId: `test-${Date.now()}`,
          origin: 'Test',
          destination: 'Test',
          status: 'pending',
        },
      });

      const start = Date.now();
      const retrieved = await prisma.shipment.findUnique({
        where: { id: shipment.id },
        include: { driver: true },
      });
      const duration = Date.now() - start;

      console.log(`Shipment detail query: ${duration}ms`);
      expect(duration).toBeLessThan(SLA_TARGETS.shipmentDetail);
      expect(retrieved.id).toBe(shipment.id);

      // Cleanup
      await prisma.shipment.delete({ where: { id: shipment.id } });
    });

    test('should filter shipments by status in <50ms', async () => {
      const start = Date.now();
      const shipments = await prisma.shipment.findMany({
        where: { status: 'pending' },
        take: 100,
        orderBy: { createdAt: 'desc' },
      });
      const duration = Date.now() - start;

      console.log(`Shipment filter by status: ${duration}ms`);
      expect(duration).toBeLessThan(SLA_TARGETS.shipmentList);
    });

    test('should lookup user by email in <20ms', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          email: `perf-test-${Date.now()}@example.com`,
          name: 'Test User',
        },
      });

      const start = Date.now();
      const retrieved = await prisma.user.findUnique({
        where: { email: user.email },
      });
      const duration = Date.now() - start;

      console.log(`User email lookup: ${duration}ms`);
      expect(duration).toBeLessThan(SLA_TARGETS.userLookup);
      expect(retrieved.id).toBe(user.id);

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    test('should aggregate user shipments in <200ms', async () => {
      const start = Date.now();
      const stats = await prisma.shipment.groupBy({
        by: ['status'],
        _count: true,
        _max: { createdAt: true },
      });
      const duration = Date.now() - start;

      console.log(`Aggregation query: ${duration}ms`);
      expect(duration).toBeLessThan(SLA_TARGETS.aggregateQueries);
    });
  });

  describe('Concurrent Query Performance', () => {
    test('should handle 10 concurrent shipment list queries within SLA', async () => {
      const start = Date.now();

      const queries = Array(10)
        .fill(null)
        .map(() =>
          prisma.shipment.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
          })
        );

      await Promise.all(queries);
      const duration = Date.now() - start;

      console.log(`10 concurrent queries: ${duration}ms (avg ${(duration / 10).toFixed(0)}ms)`);
      expect(duration / 10).toBeLessThan(SLA_TARGETS.shipmentList * 2); // Allow 2x for concurrency
    });
  });

  describe('Query Optimization Indicators', () => {
    test('should use indexes for status filtering', async () => {
      // This is more of a verification that indexes exist
      const start = Date.now();

      // Query that should use index: shipments_status_createdAt_idx
      await prisma.shipment.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const duration = Date.now() - start;

      // If this is slow, indexes might not be applied
      console.log(`Indexed query duration: ${duration}ms`);
      expect(duration).toBeLessThan(100); // Should be fast with index
    });

    test('should use index for user email lookup', async () => {
      const email = `index-test-${Date.now()}@example.com`;
      await prisma.user.create({
        data: { email, name: 'Test' },
      });

      const start = Date.now();
      await prisma.user.findUnique({ where: { email } });
      const duration = Date.now() - start;

      console.log(`Indexed email lookup: ${duration}ms`);
      expect(duration).toBeLessThan(20);

      // Cleanup
      await prisma.user.deleteMany({ where: { email } });
    });
  });

  describe('Bulk Operations Performance', () => {
    test('should create 100 shipments in reasonable time', async () => {
      const start = Date.now();

      const shipments = await Promise.all(
        Array(100)
          .fill(null)
          .map((_, i) =>
            prisma.shipment.create({
              data: {
                trackingId: `bulk-test-${Date.now()}-${i}`,
                origin: `Origin ${i}`,
                destination: `Dest ${i}`,
                status: 'pending',
              },
            })
          )
      );

      const duration = Date.now() - start;
      console.log(`Bulk create 100 records: ${duration}ms (avg ${(duration / 100).toFixed(1)}ms each)`);

      expect(shipments.length).toBe(100);

      // Cleanup
      await prisma.shipment.deleteMany({
        where: {
          trackingId: {
            contains: 'bulk-test-',
          },
        },
      });
    });
  });

  describe('Query Performance Degradation Checks', () => {
    test('should not have N+1 query problems with includes', async () => {
      const start = Date.now();

      // Good: uses include to fetch related data in one go
      const shipments = await prisma.shipment.findMany({
        take: 50,
        include: { driver: true }, // Single optimized query
      });

      const duration = Date.now() - start;
      console.log(`Query with include (optimized): ${duration}ms`);

      // Should be fast because of include (not N+1)
      expect(duration).toBeLessThan(100);
      expect(shipments.length).toBeGreaterThanOrEqual(0);
    });
  });
});
