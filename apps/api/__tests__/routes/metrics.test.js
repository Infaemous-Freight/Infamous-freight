const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const metricsRoutes = require("../../src/routes/metrics");

// Mock Prisma
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    subscription: {
      findMany: jest.fn().mockResolvedValue([
        { monthlyValue: 100, tier: "basic", createdAt: new Date() },
        { monthlyValue: 200, tier: "premium", createdAt: new Date() },
      ]),
      count: jest.fn().mockResolvedValue(10),
      aggregate: jest.fn().mockResolvedValue({ _sum: { monthlyValue: 300 } }),
      groupBy: jest.fn().mockResolvedValue([
        { tier: "basic", _count: 5, _sum: { monthlyValue: 500 } },
        { tier: "premium", _count: 5, _sum: { monthlyValue: 1000 } },
      ]),
    },
    customer: {
      count: jest.fn().mockResolvedValue(50),
    },
    payment: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 1000 } }),
    },
  })),
}));

describe("Metrics Routes", () => {
  let app, validToken, adminToken;

  beforeEach(() => {
    // Clear the metrics cache before each test
    jest.resetModules();

    app = express();
    app.use(express.json());
    app.use("/api/metrics/revenue", require("../../src/routes/metrics"));

    validToken = jwt.sign(
      { sub: "user-123", scopes: ["metrics:read"] },
      process.env.JWT_SECRET,
    );

    adminToken = jwt.sign(
      { sub: "admin-123", scopes: ["admin"] },
      process.env.JWT_SECRET,
    );

    jest.clearAllMocks();
  });

  describe("GET /live", () => {
    it("should return live metrics with authentication", async () => {
      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.current).toBeDefined();
      expect(response.body.current.mrr).toBeDefined();
      expect(response.body.current.arr).toBeDefined();
      expect(response.body.mrrHistory).toBeDefined();
      expect(response.body.tierDistribution).toBeDefined();
    });

    it("should return cached data when available", async () => {
      // First request
      const response1 = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response1.body.cached).toBe(false);

      // Second request (should be cached)
      const response2 = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response2.body.cached).toBe(true);
      expect(response2.body.lastUpdated).toBeDefined();
    });

    it("should require metrics:read scope", async () => {
      const noScopeToken = jwt.sign(
        { sub: "user-123", scopes: [] },
        process.env.JWT_SECRET,
      );

      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${noScopeToken}`);

      expect(response.status).toBe(403);
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/metrics/revenue/live");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /clear-cache", () => {
    it("should clear cache for admin", async () => {
      const response = await request(app)
        .post("/api/metrics/revenue/clear-cache")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("cleared");
    });

    it("should require admin scope", async () => {
      const response = await request(app)
        .post("/api/metrics/revenue/clear-cache")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("GET /export", () => {
    it("should export metrics as CSV", async () => {
      const exportToken = jwt.sign(
        { sub: "user-123", scopes: ["metrics:export"] },
        process.env.JWT_SECRET,
      );

      const response = await request(app)
        .get("/api/metrics/revenue/export")
        .set("Authorization", `Bearer ${exportToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/csv");
      expect(response.headers["content-disposition"]).toContain(
        "revenue-metrics.csv",
      );
    });

    it("should require metrics:export scope", async () => {
      const response = await request(app)
        .get("/api/metrics/revenue/export")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(403);
    });
  });
});
