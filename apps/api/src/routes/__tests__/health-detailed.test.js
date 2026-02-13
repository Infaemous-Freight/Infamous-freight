const express = require("express");
const request = require("supertest");
const os = require("os");

// Mock Prisma
const mockPrisma = {
  $queryRaw: jest.fn(),
};

jest.mock("../../config/database", () => ({
  prisma: mockPrisma,
}));

// Now require the router
const healthRouter = require("../health-detailed");

// Create test app
const app = express();
app.use(express.json());
app.use("/api", healthRouter);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

describe("Health Detailed Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/health", () => {
    it("should return healthy status when database is accessible", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const response = await request(app).get("/api/health").expect(200);

      expect(response.body.status).toBe("ok");
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(response.body.environment).toBeDefined();
      expect(response.body.services.database.status).toBe("healthy");
      expect(response.body.services.database.responseTime).toMatch(/\d+ms/);
      expect(response.body.system).toBeDefined();
    });

    it("should return degraded status when database fails", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Connection timeout"));

      const response = await request(app).get("/api/health").expect(503);

      expect(response.body.status).toBe("degraded");
      expect(response.body.services.database.status).toBe("unhealthy");
      expect(response.body.services.database.error).toBe("Connection timeout");
    });

    it("should include system metrics", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const response = await request(app).get("/api/health").expect(200);

      expect(response.body.system.uptime).toBeDefined();
      expect(response.body.system.loadAverage).toBeDefined();
      expect(response.body.system.freeMemory).toMatch(/\d+\.\d+ MB/);
      expect(response.body.system.totalMemory).toMatch(/\d+\.\d+ MB/);
      expect(response.body.system.cpuCores).toBeGreaterThan(0);
      expect(response.body.system.platform).toBe(os.platform());
    });

    it("should not require authentication", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await request(app).get("/api/health").expect(200);
    });
  });

  describe("GET /api/health/live", () => {
    it("should return alive status", async () => {
      const response = await request(app).get("/api/health/live").expect(200);

      expect(response.body.status).toBe("alive");
    });

    it("should not require database", async () => {
      // Liveness doesn't check database
      await request(app).get("/api/health/live").expect(200);

      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });

    it("should not require authentication", async () => {
      await request(app).get("/api/health/live").expect(200);
    });
  });

  describe("GET /api/health/ready", () => {
    it("should return ready when database is accessible", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const response = await request(app).get("/api/health/ready").expect(200);

      expect(response.body.status).toBe("ready");
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(["SELECT 1"]);
    });

    it("should return not ready when database fails", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Database down"));

      const response = await request(app).get("/api/health/ready").expect(503);

      expect(response.body.status).toBe("not_ready");
      expect(response.body.error).toBe("Database down");
    });

    it("should not require authentication", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await request(app).get("/api/health/ready").expect(200);
    });
  });

  describe("GET /api/health/details", () => {
    it("should return detailed health information", async () => {
      const mockDbResult = [
        {
          table_count: 25,
          database_name: "test_db",
          server_time: new Date(),
        },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockDbResult);

      const response = await request(app).get("/api/health/details").expect(200);

      expect(response.body.status).toBe("ok");
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.memory).toBeDefined();
      expect(response.body.memory.rss).toMatch(/\d+\.\d+ MB/);
      expect(response.body.memory.heapTotal).toMatch(/\d+\.\d+ MB/);
      expect(response.body.memory.heapUsed).toMatch(/\d+\.\d+ MB/);
      expect(response.body.system).toBeDefined();
      expect(response.body.services.database.status).toBe("healthy");
      expect(response.body.services.database.tableCount).toBe(25);
      expect(response.body.services.database.database).toBe("test_db");
      expect(response.body.performance).toBeDefined();
      expect(response.body.performance.eventLoopLag).toBe("normal");
    });

    it("should return degraded when database fails", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Query failed"));

      const response = await request(app).get("/api/health/details").expect(200);

      expect(response.body.status).toBe("degraded");
      expect(response.body.services.database.status).toBe("unhealthy");
      expect(response.body.services.database.error).toBe("Query failed");
    });

    it("should include performance metrics", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ table_count: 10 }]);

      const response = await request(app).get("/api/health/details").expect(200);

      expect(response.body.performance.eventLoopLag).toBe("normal");
      expect(response.body.performance.gcPauses).toBe("normal");
      expect(response.body.performance.activeHandles).toBeGreaterThanOrEqual(0);
      expect(response.body.performance.activeRequests).toBeGreaterThanOrEqual(0);
    });
  });

  describe("GET /api/health/dashboard", () => {
    it("should return HTML dashboard", async () => {
      const response = await request(app).get("/api/health/dashboard").expect(200);

      expect(response.headers["content-type"]).toMatch(/text\/html/);
      expect(response.text).toContain("System Health Dashboard");
      expect(response.text).toContain("<!DOCTYPE html>");
      expect(response.text).toContain("fetchHealth");
    });

    it("should include auto-refresh meta tag", async () => {
      const response = await request(app).get("/api/health/dashboard").expect(200);

      expect(response.text).toContain('http-equiv="refresh"');
      expect(response.text).toContain('content="30"');
    });

    it("should not require authentication", async () => {
      await request(app).get("/api/health/dashboard").expect(200);
    });

    it("should include responsive design", async () => {
      const response = await request(app).get("/api/health/dashboard").expect(200);

      expect(response.text).toContain("viewport");
      expect(response.text).toContain("width=device-width");
    });
  });

  describe("Kubernetes Probes", () => {
    it("liveness probe should always succeed", async () => {
      await request(app).get("/api/health/live").expect(200);
    });

    it("readiness probe should check database", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await request(app).get("/api/health/ready").expect(200);

      mockPrisma.$queryRaw.mockRejectedValue(new Error("DB down"));

      await request(app).get("/api/health/ready").expect(503);
    });
  });
});
