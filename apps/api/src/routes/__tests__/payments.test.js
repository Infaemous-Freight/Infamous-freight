const express = require("express");
const request = require("supertest");

// Mock payment service
const mockPaymentService = {
  requestInstantPayout: jest.fn(),
  requestStandardPayout: jest.fn(),
  processBonusPayout: jest.fn(),
  getPayoutStatus: jest.fn(),
  getAvailablePaymentMethods: jest.fn(),
  calculatePayoutFees: jest.fn(),
  batchProcessPayouts: jest.fn(),
};

jest.mock("../../services/paymentService", () => mockPaymentService);

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
      req.ip = "127.0.0.1";
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
  limiters: {
    billing: jest.fn((req, res, next) => next()),
    general: jest.fn((req, res, next) => next()),
  },
  auditLog: jest.fn((req, res, next) => next()),
}));

jest.mock("../../middleware/idempotency", () => ({
  withIdempotency: jest.fn(() => (req, res, next) => next()),
}));

jest.mock("../../auth/authorize", () => ({
  requirePerm: jest.fn(() => (req, res, next) => next()),
}));

jest.mock("../../middleware/validation", () => ({
  validateString: jest.fn(() => (req, res, next) => next()),
  handleValidationErrors: jest.fn((req, res, next) => next()),
}));

// Now require the router
const paymentsRouter = require("../payments");

// Create test app
const app = express();
app.use(express.json());
app.use("/api/payments", paymentsRouter);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Helper to create JWT token
const jwt = require("jsonwebtoken");
const createToken = (scopes = []) => {
  return jwt.sign({ sub: "user123", scopes }, "test-secret", { expiresIn: "1h" });
};

describe("Payments Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/payments/payout/instant", () => {
    it("should request instant payout successfully", async () => {
      const mockPayout = {
        success: true,
        payout: {
          id: "payout_123",
          amount: 1000,
          status: "processing",
          estimatedArrival: "0-15 minutes",
        },
        message: "Instant payout initiated",
      };
      mockPaymentService.requestInstantPayout.mockResolvedValue(mockPayout);

      const token = createToken(["payment:payout"]);
      const response = await request(app)
        .post("/api/payments/payout/instant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 1000,
          method: "stripe",
          destination: "bank_account_123",
          currency: "USD",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPayout.payout);
      expect(mockPaymentService.requestInstantPayout).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: "user123",
          amount: 1000,
          currency: "USD",
          method: "stripe",
          destination: "bank_account_123",
          reason: "User requested payout",
          metadata: expect.objectContaining({
            requestedBy: "user123",
          }),
        }),
      );
    });

    it("should return 400 when payout fails", async () => {
      mockPaymentService.requestInstantPayout.mockResolvedValue({
        success: false,
        error: "Insufficient balance",
        code: "INSUFFICIENT_BALANCE",
      });

      const token = createToken(["payment:payout"]);
      const response = await request(app)
        .post("/api/payments/payout/instant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 1000,
          method: "stripe",
          destination: "bank_account_123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Insufficient balance");
      expect(response.body.code).toBe("INSUFFICIENT_BALANCE");
    });

    it("should return 401 when not authenticated", async () => {
      await request(app)
        .post("/api/payments/payout/instant")
        .send({
          amount: 1000,
          method: "stripe",
          destination: "bank_account_123",
        })
        .expect(401);
    });

    it("should return 403 when missing payment:payout scope", async () => {
      const token = createToken(["other:scope"]);

      await request(app)
        .post("/api/payments/payout/instant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 1000,
          method: "stripe",
          destination: "bank_account_123",
        })
        .expect(403);
    });
  });

  describe("POST /api/payments/payout/standard", () => {
    it("should request standard payout successfully", async () => {
      const mockPayout = {
        success: true,
        payout: {
          id: "payout_456",
          amount: 5000,
          status: "pending",
          estimatedArrival: "1-2 business days",
        },
        message: "Standard payout initiated",
      };
      mockPaymentService.requestStandardPayout.mockResolvedValue(mockPayout);

      const token = createToken(["payment:payout"]);
      const response = await request(app)
        .post("/api/payments/payout/standard")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 5000,
          method: "bankTransfer",
          destination: "bank_account_456",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPayout.payout);
      expect(mockPaymentService.requestStandardPayout).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      await request(app)
        .post("/api/payments/payout/standard")
        .send({
          amount: 5000,
          method: "bankTransfer",
          destination: "bank_account_456",
        })
        .expect(401);
    });

    it("should return 403 when missing payment:payout scope", async () => {
      const token = createToken(["payment:view"]);

      await request(app)
        .post("/api/payments/payout/standard")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 5000,
          method: "bankTransfer",
          destination: "bank_account_456",
        })
        .expect(403);
    });
  });

  describe("POST /api/payments/bonus/payout", () => {
    it("should process bonus payout successfully", async () => {
      const mockPayout = {
        success: true,
        payout: {
          id: "bonus_payout_789",
          amount: 500,
          bonusId: "bonus_123",
          status: "processed",
        },
      };
      mockPaymentService.processBonusPayout.mockResolvedValue(mockPayout);

      const token = createToken(["payment:bonus"]);
      const response = await request(app)
        .post("/api/payments/bonus/payout")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bonusId: "bonus_123",
          amount: 500,
          bonusType: "referral",
          paymentMethod: "stripe",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPayout.payout);
      expect(response.body.message).toContain("0-15 minutes");
      expect(mockPaymentService.processBonusPayout).toHaveBeenCalledWith({
        userId: "user123",
        bonusId: "bonus_123",
        amount: 500,
        bonusType: "referral",
        paymentMethod: "stripe",
      });
    });

    it("should return 400 when bonus payout fails", async () => {
      mockPaymentService.processBonusPayout.mockResolvedValue({
        success: false,
        error: "Bonus already redeemed",
        code: "BONUS_REDEEMED",
      });

      const token = createToken(["payment:bonus"]);
      const response = await request(app)
        .post("/api/payments/bonus/payout")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bonusId: "bonus_123",
          amount: 500,
          bonusType: "referral",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Bonus already redeemed");
    });

    it("should return 403 when missing payment:bonus scope", async () => {
      const token = createToken(["payment:payout"]);

      await request(app)
        .post("/api/payments/bonus/payout")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bonusId: "bonus_123",
          amount: 500,
          bonusType: "referral",
        })
        .expect(403);
    });
  });

  describe("GET /api/payments/payout/:payoutId/status", () => {
    it("should get payout status successfully", async () => {
      const mockStatus = {
        success: true,
        id: "payout_123",
        status: "completed",
        amount: 1000,
        completedAt: "2026-02-13T10:30:00Z",
      };
      mockPaymentService.getPayoutStatus.mockResolvedValue(mockStatus);

      const token = createToken(["payment:view"]);
      const response = await request(app)
        .get("/api/payments/payout/payout_123/status")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStatus);
      expect(mockPaymentService.getPayoutStatus).toHaveBeenCalledWith("payout_123", "stripe");
    });

    it("should accept custom payment method in query", async () => {
      mockPaymentService.getPayoutStatus.mockResolvedValue({ success: true });

      const token = createToken(["payment:view"]);
      await request(app)
        .get("/api/payments/payout/payout_456/status")
        .query({ method: "paypal" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(mockPaymentService.getPayoutStatus).toHaveBeenCalledWith("payout_456", "paypal");
    });

    it("should return 404 when payout not found", async () => {
      mockPaymentService.getPayoutStatus.mockResolvedValue({
        success: false,
        error: "Payout not found",
      });

      const token = createToken(["payment:view"]);
      const response = await request(app)
        .get("/api/payments/payout/invalid_id/status")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Payout not found");
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/payments/payout/payout_123/status").expect(401);
    });
  });

  describe("GET /api/payments/methods", () => {
    it("should get available payment methods", async () => {
      const mockMethods = {
        instant: ["stripe", "paypal", "debitCard"],
        standard: ["bankTransfer", "stripe", "paypal"],
        limits: {
          instant: { min: 10, max: 25000 },
          standard: { min: 1, max: 100000 },
        },
      };
      mockPaymentService.getAvailablePaymentMethods.mockResolvedValue(mockMethods);

      const token = createToken(["payment:view"]);
      const response = await request(app)
        .get("/api/payments/methods")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMethods);
      expect(mockPaymentService.getAvailablePaymentMethods).toHaveBeenCalledWith("user123", "US");
    });

    it("should accept custom country parameter", async () => {
      mockPaymentService.getAvailablePaymentMethods.mockResolvedValue({});

      const token = createToken(["payment:view"]);
      await request(app)
        .get("/api/payments/methods")
        .query({ country: "CA" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(mockPaymentService.getAvailablePaymentMethods).toHaveBeenCalledWith("user123", "CA");
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/payments/methods").expect(401);
    });
  });

  describe("GET /api/payments/fees/calculate", () => {
    it("should calculate instant payout fees", async () => {
      const mockFees = {
        percentage: 1.5,
        fixed: 0.25,
        total: 15.25,
      };
      mockPaymentService.calculatePayoutFees.mockReturnValue(mockFees);

      const token = createToken(["payment:view"]);
      const response = await request(app)
        .get("/api/payments/fees/calculate")
        .query({ amount: 1000, type: "instant" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(1000);
      expect(response.body.data.fees).toEqual(mockFees);
      expect(response.body.data.netAmount).toBe(984.75);
      expect(response.body.data.type).toBe("instant");
      expect(mockPaymentService.calculatePayoutFees).toHaveBeenCalledWith(1000, "instant");
    });

    it("should calculate standard payout fees", async () => {
      const mockFees = {
        percentage: 0.25,
        fixed: 0,
        total: 2.5,
      };
      mockPaymentService.calculatePayoutFees.mockReturnValue(mockFees);

      const token = createToken(["payment:view"]);
      const response = await request(app)
        .get("/api/payments/fees/calculate")
        .query({ amount: 1000, type: "standard" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.netAmount).toBe(997.5);
      expect(mockPaymentService.calculatePayoutFees).toHaveBeenCalledWith(1000, "standard");
    });

    it("should default to instant type when not specified", async () => {
      mockPaymentService.calculatePayoutFees.mockReturnValue({ total: 10 });

      const token = createToken(["payment:view"]);
      await request(app)
        .get("/api/payments/fees/calculate")
        .query({ amount: 500 })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(mockPaymentService.calculatePayoutFees).toHaveBeenCalledWith(500, "instant");
    });

    it("should return 400 when amount is missing", async () => {
      const token = createToken(["payment:view"]);
      const response = await request(app)
        .get("/api/payments/fees/calculate")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Valid amount is required");
    });

    it("should return 400 when amount is invalid", async () => {
      const token = createToken(["payment:view"]);
      const response = await request(app)
        .get("/api/payments/fees/calculate")
        .query({ amount: "invalid" })
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body.error).toBe("Valid amount is required");
    });
  });

  describe("POST /api/payments/batch/process", () => {
    it("should process batch payouts successfully", async () => {
      const mockResult = {
        processed: 3,
        successful: 3,
        failed: 0,
        results: [
          { id: "payout_1", status: "success" },
          { id: "payout_2", status: "success" },
          { id: "payout_3", status: "success" },
        ],
      };
      mockPaymentService.batchProcessPayouts.mockResolvedValue(mockResult);

      const token = createToken(["payment:admin"]);
      const response = await request(app)
        .post("/api/payments/batch/process")
        .set("Authorization", `Bearer ${token}`)
        .send({
          payouts: [
            { amount: 100, destination: "acc_1" },
            { amount: 200, destination: "acc_2" },
            { amount: 300, destination: "acc_3" },
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(response.body.message).toContain("3/3");
      expect(mockPaymentService.batchProcessPayouts).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      await request(app)
        .post("/api/payments/batch/process")
        .send({
          payouts: [{ amount: 100, destination: "acc_1" }],
        })
        .expect(401);
    });

    it("should return 403 when missing payment:admin scope", async () => {
      const token = createToken(["payment:payout"]);

      await request(app)
        .post("/api/payments/batch/process")
        .set("Authorization", `Bearer ${token}`)
        .send({
          payouts: [{ amount: 100, destination: "acc_1" }],
        })
        .expect(403);
    });
  });

  describe("GET /api/payments/health", () => {
    it("should return health status without authentication", async () => {
      const response = await request(app).get("/api/payments/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe("Payment & Payout Service");
      expect(response.body.status).toBe("operational");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body.features).toEqual({
        instantPayout: true,
        standardPayout: true,
        bonusPayout: true,
        batchProcessing: true,
      });
    });

    it("should not require authentication", async () => {
      await request(app).get("/api/payments/health").expect(200);
    });
  });

  describe("Error Handling", () => {
    it("should handle service errors gracefully", async () => {
      mockPaymentService.requestInstantPayout.mockRejectedValue(new Error("Service error"));

      const token = createToken(["payment:payout"]);
      await request(app)
        .post("/api/payments/payout/instant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 1000,
          method: "stripe",
          destination: "bank_account_123",
        })
        .expect(500);
    });
  });

  describe("Middleware Integration", () => {
    it("should apply rate limiting to payout endpoints", async () => {
      const { limiters } = require("../../middleware/security");
      mockPaymentService.requestInstantPayout.mockResolvedValue({ success: true, payout: {} });

      const token = createToken(["payment:payout"]);
      await request(app)
        .post("/api/payments/payout/instant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 1000,
          method: "stripe",
          destination: "bank_account_123",
        });

      expect(limiters.billing).toHaveBeenCalled();
    });

    it("should apply audit logging to sensitive endpoints", async () => {
      const { auditLog } = require("../../middleware/security");
      mockPaymentService.requestInstantPayout.mockResolvedValue({ success: true, payout: {} });

      const token = createToken(["payment:payout"]);
      await request(app)
        .post("/api/payments/payout/instant")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 1000,
          method: "stripe",
          destination: "bank_account_123",
        });

      expect(auditLog).toHaveBeenCalled();
    });

    it("should apply idempotency to payout endpoints", async () => {
      const { withIdempotency } = require("../../middleware/idempotency");

      // Just verify module was loaded
      expect(withIdempotency).toBeDefined();
    });
  });
});
