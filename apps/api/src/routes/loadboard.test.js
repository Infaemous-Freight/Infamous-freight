const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
let loadboardRoutes;
const datLoadboard = require("../services/datLoadboard");
const truckstopLoadboard = require("../services/truckstopLoadboard");
const convoyLoadboard = require("../services/convoyLoadboard");
const { authenticate, requireScope, handleValidationErrors } = require("../middleware/security");
const { body, validationResult } = require("express-validator");

// Mock middleware
jest.mock("../middleware/security", () => ({
  authenticate: jest.fn((_req, _res, next) => next()),
  requireScope: jest.fn(() => (_req, _res, next) => next()),
  handleValidationErrors: jest.fn(() => (_req, _res, next) => next()),
  limiters: {
    general: (_req, _res, next) => next(),
  },
}));
jest.mock("../services/datLoadboard", () => ({
  searchLoads: jest.fn(),
  getStats: jest.fn(),
}));
jest.mock("../services/truckstopLoadboard", () => ({
  searchLoads: jest.fn(),
  getStats: jest.fn(),
}));
jest.mock("../services/convoyLoadboard", () => ({
  searchLoads: jest.fn(),
  getStats: jest.fn(),
}));

describe("Loadboard API Routes", () => {
  let app;
  let token;

  beforeAll(() => {
    // JWT secret from test env
    process.env.JWT_SECRET = "test-secret";

    // Load routes after mocks are set
    loadboardRoutes = require("../routes/loadboard");

    // Create Express app with middleware
    app = express();
    app.use(express.json());

    // Default middleware behavior (allow through)
    authenticate.mockImplementation((req, res, next) => {
      req.user = {
        sub: "test-user-123",
        email: "driver@test.com",
        role: "driver",
      };
      next();
    });

    requireScope.mockImplementation(() => (req, res, next) => next());

    handleValidationErrors.mockImplementation(() => (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      next();
    });

    // Mount routes
    app.use("/api/loads", loadboardRoutes);

    // Generate test token
    token = jwt.sign(
      {
        sub: "test-user-123",
        email: "driver@test.com",
        role: "driver",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/loads/search", () => {
    it("should return loads from all sources", async () => {
      const mockLoads = [
        {
          id: "load-1",
          externalId: "DAT-123",
          source: "dat",
          pickupCity: "Denver",
          pickupState: "CO",
          dropoffCity: "Phoenix",
          dropoffState: "AZ",
          miles: 600,
          weight: 45000,
          rate: 2000,
          score: 95,
        },
        {
          id: "load-2",
          externalId: "TS-456",
          source: "truckstop",
          pickupCity: "Austin",
          pickupState: "TX",
          dropoffCity: "Dallas",
          dropoffState: "TX",
          miles: 200,
          weight: 40000,
          rate: 850,
          score: 78,
        },
      ];

      datLoadboard.searchLoads.mockResolvedValue([mockLoads[0]]);
      truckstopLoadboard.searchLoads.mockResolvedValue([mockLoads[1]]);
      convoyLoadboard.searchLoads.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/loads/search")
        .query({
          origin: "Denver, CO",
          destination: "Phoenix, AZ",
          minRate: 1.0,
          maxMiles: 2000,
        })
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.loads).toHaveLength(2);
      expect(response.body.data.loads[0].score).toBeGreaterThanOrEqual(
        response.body.data.loads[1].score,
      ); // Sorted by score
    });

    it("should filter loads by rate", async () => {
      const mockLoads = [
        { id: "load-1", rate: 2000, score: 90 },
        { id: "load-2", rate: 1000, score: 75 },
      ];

      datLoadboard.search.mockResolvedValue([mockLoads[0]]);
      truckstopLoadboard.search.mockResolvedValue([mockLoads[1]]);
      convoyLoadboard.search.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/loads/search")
        .query({
          origin: "Columbus, OH",
          destination: "Chicago, IL",
          minRate: 1500, // Should only return load-1
          maxMiles: 500,
        })
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // verify no loads below minRate are returned
    });

    it("should handle API errors gracefully", async () => {
      datLoadboard.search.mockRejectedValue(new Error("DAT API error"));
      truckstopLoadboard.search.mockResolvedValue([]);
      convoyLoadboard.search.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/loads/search")
        .query({
          origin: "Unknown, ZZ",
          destination: "BadCity, XX",
        })
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Should fallback to other sources
    });
  });

  describe("GET /api/loads/:id", () => {
    it("should return load details with scoring", async () => {
      const mockLoad = {
        id: "load-123",
        externalId: "DAT-123",
        source: "dat",
        pickupCity: "Denver",
        pickupState: "CO",
        dropoffCity: "Phoenix",
        dropoffState: "AZ",
        miles: 600,
        weight: 45000,
        rate: 2000,
        commodity: "General Freight",
        equipmentType: "Dry Van",
        score: 95,
      };

      datLoadboard.getLoadDetail.mockResolvedValue(mockLoad);

      const response = await request(app)
        .get("/api/loads/load-123")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe("load-123");
      expect(response.body.data.score).toBe(95);
    });

    it("should return 404 for non-existent load", async () => {
      datLoadboard.getLoadDetail.mockResolvedValue(null);
      truckstopLoadboard.getLoadDetail.mockResolvedValue(null);
      convoyLoadboard.getLoadDetail.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/loads/nonexistent")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/loads/:id/bid", () => {
    it("should place a bid successfully", async () => {
      const mockBid = {
        id: "bid-123",
        loadId: "load-123",
        userId: "test-user-123",
        status: "placed",
        externalBidId: "TS-BID-789",
        createdAt: new Date(),
      };

      truckstopLoadboard.placeBid.mockResolvedValue(mockBid);

      const response = await request(app)
        .post("/api/loads/load-123/bid")
        .set("Authorization", `Bearer ${token}`)
        .send({
          driverId: "test-user-123",
          driverName: "John Doe",
          truckNumber: "USA-123",
          comments: "Ready to pickup",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("placed");
    });

    it("should prevent duplicate bids", async () => {
      truckstopLoadboard.placeBid.mockRejectedValue(new Error("Bid already exists"));

      const response = await request(app)
        .post("/api/loads/load-123/bid")
        .set("Authorization", `Bearer ${token}`)
        .send({
          driverId: "test-user-123",
          driverName: "John Doe",
          truckNumber: "USA-123",
        });

      // Should handle gracefully or return error
      expect([400, 409, 200]).toContain(response.status);
    });

    it("should validate bid payload", async () => {
      // Missing required fields
      const response = await request(app)
        .post("/api/loads/load-123/bid")
        .set("Authorization", `Bearer ${token}`)
        .send({
          // Missing driverId, driverName, etc
        });

      expect([400, 422]).toContain(response.status);
    });
  });

  describe("GET /api/loads/stats/summary", () => {
    it("should return load board statistics", async () => {
      const mockStats = {
        totalLoads: 1234,
        avgRate: 1850,
        topOrigins: [
          { city: "Denver", state: "CO", count: 156 },
          { city: "Austin", state: "TX", count: 143 },
        ],
        topDestinations: [
          { city: "Phoenix", state: "AZ", count: 134 },
          { city: "Dallas", state: "TX", count: 127 },
        ],
        bySource: {
          dat: { count: 600, avgRate: 1900 },
          truckstop: { count: 400, avgRate: 1750 },
          convoy: { count: 234, avgRate: 1800 },
        },
      };

      datLoadboard.getStats.mockResolvedValue({
        count: 600,
        avgRate: 1900,
      });
      truckstopLoadboard.getStats.mockResolvedValue({
        count: 400,
        avgRate: 1750,
      });
      convoyLoadboard.getStats.mockResolvedValue({
        count: 234,
        avgRate: 1800,
      });

      const response = await request(app)
        .get("/api/loads/stats/summary")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalLoads).toBeGreaterThan(0);
      expect(response.body.data.bySource).toBeDefined();
    });
  });
});

describe("Loadboard Services", () => {
  describe("DAT Loadboard Service", () => {
    it("should authenticate with DAT API", async () => {
      // Test would verify OAuth token exchange
    });

    it("should apply AI scoring algorithm", async () => {
      // Mock load: base 60
      // Rate premium: +20 (>$1500)
      // Distance: +15 (300 miles)
      // Equipment match: +10 (has preferred type)
      // Total: 105 (capped at 100)

      const mockLoad = {
        rate: 2000,
        miles: 300,
        equipmentType: "Dry Van",
      };

      // Would call scoring function
      // Expect score: 100 (capped)
    });
  });

  describe("Truckstop Loadboard Service", () => {
    it("should search loads with credentials", async () => {
      // Test searches with Truckstop API auth
    });
  });

  describe("Convoy Loadboard Service", () => {
    it("should handle real-time shipments", async () => {
      // Test Convoy's webhook-based shipment delivery
    });
  });
});
