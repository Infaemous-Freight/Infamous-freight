/**
 * Tests for recommendations routes
 */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// Mock dependencies
jest.mock("../../middleware/logger");

// Create global prisma mock (used by recommendations.js without explicit import)
global.prisma = {
  shipment: {
    findMany: jest.fn(),
  },
  recommendationLog: {
    count: jest.fn(),
  },
  recommendationFeedback: {
    create: jest.fn(),
  },
};

// Mock Prisma
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => global.prisma),
}));

// Mock recommendationService
const mockRecommendationService = {
  getServiceRecommendations: jest.fn(),
  getRouteRecommendations: jest.fn(),
  getDriverRecommendations: jest.fn(),
  getVehicleRecommendations: jest.fn(),
  getPricingRecommendations: jest.fn(),
  getPersonalizedRecommendations: jest.fn(),
  getSimilarCustomers: jest.fn(),
  getSimilarShipments: jest.fn(),
  getTopItems: jest.fn(),
};

jest.mock("../../services/recommendationService", () => mockRecommendationService);

// Mock express-validator
jest.mock("express-validator", () => {
  const createChain = () => {
    const chain = (req, res, next) => next();
    chain.isString = () => createChain();
    chain.isObject = () => createChain();
    chain.isFloat = () => createChain();
    chain.isInt = () => createChain();
    chain.isArray = () => createChain();
    chain.isIn = () => createChain();
    chain.isBoolean = () => createChain();
    chain.isISO8601 = () => createChain();
    chain.notEmpty = () => createChain();
    chain.optional = () => createChain();
    chain.withMessage = () => createChain();
    return chain;
  };

  return {
    body: jest.fn(() => createChain()),
    param: jest.fn(() => createChain()),
    query: jest.fn(() => createChain()),
    validationResult: jest.fn(() => ({
      isEmpty: jest.fn(() => true),
    })),
  };
});

// Setup middleware mocks BEFORE requiring the router
jest.mock("../../middleware/security", () => {
  const mockAuthenticate = jest.fn((req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const jwt = require("jsonwebtoken");
    req.user = jwt.decode(token);
    next();
  });

  const mockRequireScope = jest.fn((scope) => (req, res, next) => {
    if (!req.user?.scopes?.includes(scope)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  });

  return {
    authenticate: mockAuthenticate,
    requireScope: mockRequireScope,
    limiters: {
      general: jest.fn((req, res, next) => next()),
    },
    auditLog: jest.fn((req, res, next) => next()),
  };
});

jest.mock("../../middleware/validation", () => ({
  handleValidationErrors: jest.fn((req, res, next) => next()),
}));

// Import router after all mocks
const router = require("../recommendations");
const { authenticate, requireScope, limiters, auditLog } = require("../../middleware/security");

// Setup Express app
const app = express();
app.use(express.json());
app.use("/api/recommendations", router);

// Helper to create JWT token
const createToken = (scopes = []) => {
  return jwt.sign({ sub: "test-user-id", scopes }, "test-secret", { expiresIn: "1h" });
};

describe("Recommendations Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== SERVICE RECOMMENDATIONS ====================

  describe("POST /api/recommendations/services", () => {
    const token = createToken(["recommendations:view"]);
    const requestData = {
      customerId: "customer-123",
      origin: { lat: 40.7128, lng: -74.006 },
      destination: { lat: 34.0522, lng: -118.2437 },
      weight: 100,
      urgency: "express",
      budget: 500,
    };

    it("should return service recommendations", async () => {
      mockRecommendationService.getServiceRecommendations.mockResolvedValue([
        { service: "express", score: 0.95, estimatedCost: 450 },
        { service: "standard", score: 0.75, estimatedCost: 300 },
      ]);

      const response = await request(app)
        .post("/api/recommendations/services")
        .set("Authorization", `Bearer ${token}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/recommendations/services").send(requestData);

      expect(response.status).toBe(401);
    });

    it("should return 403 without recommendations:view scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .post("/api/recommendations/services")
        .set("Authorization", `Bearer ${tokenNoScope}`)
        .send(requestData);

      expect(response.status).toBe(403);
    });
  });

  // ==================== ROUTE RECOMMENDATIONS ====================

  describe("POST /api/recommendations/routes", () => {
    const token = createToken(["recommendations:view"]);
    const requestData = {
      origin: { lat: 40.7128, lng: -74.006 },
      destination: { lat: 34.0522, lng: -118.2437 },
      vehicleType: "truck",
      urgency: "standard",
      avoidTolls: false,
    };

    it("should return route recommendations", async () => {
      mockRecommendationService.getRouteRecommendations.mockResolvedValue([
        { route: "I-80 West", distance: 2800, duration: 40, cost: 350 },
        { route: "I-70 West", distance: 2900, duration: 42, cost: 360 },
      ]);

      const response = await request(app)
        .post("/api/recommendations/routes")
        .set("Authorization", `Bearer ${token}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/recommendations/routes").send(requestData);

      expect(response.status).toBe(401);
    });

    it("should return 403 without recommendations:view scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .post("/api/recommendations/routes")
        .set("Authorization", `Bearer ${tokenNoScope}`)
        .send(requestData);

      expect(response.status).toBe(403);
    });
  });

  // ==================== DRIVER RECOMMENDATIONS ====================

  describe("POST /api/recommendations/drivers", () => {
    const token = createToken(["recommendations:view"]);
    const requestData = {
      origin: { lat: 40.7128, lng: -74.006 },
      destination: { lat: 34.0522, lng: -118.2437 },
      vehicleType: "truck",
      pickupTime: "2026-02-15T10:00:00Z",
    };

    it("should return driver recommendations", async () => {
      mockRecommendationService.getDriverRecommendations.mockResolvedValue([
        { driverId: "driver-1", score: 0.95, availability: "available" },
        { driverId: "driver-2", score: 0.85, availability: "available" },
      ]);

      const response = await request(app)
        .post("/api/recommendations/drivers")
        .set("Authorization", `Bearer ${token}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/recommendations/drivers").send(requestData);

      expect(response.status).toBe(401);
    });

    it("should return 403 without recommendations:view scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .post("/api/recommendations/drivers")
        .set("Authorization", `Bearer ${tokenNoScope}`)
        .send(requestData);

      expect(response.status).toBe(403);
    });
  });

  // ==================== VEHICLE RECOMMENDATIONS ====================

  describe("POST /api/recommendations/vehicles", () => {
    const token = createToken(["recommendations:view"]);
    const requestData = {
      weight: 1000,
      dimensions: { length: 10, width: 5, height: 5 },
      cargoType: "electronics",
      origin: { lat: 40.7128, lng: -74.006 },
    };

    it("should return vehicle recommendations", async () => {
      mockRecommendationService.getVehicleRecommendations.mockResolvedValue([
        { vehicleId: "vehicle-1", type: "box-truck", capacity: 1500, score: 0.9 },
        { vehicleId: "vehicle-2", type: "cargo-van", capacity: 1200, score: 0.8 },
      ]);

      const response = await request(app)
        .post("/api/recommendations/vehicles")
        .set("Authorization", `Bearer ${token}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/recommendations/vehicles").send(requestData);

      expect(response.status).toBe(401);
    });

    it("should return 403 without recommendations:view scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .post("/api/recommendations/vehicles")
        .set("Authorization", `Bearer ${tokenNoScope}`)
        .send(requestData);

      expect(response.status).toBe(403);
    });
  });

  // ==================== PRICING RECOMMENDATIONS ====================

  describe("POST /api/recommendations/pricing", () => {
    const token = createToken(["recommendations:view"]);
    const requestData = {
      origin: { lat: 40.7128, lng: -74.006 },
      destination: { lat: 34.0522, lng: -118.2437 },
      weight: 500,
      serviceType: "standard",
    };

    it("should return pricing recommendations", async () => {
      mockRecommendationService.getPricingRecommendations.mockResolvedValue({
        recommendedPrice: 350,
        priceRange: { min: 300, max: 400 },
        competitorPrices: [320, 380],
        marketPosition: "competitive",
      });

      const response = await request(app)
        .post("/api/recommendations/pricing")
        .set("Authorization", `Bearer ${token}`)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedPrice).toBe(350);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/recommendations/pricing").send(requestData);

      expect(response.status).toBe(401);
    });

    it("should return 403 without recommendations:view scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .post("/api/recommendations/pricing")
        .set("Authorization", `Bearer ${tokenNoScope}`)
        .send(requestData);

      expect(response.status).toBe(403);
    });
  });

  // ==================== PERSONALIZED RECOMMENDATIONS ====================

  describe("GET /api/recommendations/personalized/:customerId", () => {
    const token = createToken(["recommendations:view"]);

    it("should return personalized recommendations", async () => {
      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue({
        suggestedServices: ["express", "white-glove"],
        frequentRoutes: ["NYC-LA", "LA-SF"],
        costSavings: 150,
      });

      const response = await request(app)
        .get("/api/recommendations/personalized/customer-123")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestedServices).toHaveLength(2);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/recommendations/personalized/customer-123");

      expect(response.status).toBe(401);
    });

    it("should return 403 without recommendations:view scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .get("/api/recommendations/personalized/customer-123")
        .set("Authorization", `Bearer ${tokenNoScope}`);

      expect(response.status).toBe(403);
    });
  });

  // ==================== SIMILAR ITEMS ====================

  describe("POST /api/recommendations/similar", () => {
    const token = createToken(["recommendations:view"]);

    it("should find similar customers", async () => {
      mockRecommendationService.getSimilarCustomers.mockResolvedValue([
        { customerId: "customer-2", similarity: 0.85 },
        { customerId: "customer-3", similarity: 0.75 },
      ]);

      const response = await request(app)
        .post("/api/recommendations/similar")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemType: "customer", itemId: "customer-123", limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(mockRecommendationService.getSimilarCustomers).toHaveBeenCalledWith(
        "customer-123",
        10,
      );
    });

    it("should find similar shipments", async () => {
      mockRecommendationService.getSimilarShipments.mockResolvedValue([
        { shipmentId: "shipment-2", similarity: 0.9 },
      ]);

      const response = await request(app)
        .post("/api/recommendations/similar")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemType: "shipment", itemId: "shipment-123", limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(mockRecommendationService.getSimilarShipments).toHaveBeenCalledWith("shipment-123", 5);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .post("/api/recommendations/similar")
        .send({ itemType: "customer", itemId: "customer-123" });

      expect(response.status).toBe(401);
    });

    it("should return 403 without recommendations:view scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .post("/api/recommendations/similar")
        .set("Authorization", `Bearer ${tokenNoScope}`)
        .send({ itemType: "customer", itemId: "customer-123" });

      expect(response.status).toBe(403);
    });
  });

  // ==================== FEEDBACK ====================

  describe("POST /api/recommendations/feedback", () => {
    const token = createToken(["recommendations:update"]);

    it("should record feedback successfully", async () => {
      global.prisma.recommendationFeedback.create.mockResolvedValue({
        id: "feedback-123",
        recommendationId: "rec-123",
      });

      const response = await request(app)
        .post("/api/recommendations/feedback")
        .set("Authorization", `Bearer ${token}`)
        .send({
          recommendationId: "rec-123",
          recommendationType: "service",
          itemId: "service-1",
          action: "accepted",
          rating: 5,
          feedback: "Great recommendation!",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(auditLog).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/recommendations/feedback").send({
        recommendationId: "rec-123",
        recommendationType: "service",
        itemId: "service-1",
        action: "accepted",
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 without recommendations:update scope", async () => {
      const tokenNoScope = createToken(["recommendations:view"]);
      const response = await request(app)
        .post("/api/recommendations/feedback")
        .set("Authorization", `Bearer ${tokenNoScope}`)
        .send({
          recommendationId: "rec-123",
          recommendationType: "service",
          itemId: "service-1",
          action: "accepted",
        });

      expect(response.status).toBe(403);
    });
  });

  // ==================== INSIGHTS ====================

  describe("GET /api/recommendations/insights/:customerId", () => {
    const token = createToken(["recommendations:view"]);

    it("should return customer insights", async () => {
      global.prisma.shipment.findMany.mockResolvedValue([
        { id: "shipment-1", customerId: "customer-123", price: 100, serviceType: "express" },
        { id: "shipment-2", customerId: "customer-123", price: 150, serviceType: "express" },
      ]);

      mockRecommendationService.getTopItems.mockReturnValue([{ item: "express", frequency: 2 }]);

      const response = await request(app)
        .get("/api/recommendations/insights/customer-123?timeRange=month")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalShipments).toBe(2);
      expect(response.body.data.totalSpending).toBe(250);
    });

    it("should accept custom time range", async () => {
      global.prisma.shipment.findMany.mockResolvedValue([]);
      mockRecommendationService.getTopItems.mockReturnValue([]);

      const response = await request(app)
        .get("/api/recommendations/insights/customer-123?timeRange=quarter")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.timeRange).toBe("quarter");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/recommendations/insights/customer-123");

      expect(response.status).toBe(401);
    });

    it("should return 403 without recommendations:view scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .get("/api/recommendations/insights/customer-123")
        .set("Authorization", `Bearer ${tokenNoScope}`);

      expect(response.status).toBe(403);
    });
  });

  // ==================== TRENDING ====================

  describe("GET /api/recommendations/trending", () => {
    const token = createToken(["recommendations:view"]);

    it("should return trending data for all categories", async () => {
      global.prisma.shipment.findMany.mockResolvedValue([
        { serviceType: "express", origin: "NYC", destination: "LA", features: ["insurance"] },
        { serviceType: "express", origin: "NYC", destination: "LA", features: ["tracking"] },
      ]);

      mockRecommendationService.getTopItems.mockReturnValue([{ item: "express", frequency: 2 }]);

      const response = await request(app)
        .get("/api/recommendations/trending?category=all&limit=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("services");
      expect(response.body.data).toHaveProperty("routes");
      expect(response.body.data).toHaveProperty("features");
    });

    it("should filter by category", async () => {
      global.prisma.shipment.findMany.mockResolvedValue([
        { serviceType: "express", origin: "NYC", destination: "LA" },
      ]);

      mockRecommendationService.getTopItems.mockReturnValue([{ item: "express", frequency: 1 }]);

      const response = await request(app)
        .get("/api/recommendations/trending?category=services")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("services");
      expect(response.body.data).not.toHaveProperty("routes");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/recommendations/trending");

      expect(response.status).toBe(401);
    });

    it("should return 403 without recommendations:view scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .get("/api/recommendations/trending")
        .set("Authorization", `Bearer ${tokenNoScope}`);

      expect(response.status).toBe(403);
    });
  });

  // ==================== HEALTH CHECK ====================

  describe("GET /api/recommendations/health", () => {
    it("should return healthy status", async () => {
      global.prisma.recommendationLog.count.mockResolvedValue(150);

      const response = await request(app).get("/api/recommendations/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("healthy");
      expect(response.body.stats.recommendationsGenerated24h).toBe(150);
    });

    it("should return unhealthy status on error", async () => {
      global.prisma.recommendationLog.count.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await request(app).get("/api/recommendations/health");

      expect(response.status).toBe(503);
      expect(response.body.status).toBe("unhealthy");
    });

    it("should not require authentication", async () => {
      global.prisma.recommendationLog.count.mockResolvedValue(100);

      const response = await request(app).get("/api/recommendations/health");

      expect(response.status).toBe(200);
    });
  });

  // ==================== MIDDLEWARE INTEGRATION ====================

  describe("Middleware Integration", () => {
    it("should apply rate limiting", async () => {
      const token = createToken(["recommendations:view"]);
      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue({});

      await request(app)
        .get("/api/recommendations/personalized/customer-123")
        .set("Authorization", `Bearer ${token}`);

      expect(limiters.general).toHaveBeenCalled();
    });

    it("should apply audit logging to feedback", async () => {
      const token = createToken(["recommendations:update"]);
      global.prisma.recommendationFeedback.create.mockResolvedValue({
        id: "feedback-123",
      });

      await request(app)
        .post("/api/recommendations/feedback")
        .set("Authorization", `Bearer ${token}`)
        .send({
          recommendationId: "rec-123",
          recommendationType: "service",
          itemId: "service-1",
          action: "accepted",
        });

      expect(auditLog).toHaveBeenCalled();
    });
  });
});
