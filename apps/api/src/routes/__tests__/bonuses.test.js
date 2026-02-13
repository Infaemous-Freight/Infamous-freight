/**
 * Bonuses Routes Tests
 * Tests for referral, loyalty, points, and rewards system routes
 * Uses real service implementations for integration testing
 */

const request = require("supertest");
const express = require("express");
const { generateTestJWT } = require("../../__tests__/helpers/jwt");

// Mock dependencies
jest.mock("../../middleware/security", () => ({
  limiters: {
    general: (req, res, next) => next(),
    ai: (req, res, next) => next(),
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

jest.mock("../../middleware/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocks
const bonusesRouter = require("../bonuses");

// Create test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/bonuses", bonusesRouter);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
}

// Test suite
describe("Bonuses Routes", () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe("POST /api/bonuses/referral/generate", () => {
    it("should generate referral code", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:referral"],
      });

      const response = await request(app)
        .post("/api/bonuses/referral/generate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          referrerEmail: "referrer@test.com",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.referralCode).toBeDefined();
      expect(response.body.data.shareUrl).toBeDefined();
    });

    it("should reject request without required scope", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["other:scope"],
      });

      const response = await request(app)
        .post("/api/bonuses/referral/generate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          referrerEmail: "test@test.com",
        });

      expect(response.status).toBe(403);
    });

    it("should reject unauthenticated request", async () => {
      const response = await request(app).post("/api/bonuses/referral/generate").send({
        referrerEmail: "test@test.com",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/bonuses/referral/claim", () => {
    it("should claim referral bonus", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:referral"],
        tier: "silver",
      });

      const response = await request(app)
        .post("/api/bonuses/referral/claim")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          referralCode: "REF-123456-ABC",
          shipmentCount: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe("GET /api/bonuses/referral/:code", () => {
    it("should get referral information", async () => {
      const response = await request(app).get("/api/bonuses/referral/REF-123456-ABC");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.referralCode).toBe("REF-123456-ABC");
    });
  });

  describe("GET /api/bonuses/loyalty/tier/:customerId", () => {
    it("should get customer tier information", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:loyalty"],
      });

      const response = await request(app)
        .get("/api/bonuses/loyalty/tier/customer_123")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject without authentication", async () => {
      const response = await request(app).get("/api/bonuses/loyalty/tier/customer_123");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/bonuses/loyalty/enroll", () => {
    it("should enroll customer in loyalty program", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:loyalty"],
      });

      const response = await request(app)
        .post("/api/bonuses/loyalty/enroll")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tier: "bronze",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should reject without required scope", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["other:scope"],
      });

      const response = await request(app)
        .post("/api/bonuses/loyalty/enroll")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tier: "bronze",
        });

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/bonuses/loyalty/upgrade-progress/:customerId", () => {
    it("should get tier upgrade progress", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:loyalty"],
      });

      const response = await request(app)
        .get("/api/bonuses/loyalty/upgrade-progress/customer_123")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /api/bonuses/points/earn", () => {
    it("should award points for activity", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:points"],
      });

      const response = await request(app)
        .post("/api/bonuses/points/earn")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          activityType: "shipment",
          activityId: "ship_123",
          points: 100,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject missing activity type", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:points"],
      });

      const response = await request(app)
        .post("/api/bonuses/points/earn")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          points: 100,
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/bonuses/points/redeem", () => {
    it("should redeem points for rewards", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:redeem"],
      });

      const response = await request(app)
        .post("/api/bonuses/points/redeem")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          pointsToRedeem: 500,
          method: "accountCredit",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject invalid redemption amount", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:redeem"],
      });

      const response = await request(app)
        .post("/api/bonuses/points/redeem")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          pointsToRedeem: 10, // Less than minimum (50)
          method: "accountCredit",
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid redemption method", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:redeem"],
      });

      const response = await request(app)
        .post("/api/bonuses/points/redeem")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          pointsToRedeem: 500,
          method: "invalid_method", // Not in allowed list
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/bonuses/points/balance/:customerId", () => {
    it("should get points balance", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:points"],
      });

      const response = await request(app)
        .get("/api/bonuses/points/balance/customer_123")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/bonuses/milestones/:customerId", () => {
    it("should get milestone achievements", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:milestones"],
      });

      const response = await request(app)
        .get("/api/bonuses/milestones/customer_123")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /api/bonuses/performance/calculate", () => {
    it("should calculate driver performance bonus", async () => {
      const authToken = generateTestJWT({
        sub: "driver_123",
        scopes: ["bonus:performance"],
      });

      const response = await request(app)
        .post("/api/bonuses/performance/calculate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          driverId: "driver_123",
          metrics: {
            deliveries: 50,
            rating: 4.8,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/bonuses/report/:customerId", () => {
    it("should generate loyalty report", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:report"],
      });

      const response = await request(app)
        .get("/api/bonuses/report/customer_123")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject without authentication", async () => {
      const response = await request(app).get("/api/bonuses/report/customer_123");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/bonuses/health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/bonuses/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("operational");
    });
  });

  describe("Security & Validation", () => {
    it("should validate request body", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:loyalty"],
      });

      const response = await request(app)
        .post("/api/bonuses/loyalty/enroll")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tier: "bronze",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should validate referral code format", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["bonus:referral"],
      });

      const response = await request(app)
        .post("/api/bonuses/referral/claim")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          referralCode: "",
          shipmentCount: 1,
        });

      expect(response.status).toBe(400);
    });
  });
});
