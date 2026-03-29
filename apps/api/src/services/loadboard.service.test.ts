import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma before importing the service
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    load: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("../db/prisma.js", () => ({ prisma: mockPrisma }));

import { listLoads, claimLoad } from "./loadboard.service.js";

describe("loadboard.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listLoads", () => {
    it("returns mapped loads for a tenant", async () => {
      const now = new Date("2026-01-15T10:00:00Z");
      mockPrisma.load.findMany.mockResolvedValue([
        {
          id: "load-1",
          tenantId: "tenant-abc",
          lane: null,
          originCity: "Dallas",
          originState: "TX",
          destCity: "Austin",
          destState: "TX",
          distanceMi: 195.5,
          weightLb: 5000,
          rateCents: 85000,
          status: "OPEN",
          claimedByUserId: null,
          claimedAt: null,
          createdAt: now,
          updatedAt: now,
          priceUsd: null,
          description: null,
          shipperId: null,
          driverId: null,
        },
      ]);

      const loads = await listLoads("tenant-abc");

      expect(mockPrisma.load.findMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-abc" },
        orderBy: { createdAt: "desc" },
      });
      expect(loads).toHaveLength(1);
      expect(loads[0].id).toBe("load-1");
      expect(loads[0].tenantId).toBe("tenant-abc");
      expect(loads[0].originCity).toBe("Dallas");
      expect(loads[0].originState).toBe("TX");
      expect(loads[0].destCity).toBe("Austin");
      expect(loads[0].destState).toBe("TX");
      expect(loads[0].distanceMi).toBe(195.5);
      expect(loads[0].weightLb).toBe(5000);
      expect(loads[0].rateCents).toBe(85000);
      expect(loads[0].status).toBe("OPEN");
      expect(loads[0].claimedByUserId).toBeUndefined();
      expect(loads[0].claimedAt).toBeUndefined();
      expect(loads[0].lane).toBe("Dallas, TX → Austin, TX");
    });

    it("falls back to empty strings for null fields", async () => {
      const now = new Date();
      mockPrisma.load.findMany.mockResolvedValue([
        {
          id: "load-2",
          tenantId: "tenant-xyz",
          lane: null,
          originCity: null,
          originState: null,
          destCity: null,
          destState: null,
          distanceMi: null,
          weightLb: null,
          rateCents: null,
          status: "OPEN",
          claimedByUserId: null,
          claimedAt: null,
          createdAt: now,
          updatedAt: now,
          priceUsd: null,
          description: null,
          shipperId: null,
          driverId: null,
        },
      ]);

      const loads = await listLoads("tenant-xyz");
      expect(loads[0].originCity).toBe("");
      expect(loads[0].originState).toBe("");
      expect(loads[0].distanceMi).toBe(0);
      expect(loads[0].rateCents).toBe(0);
    });

    it("uses existing lane value if set", async () => {
      const now = new Date();
      mockPrisma.load.findMany.mockResolvedValue([
        {
          id: "load-3",
          tenantId: "t",
          lane: "Dallas, TX → Austin, TX (custom)",
          originCity: "Dallas",
          originState: "TX",
          destCity: "Austin",
          destState: "TX",
          distanceMi: 200,
          weightLb: 1000,
          rateCents: 50000,
          status: "OPEN",
          claimedByUserId: null,
          claimedAt: null,
          createdAt: now,
          updatedAt: now,
          priceUsd: null,
          description: null,
          shipperId: null,
          driverId: null,
        },
      ]);
      const loads = await listLoads("t");
      expect(loads[0].lane).toBe("Dallas, TX → Austin, TX (custom)");
    });

    it("returns empty array when no loads exist", async () => {
      mockPrisma.load.findMany.mockResolvedValue([]);
      const loads = await listLoads("empty-tenant");
      expect(loads).toEqual([]);
    });
  });

  describe("claimLoad", () => {
    it("returns true when load is successfully claimed", async () => {
      mockPrisma.load.updateMany.mockResolvedValue({ count: 1 });

      const result = await claimLoad("tenant-abc", "load-1", "user-xyz");

      expect(mockPrisma.load.updateMany).toHaveBeenCalledWith({
        where: {
          id: "load-1",
          tenantId: "tenant-abc",
          status: "OPEN",
          claimedByUserId: null,
        },
        data: {
          status: "CLAIMED",
          claimedByUserId: "user-xyz",
          claimedAt: expect.any(Date),
        },
      });
      expect(result).toBe(true);
    });

    it("returns false when load is already claimed", async () => {
      mockPrisma.load.updateMany.mockResolvedValue({ count: 0 });

      const result = await claimLoad("tenant-abc", "load-1", "user-yyy");

      expect(result).toBe(false);
    });

    it("uses null for claimedByUserId when userId is undefined", async () => {
      mockPrisma.load.updateMany.mockResolvedValue({ count: 1 });

      await claimLoad("tenant-abc", "load-1");

      expect(mockPrisma.load.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ claimedByUserId: null }),
        }),
      );
    });

    it("is tenant-scoped - only claims loads belonging to the tenant", async () => {
      mockPrisma.load.updateMany.mockResolvedValue({ count: 0 });

      // Attempting to claim load from a different tenant returns false
      const result = await claimLoad("other-tenant", "load-belonging-to-abc", "u");
      expect(result).toBe(false);
    });
  });
});
