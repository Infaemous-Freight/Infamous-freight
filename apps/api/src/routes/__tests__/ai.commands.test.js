const express = require("express");
const request = require("supertest");

// Mock modules first
const mockPrisma = {
  aiEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockPredictProfit = jest.fn();

jest.mock("../../db/prisma", () => ({
  prisma: mockPrisma,
}));

jest.mock("../../services/aiProfitService", () => ({
  predictProfit: mockPredictProfit,
}));

jest.mock("../../middleware/cache", () => ({
  cacheMiddleware: jest.fn(() => (req, res, next) => next()),
}));

jest.mock("../../middleware/security", () => ({
  limiters: {
    ai: jest.fn((req, res, next) => next()),
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

jest.mock("../../middleware/validation", () => ({
  validateString: jest.fn(() => (req, res, next) => next()),
  handleValidationErrors: jest.fn((req, res, next) => next()),
}));

// Now require the router
const aiCommandsRouter = require("../ai.commands");

// Create test app
const app = express();
app.use(express.json());
app.use("/api", aiCommandsRouter);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Helper to create JWT token
const jwt = require("jsonwebtoken");
const createToken = (scopes = []) => {
  return jwt.sign({ sub: "user123", scopes }, "test-secret", { expiresIn: "1h" });
};

describe("AI Commands Routes", () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env.ENABLE_AI_COMMANDS;
  });

  afterAll(() => {
    process.env.ENABLE_AI_COMMANDS = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENABLE_AI_COMMANDS = "true";
    mockPrisma.aiEvent.create.mockResolvedValue({
      id: "event1",
      userId: "user123",
      command: "test command",
      response: "pending",
    });
    mockPrisma.aiEvent.findMany.mockResolvedValue([]);
  });

  describe("POST /api/ai/command", () => {
    it("should process AI command when enabled", async () => {
      const token = createToken(["ai:command"]);
      const response = await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "analyze shipment trends" })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.command).toBe("analyze shipment trends");
      expect(response.body.result).toBe("AI processing queued");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("processingTime");
      expect(mockPrisma.aiEvent.create).toHaveBeenCalledWith({
        data: {
          userId: "user123",
          command: "analyze shipment trends",
          response: "pending",
          provider: expect.any(String),
        },
      });
    });

    it("should return 503 when AI commands are disabled", async () => {
      process.env.ENABLE_AI_COMMANDS = "false";
      const token = createToken(["ai:command"]);

      const response = await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" })
        .expect(503);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe("AI commands are currently disabled");
      expect(mockPrisma.aiEvent.create).not.toHaveBeenCalled();
    });

    it("should still work when prisma operations succeed", async () => {
      const token = createToken(["ai:command"]);
      const response = await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test command" })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.command).toBe("test command");
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).post("/api/ai/command").send({ command: "test" }).expect(401);
    });

    it("should return 403 when missing ai:command scope", async () => {
      const token = createToken(["other:scope"]);

      await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" })
        .expect(403);
    });

    it("should use synthetic provider when AI_PROVIDER not set", async () => {
      delete process.env.AI_PROVIDER;
      const token = createToken(["ai:command"]);

      await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" })
        .expect(200);

      expect(mockPrisma.aiEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: "synthetic",
        }),
      });
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.aiEvent.create.mockRejectedValue(new Error("Database error"));
      const token = createToken(["ai:command"]);

      await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" })
        .expect(500);
    });
  });

  describe("POST /api/ai/profit-predict", () => {
    it("should predict profit with valid input", async () => {
      const mockPrediction = {
        revenue: 2000,
        costs: 1200,
        profit: 800,
        profitMargin: 0.4,
      };
      mockPredictProfit.mockReturnValue(mockPrediction);

      const token = createToken(["ai:predict"]);
      const response = await request(app)
        .post("/api/ai/profit-predict")
        .set("Authorization", `Bearer ${token}`)
        .send({
          origin: { lat: 40.7128, lng: -74.006 },
          destination: { lat: 34.0522, lng: -118.2437 },
          distanceMiles: 2800,
          weight: 45000,
          ratePerMile: 2.5,
        })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.prediction).toEqual(mockPrediction);
      expect(response.body).toHaveProperty("timestamp");
      expect(mockPredictProfit).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: { lat: 40.7128, lng: -74.006 },
          destination: { lat: 34.0522, lng: -118.2437 },
          distanceMiles: 2800,
          weight: 45000,
          ratePerMile: 2.5,
        }),
      );
    });

    it("should work with minimal input", async () => {
      const mockPrediction = { profit: 500 };
      mockPredictProfit.mockReturnValue(mockPrediction);

      const token = createToken(["ai:predict"]);
      const response = await request(app)
        .post("/api/ai/profit-predict")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.prediction).toEqual(mockPrediction);
      expect(mockPredictProfit).toHaveBeenCalledWith({});
    });

    it("should accept all optional parameters", async () => {
      const mockPrediction = { profit: 1000 };
      mockPredictProfit.mockReturnValue(mockPrediction);

      const token = createToken(["ai:predict"]);
      const response = await request(app)
        .post("/api/ai/profit-predict")
        .set("Authorization", `Bearer ${token}`)
        .send({
          origin: { lat: 40.0, lng: -74.0 },
          destination: { lat: 34.0, lng: -118.0 },
          distanceMiles: 2800,
          weight: 45000,
          ratePerMile: 2.5,
          fuelPricePerGallon: 3.5,
          mpg: 6.5,
          maintenancePerMile: 0.15,
          insurancePerMile: 0.1,
          handlingFee: 150,
        })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(mockPredictProfit).toHaveBeenCalledWith(
        expect.objectContaining({
          distanceMiles: 2800,
          weight: 45000,
          fuelPricePerGallon: 3.5,
          mpg: 6.5,
          maintenancePerMile: 0.15,
          insurancePerMile: 0.1,
          handlingFee: 150,
        }),
      );
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).post("/api/ai/profit-predict").send({}).expect(401);
    });

    it("should return 403 when missing ai:predict scope", async () => {
      const token = createToken(["other:scope"]);

      await request(app)
        .post("/api/ai/profit-predict")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(403);
    });

    it("should handle predictProfit errors", async () => {
      mockPredictProfit.mockImplementation(() => {
        throw new Error("Prediction error");
      });

      const token = createToken(["ai:predict"]);
      await request(app)
        .post("/api/ai/profit-predict")
        .set("Authorization", `Bearer ${token}`)
        .send({ distanceMiles: 2800 })
        .expect(500);
    });
  });

  describe("GET /api/ai/history", () => {
    it("should return AI command history with default pagination", async () => {
      const mockHistory = [
        {
          id: "event1",
          userId: "user123",
          command: "analyze trends",
          response: "completed",
          createdAt: "2026-02-13T00:00:00.000Z",
        },
        {
          id: "event2",
          userId: "user123",
          command: "predict profit",
          response: "completed",
          createdAt: "2026-02-12T00:00:00.000Z",
        },
      ];
      mockPrisma.aiEvent.findMany.mockResolvedValue(mockHistory);

      const token = createToken(["ai:history"]);
      const response = await request(app)
        .get("/api/ai/history")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.history).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(response.body.pagination).toEqual({ take: 20, skip: 0 });
      expect(mockPrisma.aiEvent.findMany).toHaveBeenCalledWith({
        where: { userId: "user123" },
        take: 20,
        skip: 0,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should accept custom pagination parameters", async () => {
      mockPrisma.aiEvent.findMany.mockResolvedValue([]);

      const token = createToken(["ai:history"]);
      const response = await request(app)
        .get("/api/ai/history")
        .query({ take: 10, skip: 5 })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.pagination).toEqual({ take: 10, skip: 5 });
      expect(mockPrisma.aiEvent.findMany).toHaveBeenCalledWith({
        where: { userId: "user123" },
        take: 10,
        skip: 5,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should enforce maximum take limit of 100", async () => {
      mockPrisma.aiEvent.findMany.mockResolvedValue([]);

      const token = createToken(["ai:history"]);
      const response = await request(app)
        .get("/api/ai/history")
        .query({ take: 500 })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.pagination.take).toBe(100);
      expect(mockPrisma.aiEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it("should handle empty history", async () => {
      mockPrisma.aiEvent.findMany.mockResolvedValue([]);

      const token = createToken(["ai:history"]);
      const response = await request(app)
        .get("/api/ai/history")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.history).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it("should handle various pagination values correctly", async () => {
      mockPrisma.aiEvent.findMany.mockResolvedValue([]);

      const token = createToken(["ai:history"]);
      const response = await request(app)
        .get("/api/ai/history")
        .query({ take: 50, skip: 10 })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.history).toEqual([]);
      expect(response.body.count).toBe(0);
      expect(response.body.pagination).toEqual({ take: 50, skip: 10 });
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/ai/history").expect(401);
    });

    it("should return 403 when missing ai:history scope", async () => {
      const token = createToken(["other:scope"]);

      await request(app).get("/api/ai/history").set("Authorization", `Bearer ${token}`).expect(403);
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.aiEvent.findMany.mockRejectedValue(new Error("Database error"));
      const token = createToken(["ai:history"]);

      await request(app).get("/api/ai/history").set("Authorization", `Bearer ${token}`).expect(500);
    });
  });

  describe("Feature Flag and Environment", () => {
    it("should respect ENABLE_AI_COMMANDS environment variable", async () => {
      process.env.ENABLE_AI_COMMANDS = "false";
      const token = createToken(["ai:command"]);

      const response = await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" })
        .expect(503);

      expect(response.body.error).toContain("disabled");
    });

    it("should allow commands when ENABLE_AI_COMMANDS is true", async () => {
      process.env.ENABLE_AI_COMMANDS = "true";
      const token = createToken(["ai:command"]);

      await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" })
        .expect(200);
    });

    it("should use AI_PROVIDER environment variable", async () => {
      process.env.AI_PROVIDER = "openai";
      const token = createToken(["ai:command"]);

      await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" })
        .expect(200);

      expect(mockPrisma.aiEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: "openai",
        }),
      });
    });
  });

  describe("Rate Limiting and Audit", () => {
    it("should apply AI-specific rate limiter", async () => {
      const { limiters } = require("../../middleware/security");
      const token = createToken(["ai:command"]);

      await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" });

      expect(limiters.ai).toHaveBeenCalled();
    });

    it("should apply audit logging", async () => {
      const { auditLog } = require("../../middleware/security");
      const token = createToken(["ai:command"]);

      await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" });

      expect(auditLog).toHaveBeenCalled();
    });
  });
});
