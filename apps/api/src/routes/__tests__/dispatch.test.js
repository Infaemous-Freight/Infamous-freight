/**
 * Dispatch Routes Tests
 * Tests for driver dispatch, assignment management, and optimization routes
 *
 * Routes tested:
 * - GET /api/dispatch/drivers
 * - GET /api/dispatch/drivers/:id
 * - POST /api/dispatch/drivers
 * - PATCH /api/dispatch/drivers/:id
 * - GET /api/dispatch/assignments
 * - POST /api/dispatch/assignments
 * - PATCH /api/dispatch/assignments/:id
 * - POST /api/dispatch/assignments/:id/cancel
 * - POST /api/dispatch/optimize
 */

const request = require("supertest");
const express = require("express");
const { generateTestJWT } = require("../../__tests__/helpers/jwt");

// Mock shared package
jest.mock("@infamous/shared", () => ({
  Permission: {
    DRIVER_READ: "DRIVER_READ",
    DRIVER_CREATE: "DRIVER_CREATE",
    DRIVER_UPDATE: "DRIVER_UPDATE",
    DISPATCH_READ: "DISPATCH_READ",
    DISPATCH_CREATE: "DISPATCH_CREATE",
    DISPATCH_UPDATE: "DISPATCH_UPDATE",
    DISPATCH_CANCEL: "DISPATCH_CANCEL",
  },
}));

// Mock dependencies
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
  requireScope: (scope) => (req, res, next) => next(),
}));

jest.mock("../../middleware/rbac", () => ({
  requirePermission: (permission) => (req, res, next) => next(),
  auditAction: (action) => (req, res, next) => next(),
}));

jest.mock("../../db/prisma", () => ({
  prisma: {
    driver: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    shipment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
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
const dispatchRouter = require("../dispatch");
const { prisma } = require("../../db/prisma");

// Create test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/dispatch", dispatchRouter);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
}

// Test suite
describe("Dispatch Routes", () => {
  let app;

  // Valid UUIDs for testing
  const mockUUIDs = {
    driver1: "550e8400-e29b-41d4-a716-446655440001",
    driver2: "550e8400-e29b-41d4-a716-446655440002",
    shipment1: "550e8400-e29b-41d4-a716-446655440011",
    shipment2: "550e8400-e29b-41d4-a716-446655440012",
    assignment1: "550e8400-e29b-41d4-a716-446655440021",
    assignment2: "550e8400-e29b-41d4-a716-446655440022",
  };

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/dispatch/drivers", () => {
    it("should list all drivers with pagination", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const mockDrivers = [
        { id: "driver_1", name: "John Doe", status: "ACTIVE" },
        { id: "driver_2", name: "Jane Smith", status: "ACTIVE" },
      ];

      prisma.driver.findMany.mockResolvedValue(mockDrivers);
      prisma.driver.count.mockResolvedValue(2);

      const response = await request(app)
        .get("/api/dispatch/drivers")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it("should filter drivers by status", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      prisma.driver.findMany.mockResolvedValue([]);
      prisma.driver.count.mockResolvedValue(0);

      const response = await request(app)
        .get("/api/dispatch/drivers")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ status: "INACTIVE" });

      expect(response.status).toBe(200);
      expect(prisma.driver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "INACTIVE" },
        }),
      );
    });

    it("should reject unauthenticated request", async () => {
      const response = await request(app).get("/api/dispatch/drivers");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/dispatch/drivers/:id", () => {
    it("should retrieve driver details", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const mockDriver = {
        id: mockUUIDs.driver1,
        name: "John Doe",
        status: "ACTIVE",
        licenseNumber: "DL12345",
      };

      prisma.driver.findUnique.mockResolvedValue(mockDriver);

      const response = await request(app)
        .get(`/api/dispatch/drivers/${mockUUIDs.driver1}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockUUIDs.driver1);
    });

    it("should return 404 for non-existent driver", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      prisma.driver.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/dispatch/drivers/${mockUUIDs.driver2}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it("should reject invalid UUID format", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const response = await request(app)
        .get("/api/dispatch/drivers/invalid-id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/dispatch/drivers", () => {
    it("should create a new driver", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const driverData = {
        name: "New Driver",
        email: "driver@example.com",
        phone: "+15555551234",
        licenseNumber: "DL99999",
      };

      prisma.driver.create.mockResolvedValue({
        id: "driver_new",
        ...driverData,
        status: "ACTIVE",
      });

      const response = await request(app)
        .post("/api/dispatch/drivers")
        .set("Authorization", `Bearer ${authToken}`)
        .send(driverData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("New Driver");
    });

    it("should reject invalid email format", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const response = await request(app)
        .post("/api/dispatch/drivers")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "New Driver",
          email: "invalid-email",
          licenseNumber: "DL99999",
        });

      expect(response.status).toBe(400);
    });

    it("should require name and license number", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const response = await request(app)
        .post("/api/dispatch/drivers")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "driver@example.com",
          // Missing name and licenseNumber
        });

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/dispatch/drivers/:id", () => {
    it("should update driver information", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      prisma.driver.update.mockResolvedValue({
        id: mockUUIDs.driver1,
        name: "Updated Name",
        status: "INACTIVE",
      });

      const response = await request(app)
        .patch(`/api/dispatch/drivers/${mockUUIDs.driver1}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Name",
          status: "INACTIVE",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject invalid status", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const response = await request(app)
        .patch(`/api/dispatch/drivers/${mockUUIDs.driver1}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          status: "INVALID_STATUS",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/dispatch/assignments", () => {
    it("should list all assignments", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const mockAssignments = [
        { id: "assign_1", driverId: "driver_1", shipmentId: "ship_1", status: "ASSIGNED" },
        { id: "assign_2", driverId: "driver_2", shipmentId: "ship_2", status: "IN_TRANSIT" },
      ];

      prisma.assignment.findMany.mockResolvedValue(mockAssignments);
      prisma.assignment.count.mockResolvedValue(2);

      const response = await request(app)
        .get("/api/dispatch/assignments")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it("should filter by status", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      prisma.assignment.findMany.mockResolvedValue([]);
      prisma.assignment.count.mockResolvedValue(0);

      const response = await request(app)
        .get("/api/dispatch/assignments")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ status: "DELIVERED" });

      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/dispatch/assignments", () => {
    it("should create assignment", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const mockDriver = { id: mockUUIDs.driver1, status: "ACTIVE" };
      const mockShipment = { id: mockUUIDs.shipment1, status: "CREATED" };

      prisma.driver.findUnique.mockResolvedValue(mockDriver);
      prisma.shipment.findUnique.mockResolvedValue(mockShipment);
      prisma.assignment.create.mockResolvedValue({
        id: mockUUIDs.assignment1,
        driverId: mockUUIDs.driver1,
        shipmentId: mockUUIDs.shipment1,
        status: "ASSIGNED",
      });
      prisma.shipment.update.mockResolvedValue(mockShipment);

      const response = await request(app)
        .post("/api/dispatch/assignments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          driverId: mockUUIDs.driver1,
          shipmentId: mockUUIDs.shipment1,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should reject assignment with inactive driver", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      prisma.driver.findUnique.mockResolvedValue({
        id: mockUUIDs.driver1,
        status: "INACTIVE",
      });

      const response = await request(app)
        .post("/api/dispatch/assignments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          driverId: mockUUIDs.driver1,
          shipmentId: mockUUIDs.shipment1,
        });

      expect(response.status).toBe(400);
    });

    it("should reject assignment with non-existent shipment", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      prisma.driver.findUnique.mockResolvedValue({
        id: mockUUIDs.driver1,
        status: "ACTIVE",
      });
      prisma.shipment.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/dispatch/assignments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          driverId: mockUUIDs.driver1,
          shipmentId: mockUUIDs.shipment2,
        });

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/dispatch/assignments/:id", () => {
    it("should update assignment status", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      prisma.assignment.update.mockResolvedValue({
        id: mockUUIDs.assignment1,
        status: "IN_TRANSIT",
        shipmentId: mockUUIDs.shipment1,
      });

      const response = await request(app)
        .patch(`/api/dispatch/assignments/${mockUUIDs.assignment1}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          status: "IN_TRANSIT",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should update shipment status when delivered", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      prisma.assignment.update.mockResolvedValue({
        id: mockUUIDs.assignment1,
        status: "DELIVERED",
        shipmentId: mockUUIDs.shipment1,
      });
      prisma.shipment.update.mockResolvedValue({});

      const response = await request(app)
        .patch(`/api/dispatch/assignments/${mockUUIDs.assignment1}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          status: "DELIVERED",
        });

      expect(response.status).toBe(200);
      expect(prisma.shipment.update).toHaveBeenCalled();
    });

    it("should reject invalid status", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const response = await request(app)
        .patch("/api/dispatch/assignments/assign_123")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          status: "INVALID",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/dispatch/assignments/:id/cancel", () => {
    it("should cancel assignment", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      prisma.assignment.update.mockResolvedValue({
        id: mockUUIDs.assignment1,
        status: "CANCELLED",
        shipmentId: mockUUIDs.shipment1,
      });
      prisma.shipment.update.mockResolvedValue({});

      const response = await request(app)
        .post(`/api/dispatch/assignments/${mockUUIDs.assignment1}/cancel`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          reason: "Driver unavailable",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.shipment.update).toHaveBeenCalled();
    });

    it("should require cancellation reason", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const response = await request(app)
        .post("/api/dispatch/assignments/assign_123/cancel")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/dispatch/optimize", () => {
    it("should trigger optimization", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      prisma.shipment.findMany.mockResolvedValue([
        { id: "ship_1", status: "CREATED" },
        { id: "ship_2", status: "CREATED" },
      ]);
      prisma.driver.findMany.mockResolvedValue([
        { id: "driver_1", status: "ACTIVE" },
        { id: "driver_2", status: "ACTIVE" },
      ]);

      const response = await request(app)
        .post("/api/dispatch/optimize")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          algorithm: "LOAD_BALANCE",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.shipmentCount).toBe(2);
      expect(response.body.data.driverCount).toBe(2);
    });

    it("should handle no pending shipments", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      prisma.shipment.findMany.mockResolvedValue([]);

      const response = await request(app)
        .post("/api/dispatch/optimize")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.suggestions).toEqual([]);
    });

    it("should reject invalid algorithm", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const response = await request(app)
        .post("/api/dispatch/optimize")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          algorithm: "INVALID_ALGO",
        });

      expect(response.status).toBe(400);
    });
  });
});
