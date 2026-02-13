const express = require("express");
const request = require("supertest");

// Mock Prisma
const mockPrisma = {
  shipment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  aiEvent: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("../../db/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock export services
const mockExportServices = {
  exportToCSV: jest.fn(),
  exportToPDF: jest.fn(),
  exportToJSON: jest.fn(),
};

jest.mock("../../services/export", () => mockExportServices);

// Mock websocket
const mockEmitShipmentUpdate = jest.fn();
jest.mock("../../services/websocket", () => ({
  emitShipmentUpdate: mockEmitShipmentUpdate,
}));

// Mock cache middleware
jest.mock("../../middleware/cache", () => ({
  cacheMiddleware: jest.fn(() => (req, res, next) => next()),
  invalidateCache: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../middleware/security", () => ({
  authenticate: jest.fn((req, res, next) => {
    const authHeader = req.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    try {
      const jwt = require("jsonwebtoken");
      req.user = jwt.decode(authHeader.replace("Bearer ", ""));
      if (!req.user) throw new Error("Invalid token");
      next();
    } catch (err) {
      res.status(401).json({ ok: false, error: "Invalid token" });
    }
  }),
  requireOrganization: jest.fn((req, res, next) => next()),
  requireScope: jest.fn((scope) => (req, res, next) => {
    if (!req.user || !req.user.scopes || !req.user.scopes.includes(scope)) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
    next();
  }),
  limiters: {
    general: jest.fn((req, res, next) => next()),
    export: jest.fn((req, res, next) => next()),
  },
  auditLog: jest.fn((req, res, next) => next()),
}));

jest.mock("../../middleware/validation", () => {
  const createValidationChain = () => {
    const middleware = (req, res, next) => next();
    middleware.optional = jest.fn(() => (req, res, next) => next());
    return middleware;
  };

  return {
    validateString: jest.fn(() => createValidationChain()),
    validateUUID: jest.fn(() => (req, res, next) => next()),
    validateEnum: jest.fn(() => ({
      optional: jest.fn(() => (req, res, next) => next()),
    })),
    validateEnumQuery: jest.fn(() => ({
      optional: jest.fn(() => (req, res, next) => next()),
    })),
    validatePaginationQuery: jest.fn(() => [(req, res, next) => next()]),
    handleValidationErrors: jest.fn((req, res, next) => next()),
  };
});

// Now require the router
const shipmentsRouter = require("../shipments");

// Create test app
const app = express();
app.use(express.json());
app.use("/api", shipmentsRouter);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ ok: false, error: err.message || "Internal Server Error" });
});

// Helper to create JWT token
const jwt = require("jsonwebtoken");
const createToken = (scopes = [], role = "user") => {
  return jwt.sign({ sub: "user123", scopes, role }, "test-secret", { expiresIn: "1h" });
};

describe("Shipments Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/shipments", () => {
    it("should return all shipments for regular user", async () => {
      const mockShipments = [
        {
          id: "shipment1",
          trackingId: "TRK-123",
          userId: "user123",
          status: "IN_TRANSIT",
          origin: "New York",
          destination: "Los Angeles",
          driver: { id: "driver1", name: "John Doe", phone: "555-0100", status: "ACTIVE" },
        },
      ];
      mockPrisma.shipment.findMany.mockResolvedValue(mockShipments);

      const token = createToken(["shipments:read"]);
      const response = await request(app)
        .get("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.shipments).toEqual(mockShipments);
      expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith({
        where: { userId: "user123" },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return all shipments for admin without user filter", async () => {
      mockPrisma.shipment.findMany.mockResolvedValue([]);

      const token = createToken(["shipments:read"], "admin");
      await request(app).get("/api/shipments").set("Authorization", `Bearer ${token}`).expect(200);

      expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });

    it("should filter shipments by status", async () => {
      mockPrisma.shipment.findMany.mockResolvedValue([]);

      const token = createToken(["shipments:read"]);
      await request(app)
        .get("/api/shipments")
        .query({ status: "DELIVERED" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "DELIVERED",
          }),
        }),
      );
    });

    it("should filter shipments by driverId", async () => {
      mockPrisma.shipment.findMany.mockResolvedValue([]);

      const token = createToken(["shipments:read"]);
      await request(app)
        .get("/api/shipments")
        .query({ driverId: "driver123" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            driverId: "driver123",
          }),
        }),
      );
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/shipments").expect(401);
    });

    it("should return 403 when missing shipments:read scope", async () => {
      const token = createToken(["other:scope"]);

      await request(app).get("/api/shipments").set("Authorization", `Bearer ${token}`).expect(403);
    });
  });

  describe("GET /api/shipments/:id", () => {
    it("should return shipment by ID for owner", async () => {
      const mockShipment = {
        id: "shipment1",
        trackingId: "TRK-123",
        userId: "user123",
        status: "IN_TRANSIT",
        origin: "New York",
        destination: "Los Angeles",
        driver: { id: "driver1", name: "John Doe", phone: "555-0100", status: "ACTIVE" },
      };
      mockPrisma.shipment.findUnique.mockResolvedValue(mockShipment);

      const token = createToken(["shipments:read"]);
      const response = await request(app)
        .get("/api/shipments/shipment1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.shipment).toEqual(mockShipment);
    });

    it("should return shipment for admin even if not owner", async () => {
      const mockShipment = {
        id: "shipment1",
        userId: "other-user",
        status: "IN_TRANSIT",
        driver: null,
      };
      mockPrisma.shipment.findUnique.mockResolvedValue(mockShipment);

      const token = createToken(["shipments:read"], "admin");
      const response = await request(app)
        .get("/api/shipments/shipment1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.shipment).toEqual(mockShipment);
    });

    it("should return 404 when shipment not found", async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue(null);

      const token = createToken(["shipments:read"]);
      const response = await request(app)
        .get("/api/shipments/nonexistent")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe("Shipment not found");
    });

    it("should return 403 when user tries to access another users shipment", async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue({
        id: "shipment1",
        userId: "other-user",
      });

      const token = createToken(["shipments:read"]);
      const response = await request(app)
        .get("/api/shipments/shipment1")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe("Forbidden");
    });
  });

  describe("POST /api/shipments", () => {
    it("should create shipment successfully", async () => {
      const mockShipment = {
        id: "new-shipment",
        trackingId: "TRK-ABC123456789",
        reference: "REF-123",
        userId: "user123",
        origin: "New York",
        destination: "Los Angeles",
        status: "CREATED",
        driver: null,
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.shipment.create.mockResolvedValue(mockShipment);
      mockPrisma.aiEvent.create.mockResolvedValue({ id: "event1" });

      const token = createToken(["shipments:write"]);
      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          origin: "New York",
          destination: "Los Angeles",
          reference: "REF-123",
        })
        .expect(201);

      expect(response.body.ok).toBe(true);
      expect(response.body.shipment).toEqual(mockShipment);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockEmitShipmentUpdate).toHaveBeenCalledWith(mockShipment.id, {
        type: "created",
        shipment: mockShipment,
      });
    });

    it("should generate tracking ID when not provided", async () => {
      const mockShipment = {
        id: "new-shipment",
        trackingId: expect.stringMatching(/^TRK-[a-f0-9]{12}$/),
        userId: "user123",
        origin: "New York",
        destination: "Los Angeles",
        status: "CREATED",
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.shipment.create.mockResolvedValue(mockShipment);
      mockPrisma.aiEvent.create.mockResolvedValue({ id: "event1" });

      const token = createToken(["shipments:write"]);
      await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          origin: "New York",
          destination: "Los Angeles",
        })
        .expect(201);

      expect(mockPrisma.shipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            trackingId: expect.stringMatching(/^TRK-/),
          }),
        }),
      );
    });

    it("should return 400 when origin is missing", async () => {
      const token = createToken(["shipments:write"]);
      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          destination: "Los Angeles",
        })
        .expect(400);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain("Origin and destination are required");
    });

    it("should return 409 when reference already exists", async () => {
      mockPrisma.$transaction.mockRejectedValue({
        code: "P2002",
        message: "Unique constraint failed",
      });

      const token = createToken(["shipments:write"]);
      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          origin: "New York",
          destination: "Los Angeles",
          reference: "DUPLICATE",
        })
        .expect(409);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe("Reference already exists");
    });

    it("should return 403 when missing shipments:write scope", async () => {
      const token = createToken(["shipments:read"]);

      await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          origin: "New York",
          destination: "Los Angeles",
        })
        .expect(403);
    });
  });

  describe("PATCH /api/shipments/:id", () => {
    it("should update shipment status successfully", async () => {
      const mockExisting = { id: "shipment1", userId: "user123" };
      const mockUpdated = {
        id: "shipment1",
        userId: "user123",
        status: "DELIVERED",
        driver: null,
      };

      mockPrisma.shipment.findUnique.mockResolvedValue(mockExisting);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.shipment.update.mockResolvedValue(mockUpdated);
      mockPrisma.aiEvent.create.mockResolvedValue({ id: "event1" });

      const token = createToken(["shipments:write"]);
      const response = await request(app)
        .patch("/api/shipments/shipment1")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "DELIVERED" })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.shipment).toEqual(mockUpdated);
      expect(mockEmitShipmentUpdate).toHaveBeenCalledWith(mockUpdated.id, {
        type: "updated",
        shipment: mockUpdated,
        changes: { status: "DELIVERED" },
      });
    });

    it("should update driver assignment", async () => {
      const mockExisting = { id: "shipment1", userId: "user123" };
      const mockUpdated = {
        id: "shipment1",
        userId: "user123",
        driverId: "driver456",
      };

      mockPrisma.shipment.findUnique.mockResolvedValue(mockExisting);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.shipment.update.mockResolvedValue(mockUpdated);

      const token = createToken(["shipments:write"]);
      await request(app)
        .patch("/api/shipments/shipment1")
        .set("Authorization", `Bearer ${token}`)
        .send({ driverId: "driver456" })
        .expect(200);

      expect(mockPrisma.shipment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { driverId: "driver456" },
        }),
      );
    });

    it("should return 404 when shipment not found", async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue(null);

      const token = createToken(["shipments:write"]);
      const response = await request(app)
        .patch("/api/shipments/nonexistent")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "DELIVERED" })
        .expect(404);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe("Shipment not found");
    });

    it("should return 403 when user tries to update another users shipment", async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue({
        id: "shipment1",
        userId: "other-user",
      });

      const token = createToken(["shipments:write"]);
      const response = await request(app)
        .patch("/api/shipments/shipment1")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "DELIVERED" })
        .expect(403);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe("Forbidden");
    });
  });

  describe("DELETE /api/shipments/:id", () => {
    it("should delete shipment successfully", async () => {
      const mockExisting = { id: "shipment1", userId: "user123" };
      mockPrisma.shipment.findUnique.mockResolvedValue(mockExisting);
      mockPrisma.shipment.delete.mockResolvedValue(mockExisting);

      const token = createToken(["shipments:write"]);
      const response = await request(app)
        .delete("/api/shipments/shipment1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.message).toBe("Shipment deleted successfully");
      expect(mockPrisma.shipment.delete).toHaveBeenCalledWith({
        where: { id: "shipment1" },
      });
    });

    it("should return 404 when shipment not found", async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue(null);

      const token = createToken(["shipments:write"]);
      const response = await request(app)
        .delete("/api/shipments/nonexistent")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe("Shipment not found");
    });

    it("should return 403 when user tries to delete another users shipment", async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue({
        id: "shipment1",
        userId: "other-user",
      });

      const token = createToken(["shipments:write"]);
      const response = await request(app)
        .delete("/api/shipments/shipment1")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe("Forbidden");
    });
  });

  describe("GET /api/shipments/export/:format", () => {
    const mockShipments = [
      { id: "1", trackingId: "TRK-1", status: "DELIVERED" },
      { id: "2", trackingId: "TRK-2", status: "IN_TRANSIT" },
    ];

    beforeEach(() => {
      mockPrisma.shipment.findMany.mockResolvedValue(mockShipments);
    });

    it("should export shipments as CSV", async () => {
      const mockCSV = "id,trackingId,status\n1,TRK-1,DELIVERED\n2,TRK-2,IN_TRANSIT";
      mockExportServices.exportToCSV.mockReturnValue(mockCSV);

      const token = createToken(["shipments:read"]);
      const response = await request(app)
        .get("/api/shipments/export/csv")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.text).toBe(mockCSV);
      expect(response.headers["content-type"]).toMatch(/text\/csv/);
      expect(response.headers["content-disposition"]).toMatch(/attachment.*\.csv/);
      expect(mockExportServices.exportToCSV).toHaveBeenCalledWith(mockShipments);
    });

    it("should export shipments as PDF", async () => {
      const mockPDF = Buffer.from("PDF content");
      mockExportServices.exportToPDF.mockResolvedValue(mockPDF);

      const token = createToken(["shipments:read"]);
      const response = await request(app)
        .get("/api/shipments/export/pdf")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toMatch(/attachment.*\.pdf/);
      expect(mockExportServices.exportToPDF).toHaveBeenCalledWith(mockShipments);
    });

    it("should export shipments as JSON", async () => {
      const mockJSON = JSON.stringify(mockShipments);
      mockExportServices.exportToJSON.mockReturnValue(mockJSON);

      const token = createToken(["shipments:read"]);
      const response = await request(app)
        .get("/api/shipments/export/json")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.headers["content-type"]).toMatch(/application\/json/);
      expect(response.headers["content-disposition"]).toMatch(/attachment.*\.json/);
      expect(mockExportServices.exportToJSON).toHaveBeenCalledWith(mockShipments);
    });

    it("should filter exports by status", async () => {
      const token = createToken(["shipments:read"]);
      await request(app)
        .get("/api/shipments/export/csv")
        .query({ status: "DELIVERED" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "DELIVERED",
          }),
        }),
      );
    });

    it("should return 400 for invalid export format", async () => {
      const token = createToken(["shipments:read"]);
      const response = await request(app)
        .get("/api/shipments/export/invalid")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain("Invalid format");
    });
  });

  describe("Middleware Integration", () => {
    it("should apply rate limiting", async () => {
      const { limiters } = require("../../middleware/security");
      mockPrisma.shipment.findMany.mockResolvedValue([]);

      const token = createToken(["shipments:read"]);
      await request(app).get("/api/shipments").set("Authorization", `Bearer ${token}`).expect(200);

      expect(limiters.general).toHaveBeenCalled();
    });

    it("should apply export rate limiter to export endpoint", async () => {
      const { limiters } = require("../../middleware/security");
      mockPrisma.shipment.findMany.mockResolvedValue([]);
      mockExportServices.exportToCSV.mockReturnValue("");

      const token = createToken(["shipments:read"]);
      await request(app)
        .get("/api/shipments/export/csv")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(limiters.export).toHaveBeenCalled();
    });

    it("should apply audit logging", async () => {
      const { auditLog } = require("../../middleware/security");
      mockPrisma.shipment.findMany.mockResolvedValue([]);

      const token = createToken(["shipments:read"]);
      await request(app).get("/api/shipments").set("Authorization", `Bearer ${token}`).expect(200);

      expect(auditLog).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockPrisma.shipment.findMany.mockRejectedValue(new Error("Database error"));

      const token = createToken(["shipments:read"]);
      await request(app).get("/api/shipments").set("Authorization", `Bearer ${token}`).expect(500);
    });
  });
});
