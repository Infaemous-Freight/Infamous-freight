import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    orgBilling: { findMany: vi.fn(), count: vi.fn() },
    usageMetric: { aggregate: vi.fn() },
    carrierScore: { findMany: vi.fn() },
    shipment: { findFirst: vi.fn() },
    aiDecisionLog: { findMany: vi.fn() },
    job: { count: vi.fn() },
    jobEvent: { findMany: vi.fn() },
  },
}));

vi.mock("../db/prisma.js", () => ({ prisma: mockPrisma }));

import { dashboardRoutes } from "./dashboard.routes.js";

function makeApp() {
  const app = express();
  app.use((req: any, _res, next) => {
    req.auth = { organizationId: "tenant_1" };
    req.user = { tenantId: "tenant_1" };
    next();
  });
  app.use("/api/dashboard", dashboardRoutes);
  return app;
}

describe("dashboard.routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns geofence alerts scoped by organization", async () => {
    mockPrisma.jobEvent.findMany.mockResolvedValue([{ id: "e1", jobId: "j1", message: "geofence entry", createdAt: new Date() }]);

    const app = makeApp();
    const res = await request(app).get("/api/dashboard/geofence-alerts");

    expect(res.status).toBe(200);
    expect(res.body.data.totalRecentAlerts).toBe(1);
    expect(mockPrisma.jobEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ job: { organizationId: "tenant_1" } }) }),
    );
  });

  it("returns driver leaderboard", async () => {
    mockPrisma.carrierScore.findMany.mockResolvedValue([
      { driverId: "d1", score: 97, riskLevel: "LOW", onTimeRate: 0.99, cancelRate: 0.01, computedAt: new Date() },
    ]);

    const app = makeApp();
    const res = await request(app).get("/api/dashboard/driver-leaderboard?limit=5");

    expect(res.status).toBe(200);
    expect(res.body.data[0].rank).toBe(1);
    expect(mockPrisma.carrierScore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: "tenant_1" }, take: 5 }),
    );
  });

  it("creates customer tracking link for in-tenant shipment", async () => {
    mockPrisma.shipment.findFirst.mockResolvedValue({ id: "s1", trackingId: "TRK123", status: "IN_TRANSIT" });

    const app = makeApp();
    const res = await request(app).get("/api/dashboard/customer-tracking-link/TRK123");

    expect(res.status).toBe(200);
    expect(res.body.data.trackingLink).toContain("/track/TRK123?token=");
    expect(mockPrisma.shipment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ trackingId: "TRK123" }) }),
    );
  });

  it("returns POD summary", async () => {
    mockPrisma.job.count.mockResolvedValueOnce(20).mockResolvedValueOnce(15);

    const app = makeApp();
    const res = await request(app).get("/api/dashboard/proof-of-delivery");

    expect(res.status).toBe(200);
    expect(res.body.data.deliveredJobs).toBe(20);
    expect(res.body.data.jobsWithPodAssets).toBe(15);
    expect(res.body.data.podComplianceRate).toBe(0.75);
  });

  it("returns route optimization insights", async () => {
    mockPrisma.aiDecisionLog.findMany.mockResolvedValue([
      { id: "a1", entityType: "LOAD", entityId: "L1", module: "DISPATCH_RECOMMENDATION", confidence: 0.8, createdAt: new Date() },
      { id: "a2", entityType: "LOAD", entityId: "L2", module: "DISPATCH_RECOMMENDATION", confidence: 0.6, createdAt: new Date() },
    ]);

    const app = makeApp();
    const res = await request(app).get("/api/dashboard/route-optimization");

    expect(res.status).toBe(200);
    expect(res.body.data.totalRecentDecisions).toBe(2);
    expect(res.body.data.averageConfidence).toBe(0.7);
  });
});
