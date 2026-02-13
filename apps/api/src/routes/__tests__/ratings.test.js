/**
 * Ratings Routes Tests
 * Tests for driver rating and review endpoints
 *
 * Routes tested:
 * - POST /jobs/:jobId/rate - Rate a driver after job completion
 * - GET /drivers/:driverId/ratings - Get driver's ratings
 * - GET /drivers/stats/leaderboard - Driver leaderboard
 * - DELETE /ratings/:ratingId - Admin delete rating
 * - GET /drivers/:driverId/rating-summary - Rating summary
 */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// Mock Prisma
const mockPrisma = {
  job: {
    findUnique: jest.fn(),
  },
  driverRating: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  driverProfile: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("../../config/database", () => ({
  prisma: mockPrisma,
}));

// Mock middleware
jest.mock("../../middleware/security", () => ({
  limiters: {
    general: (req, res, next) => next(),
  },
  authenticate: (req, res, next) => {
    const auth = req.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const jwt = require("jsonwebtoken");
      req.user = jwt.decode(auth.replace("Bearer ", ""));
      if (!req.user) throw new Error("Invalid token");
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  },
  requireScope: (scope) => (req, res, next) => {
    if (!req.user || !req.user.scopes || !req.user.scopes.includes(scope)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  },
  auditLog: (req, res, next) => next(),
}));

jest.mock("../../middleware/validation", () => ({
  handleValidationErrors: (req, res, next) => {
    const { validationResult } = require("express-validator");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
}));

jest.mock("../../lib/structuredLogging", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Import after mocks
const ratingsRouter = require("../ratings");
const logger = require("../../lib/structuredLogging");

// Create test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", ratingsRouter);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
}

describe("Ratings Routes", () => {
  let app;
  const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

  // Helper to create JWT tokens
  function createToken(payload = {}) {
    return jwt.sign(
      {
        sub: "user-123",
        email: "test@example.com",
        scopes: ["shipment:rate", "admin:ratings"],
        ...payload,
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    );
  }

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /jobs/:jobId/rate", () => {
    const jobId = "123e4567-e89b-12d3-a456-426614174000";
    const driverId = "123e4567-e89b-12d3-a456-426614174001";

    it("should create rating for completed job", async () => {
      const mockJob = {
        id: jobId,
        shipperId: "user-123",
        driverId,
        status: "COMPLETED",
        driver: { id: driverId, name: "John Driver" },
      };

      mockPrisma.job.findUnique.mockResolvedValue(mockJob);
      mockPrisma.driverRating.findFirst.mockResolvedValue(null);
      mockPrisma.driverRating.create.mockResolvedValue({
        id: "rating-1",
        jobId,
        driverId,
        ratedBy: "user-123",
        rating: 5,
        comment: "Excellent service",
      });
      mockPrisma.driverRating.findMany.mockResolvedValue([{ rating: 5 }, { rating: 4 }]);
      mockPrisma.driverProfile.update.mockResolvedValue({});

      const token = createToken();
      const response = await request(app)
        .post(`/api/jobs/${jobId}/rate`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          rating: 5,
          comment: "Excellent service",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith(
        "Driver rated",
        expect.objectContaining({ jobId, driverId, rating: 5 }),
      );
    });

    it("should return 404 for non-existent job", async () => {
      mockPrisma.job.findUnique.mockResolvedValue(null);

      const token = createToken();
      const response = await request(app)
        .post(`/api/jobs/${jobId}/rate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 5 });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Job not found");
    });

    it("should return 403 if shipper does not own job", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: jobId,
        shipperId: "other-user",
        driverId,
        status: "COMPLETED",
      });

      const token = createToken();
      const response = await request(app)
        .post(`/api/jobs/${jobId}/rate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 5 });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Not authorized to rate this job");
    });

    it("should reject rating for non-completed job", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: jobId,
        shipperId: "user-123",
        driverId,
        status: "IN_PROGRESS",
      });

      const token = createToken();
      const response = await request(app)
        .post(`/api/jobs/${jobId}/rate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 5 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Can only rate completed deliveries");
    });

    it("should reject duplicate rating", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: jobId,
        shipperId: "user-123",
        driverId,
        status: "COMPLETED",
      });
      mockPrisma.driverRating.findFirst.mockResolvedValue({
        id: "existing-rating",
      });

      const token = createToken();
      const response = await request(app)
        .post(`/api/jobs/${jobId}/rate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 5 });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("You have already rated this job");
    });

    it("should validate rating range (1-5)", async () => {
      const token = createToken();
      const response = await request(app)
        .post(`/api/jobs/${jobId}/rate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 6 });

      expect(response.status).toBe(400);
    });

    it("should validate comment length", async () => {
      const token = createToken();
      const response = await request(app)
        .post(`/api/jobs/${jobId}/rate`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          rating: 5,
          comment: "x".repeat(501),
        });

      expect(response.status).toBe(400);
    });

    it("should accept rating without comment", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: jobId,
        shipperId: "user-123",
        driverId,
        status: "DELIVERED",
      });
      mockPrisma.driverRating.findFirst.mockResolvedValue(null);
      mockPrisma.driverRating.create.mockResolvedValue({
        id: "rating-1",
        jobId,
        driverId,
        rating: 4,
        comment: null,
      });
      mockPrisma.driverRating.findMany.mockResolvedValue([{ rating: 4 }]);
      mockPrisma.driverProfile.update.mockResolvedValue({});

      const token = createToken();
      const response = await request(app)
        .post(`/api/jobs/${jobId}/rate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 4 });

      expect(response.status).toBe(201);
    });

    it("should require authentication", async () => {
      const response = await request(app).post(`/api/jobs/${jobId}/rate`).send({ rating: 5 });

      expect(response.status).toBe(401);
    });

    it("should require shipment:rate scope", async () => {
      const token = createToken({ scopes: [] });
      const response = await request(app)
        .post(`/api/jobs/${jobId}/rate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 5 });

      expect(response.status).toBe(403);
    });
  });

  describe("GET /drivers/:driverId/ratings", () => {
    const driverId = "123e4567-e89b-12d3-a456-426614174001";

    it("should get driver ratings with pagination", async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        userId: driverId,
        rating: 4.5,
        acceptanceRate: 0.95,
        completionRate: 0.98,
      });

      const mockRatings = [
        {
          id: "rating-1",
          rating: 5,
          comment: "Great driver",
          job: { id: "job-1", dropoff: "NYC", createdAt: new Date() },
          createdAt: new Date(),
        },
      ];

      mockPrisma.driverRating.findMany.mockResolvedValue(mockRatings);
      mockPrisma.driverRating.count.mockResolvedValue(1);

      const response = await request(app).get(`/api/drivers/${driverId}/ratings`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.driver.avgRating).toBe(4.5);
      expect(response.body.data.ratings).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it("should return 404 for non-existent driver", async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue(null);

      const response = await request(app).get(`/api/drivers/${driverId}/ratings`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Driver not found");
    });

    it("should support pagination parameters", async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        userId: driverId,
        rating: 4.0,
      });
      mockPrisma.driverRating.findMany.mockResolvedValue([]);
      mockPrisma.driverRating.count.mockResolvedValue(50);

      const response = await request(app).get(`/api/drivers/${driverId}/ratings?page=2&limit=10`);

      expect(response.status).toBe(200);
      expect(mockPrisma.driverRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it("should limit max page size to 100", async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        userId: driverId,
        rating: 4.0,
      });
      mockPrisma.driverRating.findMany.mockResolvedValue([]);
      mockPrisma.driverRating.count.mockResolvedValue(200);

      const response = await request(app).get(`/api/drivers/${driverId}/ratings?limit=500`);

      expect(response.status).toBe(200);
      expect(mockPrisma.driverRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it("should handle invalid pagination values", async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        userId: driverId,
        rating: 4.0,
      });
      mockPrisma.driverRating.findMany.mockResolvedValue([]);
      mockPrisma.driverRating.count.mockResolvedValue(0);

      const response = await request(app).get(`/api/drivers/${driverId}/ratings?page=-1&limit=abc`);

      expect(response.status).toBe(200);
      // Should use defaults
      expect(mockPrisma.driverRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });
  });

  describe("GET /drivers/stats/leaderboard", () => {
    it("should return driver leaderboard", async () => {
      const mockDrivers = [
        {
          userId: "driver-1",
          rating: 4.9,
          acceptanceRate: 0.98,
          completionRate: 0.99,
          totalEarnings: 100000,
        },
        {
          userId: "driver-2",
          rating: 4.8,
          acceptanceRate: 0.95,
          completionRate: 0.97,
          totalEarnings: 90000,
        },
      ];

      mockPrisma.driverProfile.findMany.mockResolvedValue(mockDrivers);

      const response = await request(app).get("/api/drivers/stats/leaderboard");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].rank).toBe(1);
      expect(response.body.data[0].rating).toBe(4.9);
      expect(response.body.data[1].rank).toBe(2);
    });

    it("should support custom limit", async () => {
      mockPrisma.driverProfile.findMany.mockResolvedValue([]);

      const response = await request(app).get("/api/drivers/stats/leaderboard?limit=10");

      expect(response.status).toBe(200);
      expect(mockPrisma.driverProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });

    it("should limit max results to 100", async () => {
      mockPrisma.driverProfile.findMany.mockResolvedValue([]);

      const response = await request(app).get("/api/drivers/stats/leaderboard?limit=500");

      expect(response.status).toBe(200);
      expect(mockPrisma.driverProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it("should convert earnings from cents to dollars", async () => {
      mockPrisma.driverProfile.findMany.mockResolvedValue([
        {
          userId: "driver-1",
          rating: 4.5,
          acceptanceRate: 0.9,
          completionRate: 0.95,
          totalEarnings: 12345,
        },
      ]);

      const response = await request(app).get("/api/drivers/stats/leaderboard");

      expect(response.status).toBe(200);
      expect(response.body.data[0].earnings).toBe(123.45);
    });
  });

  describe("DELETE /ratings/:ratingId", () => {
    const ratingId = "123e4567-e89b-12d3-a456-426614174002";
    const driverId = "123e4567-e89b-12d3-a456-426614174001";

    it("should delete rating as admin", async () => {
      mockPrisma.driverRating.findUnique.mockResolvedValue({
        id: ratingId,
        driverId,
        rating: 1,
      });
      mockPrisma.driverRating.delete.mockResolvedValue({});
      mockPrisma.driverRating.findMany.mockResolvedValue([{ rating: 5 }, { rating: 4 }]);
      mockPrisma.driverProfile.update.mockResolvedValue({});

      const token = createToken();
      const response = await request(app)
        .delete(`/api/ratings/${ratingId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        "Rating deleted",
        expect.objectContaining({ ratingId, driverId }),
      );
    });

    it("should return 404 for non-existent rating", async () => {
      mockPrisma.driverRating.findUnique.mockResolvedValue(null);

      const token = createToken();
      const response = await request(app)
        .delete(`/api/ratings/${ratingId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Rating not found");
    });

    it("should recalculate driver rating after deletion", async () => {
      mockPrisma.driverRating.findUnique.mockResolvedValue({
        id: ratingId,
        driverId,
      });
      mockPrisma.driverRating.delete.mockResolvedValue({});
      mockPrisma.driverRating.findMany.mockResolvedValue([{ rating: 5 }, { rating: 3 }]);
      mockPrisma.driverProfile.update.mockResolvedValue({});

      const token = createToken();
      await request(app).delete(`/api/ratings/${ratingId}`).set("Authorization", `Bearer ${token}`);

      expect(mockPrisma.driverProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { rating: 4.0 },
        }),
      );
    });

    it("should set rating to 0 when no ratings remain", async () => {
      mockPrisma.driverRating.findUnique.mockResolvedValue({
        id: ratingId,
        driverId,
      });
      mockPrisma.driverRating.delete.mockResolvedValue({});
      mockPrisma.driverRating.findMany.mockResolvedValue([]);
      mockPrisma.driverProfile.update.mockResolvedValue({});

      const token = createToken();
      await request(app).delete(`/api/ratings/${ratingId}`).set("Authorization", `Bearer ${token}`);

      expect(mockPrisma.driverProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { rating: 0 },
        }),
      );
    });

    it("should require authentication", async () => {
      const response = await request(app).delete(`/api/ratings/${ratingId}`);

      expect(response.status).toBe(401);
    });

    it("should require admin:ratings scope", async () => {
      const token = createToken({ scopes: ["shipment:rate"] });
      const response = await request(app)
        .delete(`/api/ratings/${ratingId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  describe("GET /drivers/:driverId/rating-summary", () => {
    const driverId = "123e4567-e89b-12d3-a456-426614174001";

    it("should return rating summary with distribution", async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        rating: 4.5,
        acceptanceRate: 0.95,
        completionRate: 0.98,
      });

      mockPrisma.driverRating.groupBy.mockResolvedValue([
        { rating: 5, _count: 10 },
        { rating: 4, _count: 5 },
        { rating: 3, _count: 2 },
      ]);

      const response = await request(app).get(`/api/drivers/${driverId}/rating-summary`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.avgRating).toBe(4.5);
      expect(response.body.data.totalRatings).toBe(17);
      expect(response.body.data.distribution).toEqual({
        5: 10,
        4: 5,
        3: 2,
        2: 0,
        1: 0,
      });
    });

    it("should return 404 for non-existent driver", async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue(null);

      const response = await request(app).get(`/api/drivers/${driverId}/rating-summary`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Driver not found");
    });

    it("should handle driver with no ratings", async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        rating: null,
        acceptanceRate: 0.0,
        completionRate: 0.0,
      });
      mockPrisma.driverRating.groupBy.mockResolvedValue([]);

      const response = await request(app).get(`/api/drivers/${driverId}/rating-summary`);

      expect(response.status).toBe(200);
      expect(response.body.data.avgRating).toBe(0);
      expect(response.body.data.totalRatings).toBe(0);
      expect(response.body.data.distribution).toEqual({
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockPrisma.driverProfile.findMany.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app).get("/api/drivers/stats/leaderboard");

      expect(response.status).toBe(500);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
