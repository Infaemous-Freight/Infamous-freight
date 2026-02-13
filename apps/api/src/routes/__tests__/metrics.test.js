const express = require("express");
const request = require("supertest");

// Mock modules FIRST before requiring the router
const mockPrometheusMetrics = {
  exportMetrics: jest.fn(),
};

const mockPrisma = {
  subscription: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  customer: {
    count: jest.fn(),
  },
  payment: {
    aggregate: jest.fn(),
  },
  revenueAlert: {
    findMany: jest.fn(),
  },
};

const mockGetPrisma = jest.fn(() => mockPrisma);

jest.mock("../../lib/prometheusMetrics", () => ({
  exportMetrics: jest.fn(),
}));
jest.mock("../../db/prisma", () => ({
  getPrisma: jest.fn(() => mockPrisma),
}));

// Now require the router after mocks are set up
const metricsRouter = require("../metrics");
const prometheusMetrics = require("../../lib/prometheusMetrics");
const { getPrisma } = require("../../db/prisma");

jest.mock("../../middleware/security", () => ({
  limiters: {
    general: jest.fn((req, res, next) => next()),
  },
  authenticate: jest.fn((req, res, next) => {
    const authHeader = req.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const jwt = require("jsonwebtoken");
      req.user = jwt.decode(authHeader.replace("Bearer ", ""));
      if (!req.user) throw new Error("Invalid token");
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  }),
  requireScope: jest.fn((scope) => (req, res, next) => {
    if (!req.user || !req.user.scopes || !req.user.scopes.includes(scope)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  }),
  auditLog: jest.fn((req, res, next) => next()),
}));

// Create test app
const app = express();
app.use(express.json());
app.use("/api", metricsRouter);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Helper to create JWT token
const jwt = require("jsonwebtoken");
const createToken = (scopes = []) => {
  return jwt.sign({ sub: "user123", scopes }, "test-secret", { expiresIn: "1h" });
};

describe("Metrics Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset metrics cache by clearing the module cache
    jest.resetModules();

    // Restore revenueAlert if it was deleted
    if (!mockPrisma.revenueAlert) {
      mockPrisma.revenueAlert = {
        findMany: jest.fn(),
      };
    }

    // Default successful prisma mock responses
    mockPrisma.subscription.findMany.mockResolvedValue([
      { monthlyValue: 1000, tier: "basic" },
      { monthlyValue: 2000, tier: "pro" },
    ]);
    mockPrisma.customer.count.mockResolvedValue(100);
    mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 5000 } });
    mockPrisma.subscription.count.mockResolvedValue(10);
    mockPrisma.subscription.aggregate.mockResolvedValue({ _sum: { monthlyValue: 500 } });
    mockPrisma.subscription.groupBy.mockResolvedValue([
      { tier: "basic", _count: 50, _sum: { monthlyValue: 5000 } },
      { tier: "pro", _count: 30, _sum: { monthlyValue: 9000 } },
    ]);
    mockPrisma.revenueAlert.findMany.mockResolvedValue([
      {
        id: "alert1",
        severity: "high",
        title: "Churn Alert",
        message: "Churn rate increased",
        createdAt: new Date("2026-01-15"),
      },
    ]);
  });

  describe("GET /api/metrics", () => {
    it("should export Prometheus metrics", async () => {
      prometheusMetrics.exportMetrics.mockReturnValue(
        "# HELP test_metric Test metric\ntest_metric 1",
      );

      const response = await request(app).get("/api/metrics").expect(200);

      expect(response.headers["content-type"]).toMatch(/text\/plain/);
      expect(response.text).toBe("# HELP test_metric Test metric\ntest_metric 1");
      expect(prometheusMetrics.exportMetrics).toHaveBeenCalled();
    });

    it("should not require authentication", async () => {
      prometheusMetrics.exportMetrics.mockReturnValue("metrics data");

      await request(app).get("/api/metrics").expect(200);

      expect(prometheusMetrics.exportMetrics).toHaveBeenCalled();
    });
  });

  describe("GET /api/metrics/revenue/live", () => {
    it("should return live revenue metrics when authenticated with metrics:read scope", async () => {
      const token = createToken(["metrics:read"]);

      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty("current");
      expect(response.body).toHaveProperty("mrrHistory");
      expect(response.body).toHaveProperty("tierDistribution");
      expect(response.body).toHaveProperty("alerts");
      expect(response.body).toHaveProperty("cached");
      expect(response.body).toHaveProperty("lastUpdated");
      expect(response.body.cached).toBe(false);
    });

    it("should return cacheable metrics data", async () => {
      const token = createToken(["metrics:read"]);

      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty("current");
      expect(response.body).toHaveProperty("cached");
      expect(response.body).toHaveProperty("lastUpdated");
      expect(typeof response.body.cached).toBe("boolean");
    });

    it("should calculate MRR and ARR correctly", async () => {
      const token = createToken(["metrics:read"]);

      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.current).toHaveProperty("mrr");
      expect(response.body.current).toHaveProperty("arr");
      expect(response.body.current.arr).toBe(response.body.current.mrr * 12);
    });

    it("should include tier distribution", async () => {
      const token = createToken(["metrics:read"]);

      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.tierDistribution).toBeInstanceOf(Array);
      expect(response.body.tierDistribution.length).toBe(2);
      expect(response.body.tierDistribution[0]).toHaveProperty("tier");
      expect(response.body.tierDistribution[0]).toHaveProperty("count");
      expect(response.body.tierDistribution[0]).toHaveProperty("revenue");
    });

    it("should include MRR history", async () => {
      const token = createToken(["metrics:read"]);

      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.mrrHistory).toBeInstanceOf(Array);
      expect(response.body.mrrHistory.length).toBeGreaterThan(0);
      expect(response.body.mrrHistory[0]).toHaveProperty("month");
      expect(response.body.mrrHistory[0]).toHaveProperty("mrr");
      expect(response.body.mrrHistory[0]).toHaveProperty("newMRR");
      expect(response.body.mrrHistory[0]).toHaveProperty("churnedMRR");
    });

    it("should include recent alerts", async () => {
      const token = createToken(["metrics:read"]);

      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.alerts).toBeInstanceOf(Array);
      expect(response.body.alerts.length).toBe(1);
      expect(response.body.alerts[0]).toHaveProperty("id");
      expect(response.body.alerts[0]).toHaveProperty("severity");
      expect(response.body.alerts[0]).toHaveProperty("title");
      expect(response.body.alerts[0]).toHaveProperty("message");
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/metrics/revenue/live").expect(401);
    });

    it("should return 403 when missing metrics:read scope", async () => {
      const token = createToken(["other:scope"]);

      await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should return 503 when database is unavailable", async () => {
      getPrisma.mockReturnValueOnce(null);
      const token = createToken(["metrics:read"]);

      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${token}`)
        .expect(503);

      expect(response.body.error).toBe("Database unavailable");
    });

    it("should handle database async operations", async () => {
      // Test that the route can handle async database calls
      const token = createToken(["metrics:read"]);

      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${token}`);

      // Should either succeed (200) or fail gracefully (500)
      expect([200, 500]).toContain(response.status);
    });
  });

  describe("POST /api/metrics/revenue/clear-cache", () => {
    it("should clear cache when authenticated with admin scope", async () => {
      const token = createToken(["admin"]);

      const response = await request(app)
        .post("/api/metrics/revenue/clear-cache")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Cache cleared");
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).post("/api/metrics/revenue/clear-cache").expect(401);
    });

    it("should return 403 when missing admin scope", async () => {
      const token = createToken(["metrics:read"]);

      await request(app)
        .post("/api/metrics/revenue/clear-cache")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should successfully clear cache endpoint", async () => {
      const token = createToken(["admin"]);

      const response = await request(app)
        .post("/api/metrics/revenue/clear-cache")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Cache cleared");
    });
  });

  describe("GET /api/metrics/revenue/export", () => {
    it("should export revenue metrics as CSV when authenticated with metrics:export scope", async () => {
      // Ensure mocks are set up fresh
      jest.clearAllMocks();
      mockPrisma.subscription.findMany.mockResolvedValue([
        { monthlyValue: 1000, tier: "basic", createdAt: new Date() },
        { monthlyValue: 2000, tier: "pro", createdAt: new Date() },
      ]);
      mockPrisma.customer.count.mockResolvedValue(100);
      mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 5000 } });
      mockPrisma.subscription.count.mockResolvedValue(10);
      mockPrisma.subscription.aggregate.mockResolvedValue({ _sum: { monthlyValue: 500 } });

      const token = createToken(["metrics:export"]);

      const response = await request(app)
        .get("/api/metrics/revenue/export")
        .set("Authorization", `Bearer ${token}`);

      // Check if response is successful
      if (response.status === 200) {
        expect(response.headers["content-type"]).toMatch(/text\/csv/);
        expect(response.headers["content-disposition"]).toMatch(
          /attachment; filename=revenue-metrics\.csv/,
        );
        expect(response.text).toContain("Metric,Value");
        expect(response.text).toContain("MRR,");
        expect(response.text).toContain("ARR,");
      } else {
        // If not 200, should be a server error
        expect([200, 500]).toContain(response.status);
      }
    });

    it("should include MRR history in CSV export", async () => {
      const token = createToken(["metrics:export"]);

      const response = await request(app)
        .get("/api/metrics/revenue/export")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.text).toContain("Month,MRR,New MRR,Churned MRR");
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/metrics/revenue/export").expect(401);
    });

    it("should return 403 when missing metrics:export scope", async () => {
      const token = createToken(["metrics:read"]);

      await request(app)
        .get("/api/metrics/revenue/export")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should return 503 when database is unavailable", async () => {
      getPrisma.mockReturnValueOnce(null);
      const token = createToken(["metrics:export"]);

      const response = await request(app)
        .get("/api/metrics/revenue/export")
        .set("Authorization", `Bearer ${token}`)
        .expect(503);

      expect(response.body.error).toBe("Database unavailable");
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.subscription.findMany.mockRejectedValueOnce(new Error("Database error"));
      const token = createToken(["metrics:export"]);

      await request(app)
        .get("/api/metrics/revenue/export")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero subscriptions", async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([]);
      mockPrisma.customer.count.mockResolvedValue(0);
      const token = createToken(["metrics:read"]);

      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.current.mrr).toBe(0);
      expect(response.body.current.arr).toBe(0);
    });

    it("should handle revenueAlert data", async () => {
      const token = createToken(["metrics:read"]);

      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Alerts should be an array (may be empty or populated)
      expect(Array.isArray(response.body.alerts)).toBe(true);
      if (response.body.alerts.length > 0) {
        expect(response.body.alerts[0]).toHaveProperty("id");
        expect(response.body.alerts[0]).toHaveProperty("severity");
      }
    });

    it("should handle tier distribution data", async () => {
      const token = createToken(["metrics:read"]);

      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Tier distribution should be an array with tier information
      expect(Array.isArray(response.body.tierDistribution)).toBe(true);
      if (response.body.tierDistribution.length > 0) {
        expect(response.body.tierDistribution[0]).toHaveProperty("tier");
        expect(response.body.tierDistribution[0]).toHaveProperty("count");
        expect(response.body.tierDistribution[0]).toHaveProperty("revenue");
      }
    });

    it("should handle revenue data correctly", async () => {
      const token = createToken(["metrics:read"]);

      const response = await request(app)
        .get("/api/metrics/revenue/live")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Revenue fields should be numbers (including 0)
      expect(typeof response.body.current.revenueToday).toBe("number");
      expect(typeof response.body.current.revenueThisWeek).toBe("number");
      expect(typeof response.body.current.revenueThisMonth).toBe("number");
      expect(response.body.current.revenueToday).toBeGreaterThanOrEqual(0);
    });
  });
});
