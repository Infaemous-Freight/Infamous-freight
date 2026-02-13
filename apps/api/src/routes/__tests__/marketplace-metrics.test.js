const express = require("express");
const request = require("supertest");

// Mock the metrics service
const mockMetricsService = {
  enabled: true,
  getMetrics: jest.fn(),
  getDashboardSummary: jest.fn(),
  getPrometheusMetrics: jest.fn(),
};

const mockGetMetricsService = jest.fn(() => mockMetricsService);

jest.mock("../../services/metricsService", () => ({
  getMetricsService: mockGetMetricsService,
}));

jest.mock("../../middleware/security", () => ({
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
}));

// Now require the router
const marketplaceMetricsRouter = require("../marketplace-metrics");

// Create test app
const app = express();
app.use(express.json());
app.use("/api/marketplace", marketplaceMetricsRouter);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Helper to create JWT token
const jwt = require("jsonwebtoken");
const createToken = (scopes = []) => {
  return jwt.sign({ sub: "user123", scopes }, "test-secret", { expiresIn: "1h" });
};

describe("Marketplace Metrics Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMetricsService.enabled = true;
  });

  describe("GET /api/marketplace", () => {
    it("should return marketplace metrics when authenticated as admin", async () => {
      const mockMetrics = {
        queueSize: 45,
        processingRate: 12.5,
        averageWaitTime: 3.2,
        failureRate: 0.02,
        totalProcessed: 1500,
      };
      mockMetricsService.getMetrics.mockReturnValue(mockMetrics);

      const token = createToken(["admin"]);
      const response = await request(app)
        .get("/api/marketplace")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMetrics);
      expect(mockMetricsService.getMetrics).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/marketplace").expect(401);
    });

    it("should return 403 when missing admin scope", async () => {
      const token = createToken(["other:scope"]);

      await request(app)
        .get("/api/marketplace")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should handle service errors gracefully", async () => {
      mockMetricsService.getMetrics.mockImplementation(() => {
        throw new Error("Metrics service unavailable");
      });

      const token = createToken(["admin"]);
      const response = await request(app)
        .get("/api/marketplace")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Failed to retrieve metrics");
      expect(response.body.message).toBe("Metrics service unavailable");
    });
  });

  describe("GET /api/marketplace/dashboard", () => {
    it("should return dashboard summary when authenticated as admin", async () => {
      const mockSummary = {
        overview: {
          totalJobs: 1500,
          activeJobs: 45,
          completedToday: 120,
        },
        performance: {
          successRate: 0.98,
          averageProcessingTime: 5.3,
        },
        trends: {
          weekOverWeek: 0.15,
          monthOverMonth: 0.22,
        },
      };
      mockMetricsService.getDashboardSummary.mockReturnValue(mockSummary);

      const token = createToken(["admin"]);
      const response = await request(app)
        .get("/api/marketplace/dashboard")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSummary);
      expect(mockMetricsService.getDashboardSummary).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/marketplace/dashboard").expect(401);
    });

    it("should return 403 when missing admin scope", async () => {
      const token = createToken(["metrics:read"]);

      await request(app)
        .get("/api/marketplace/dashboard")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should handle service errors gracefully", async () => {
      mockMetricsService.getDashboardSummary.mockImplementation(() => {
        throw new Error("Dashboard service error");
      });

      const token = createToken(["admin"]);
      const response = await request(app)
        .get("/api/marketplace/dashboard")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Failed to retrieve dashboard metrics");
      expect(response.body.message).toBe("Dashboard service error");
    });
  });

  describe("GET /api/marketplace/prometheus", () => {
    it("should return Prometheus metrics without authentication", async () => {
      const mockPrometheusMetrics = `# HELP marketplace_queue_size Current marketplace queue size
# TYPE marketplace_queue_size gauge
marketplace_queue_size 45
# HELP marketplace_processing_rate Processing rate per minute
# TYPE marketplace_processing_rate gauge
marketplace_processing_rate 12.5`;

      mockMetricsService.getPrometheusMetrics.mockReturnValue(mockPrometheusMetrics);

      const response = await request(app).get("/api/marketplace/prometheus").expect(200);

      expect(response.text).toBe(mockPrometheusMetrics);
      expect(response.headers["content-type"]).toMatch(/text\/plain/);
      expect(mockMetricsService.getPrometheusMetrics).toHaveBeenCalled();
    });

    it("should set correct content-type header", async () => {
      mockMetricsService.getPrometheusMetrics.mockReturnValue("# metrics");

      const response = await request(app).get("/api/marketplace/prometheus").expect(200);

      expect(response.headers["content-type"]).toMatch(/text\/plain/);
      expect(response.headers["content-type"]).toMatch(/version=0\.0\.4/);
    });

    it("should handle service errors gracefully", async () => {
      mockMetricsService.getPrometheusMetrics.mockImplementation(() => {
        throw new Error("Prometheus export failed");
      });

      const response = await request(app).get("/api/marketplace/prometheus").expect(500);

      expect(response.text).toContain("# Error: Prometheus export failed");
    });

    it("should work without authentication (public endpoint)", async () => {
      mockMetricsService.getPrometheusMetrics.mockReturnValue("# test metrics");

      await request(app).get("/api/marketplace/prometheus").expect(200);

      expect(mockMetricsService.getPrometheusMetrics).toHaveBeenCalled();
    });
  });

  describe("GET /api/marketplace/health", () => {
    it("should return health status with enabled flag", async () => {
      mockMetricsService.enabled = true;

      const response = await request(app).get("/api/marketplace/health").expect(200);

      expect(response.body.status).toBe("ok");
      expect(response.body.enabled).toBe(true);
      expect(response.body).toHaveProperty("timestamp");
      expect(mockGetMetricsService).toHaveBeenCalled();
    });

    it("should return disabled status when metrics are disabled", async () => {
      mockMetricsService.enabled = false;

      const response = await request(app).get("/api/marketplace/health").expect(200);

      expect(response.body.status).toBe("ok");
      expect(response.body.enabled).toBe(false);
    });

    it("should not require authentication", async () => {
      mockMetricsService.enabled = true;

      await request(app).get("/api/marketplace/health").expect(200);
    });

    it("should return timestamp in ISO format", async () => {
      const response = await request(app).get("/api/marketplace/health").expect(200);

      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("Service Integration", () => {
    it("should call getMetricsService for all endpoints", async () => {
      mockMetricsService.getMetrics.mockReturnValue({});
      mockMetricsService.getDashboardSummary.mockReturnValue({});
      mockMetricsService.getPrometheusMetrics.mockReturnValue("# metrics");

      const token = createToken(["admin"]);

      // Test metrics endpoint
      await request(app).get("/api/marketplace").set("Authorization", `Bearer ${token}`);
      expect(mockGetMetricsService).toHaveBeenCalled();

      jest.clearAllMocks();

      // Test dashboard endpoint
      await request(app).get("/api/marketplace/dashboard").set("Authorization", `Bearer ${token}`);
      expect(mockGetMetricsService).toHaveBeenCalled();

      jest.clearAllMocks();

      // Test prometheus endpoint
      await request(app).get("/api/marketplace/prometheus");
      expect(mockGetMetricsService).toHaveBeenCalled();

      jest.clearAllMocks();

      // Test health endpoint
      await request(app).get("/api/marketplace/health");
      expect(mockGetMetricsService).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should return consistent error format for metrics endpoint", async () => {
      mockMetricsService.getMetrics.mockImplementation(() => {
        throw new Error("Test error");
      });

      const token = createToken(["admin"]);
      const response = await request(app)
        .get("/api/marketplace")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
    });

    it("should return consistent error format for dashboard endpoint", async () => {
      mockMetricsService.getDashboardSummary.mockImplementation(() => {
        throw new Error("Test error");
      });

      const token = createToken(["admin"]);
      const response = await request(app)
        .get("/api/marketplace/dashboard")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
    });
  });
});
