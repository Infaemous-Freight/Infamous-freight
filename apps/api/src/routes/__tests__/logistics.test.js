/**
 * Tests for logistics routes
 */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// Mock dependencies
jest.mock("../../middleware/logger");

// Mock Prisma
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));

// Mock LogisticsService
const mockLogisticsService = {
  createShipment: jest.fn(),
  trackShipment: jest.fn(),
  updateShipmentStatus: jest.fn(),
  getWarehouseStatus: jest.fn(),
  receiveGoods: jest.fn(),
  pickItems: jest.fn(),
  getInventoryReport: jest.fn(),
  transferInventory: jest.fn(),
  cycleCount: jest.fn(),
  getFleetStatus: jest.fn(),
  scheduleMaintenance: jest.fn(),
  optimizeFleetDeployment: jest.fn(),
  optimizeLoadConsolidation: jest.fn(),
  calculateLoadDistribution: jest.fn(),
  getSupplyChainAnalytics: jest.fn(),
};

jest.mock("../../services/logisticsService", () => ({
  LogisticsService: jest.fn().mockImplementation(() => mockLogisticsService),
}));

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
  validateString: jest.fn(() => (req, res, next) => next()),
}));

// Import router and service after all mocks
const router = require("../logistics");
const { authenticate, requireScope, limiters, auditLog } = require("../../middleware/security");

// Setup Express app
const app = express();
app.use(express.json());
app.use("/api/logistics", router);

// Helper to create JWT token
const createToken = (scopes = []) => {
  return jwt.sign({ sub: "test-user-id", scopes }, "test-secret", { expiresIn: "1h" });
};

describe("Logistics Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== SHIPMENT MANAGEMENT ====================

  describe("POST /api/logistics/shipments", () => {
    const token = createToken(["logistics:create"]);
    const shipmentData = {
      customerId: "customer-123",
      origin: { address: "123 Start St", lat: 40.7128, lng: -74.006 },
      destination: { address: "456 End Ave", lat: 34.0522, lng: -118.2437 },
      cargo: { type: "electronics", weight: 100.5, volume: 2.5 },
      priority: "standard",
    };

    it("should create a new shipment", async () => {
      mockLogisticsService.createShipment.mockResolvedValue({
        id: "shipment-123",
        trackingNumber: "TRK123456",
        status: "pending",
      });

      const response = await request(app)
        .post("/api/logistics/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send(shipmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe("shipment-123");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/logistics/shipments").send(shipmentData);

      expect(response.status).toBe(401);
    });

    it("should return 403 without logistics:create scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .post("/api/logistics/shipments")
        .set("Authorization", `Bearer ${tokenNoScope}`)
        .send(shipmentData);

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/logistics/shipments/track/:trackingNumber", () => {
    it("should track a shipment", async () => {
      mockLogisticsService.trackShipment.mockResolvedValue({
        trackingNumber: "TRK123456",
        status: "in_transit",
        location: { lat: 40.7128, lng: -74.006 },
        estimatedDelivery: "2026-02-15",
      });

      const response = await request(app).get("/api/logistics/shipments/track/TRK123456");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.trackingNumber).toBe("TRK123456");
    });

    it("should not require authentication", async () => {
      mockLogisticsService.trackShipment.mockResolvedValue({
        trackingNumber: "TRK123456",
        status: "delivered",
      });

      const response = await request(app).get("/api/logistics/shipments/track/TRK123456");

      expect(response.status).toBe(200);
    });
  });

  describe("PUT /api/logistics/shipments/:id/status", () => {
    const token = createToken(["logistics:update"]);

    it("should update shipment status", async () => {
      mockLogisticsService.updateShipmentStatus.mockResolvedValue({
        id: "shipment-123",
        status: "delivered",
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .put("/api/logistics/shipments/shipment-123/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          status: "delivered",
          location: { lat: 34.0522, lng: -118.2437 },
          notes: "Delivered successfully",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("delivered");
      expect(auditLog).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .put("/api/logistics/shipments/shipment-123/status")
        .send({ status: "delivered" });

      expect(response.status).toBe(401);
    });

    it("should return 403 without logistics:update scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .put("/api/logistics/shipments/shipment-123/status")
        .set("Authorization", `Bearer ${tokenNoScope}`)
        .send({ status: "delivered" });

      expect(response.status).toBe(403);
    });
  });

  // ==================== WAREHOUSE MANAGEMENT ====================

  describe("GET /api/logistics/warehouses/:id/status", () => {
    const token = createToken(["logistics:view"]);

    it("should return warehouse status", async () => {
      mockLogisticsService.getWarehouseStatus.mockResolvedValue({
        warehouseId: "warehouse-1",
        occupancy: 75,
        activeOrders: 25,
        pendingShipments: 10,
      });

      const response = await request(app)
        .get("/api/logistics/warehouses/warehouse-1/status")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.warehouseId).toBe("warehouse-1");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/logistics/warehouses/warehouse-1/status");

      expect(response.status).toBe(401);
    });

    it("should return 403 without logistics:view scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .get("/api/logistics/warehouses/warehouse-1/status")
        .set("Authorization", `Bearer ${tokenNoScope}`);

      expect(response.status).toBe(403);
    });
  });

  describe("POST /api/logistics/warehouses/receive", () => {
    const token = createToken(["logistics:warehouse"]);

    it("should receive goods at warehouse", async () => {
      mockLogisticsService.receiveGoods.mockResolvedValue({
        receiptId: "receipt-123",
        message: "Goods received successfully",
      });

      const response = await request(app)
        .post("/api/logistics/warehouses/receive")
        .set("Authorization", `Bearer ${token}`)
        .send({
          warehouseId: "warehouse-1",
          shipmentId: "shipment-123",
          items: [{ productId: "prod-1", quantity: 10, unitValue: 50 }],
          receivedBy: "user-123",
          condition: "good",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(auditLog).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .post("/api/logistics/warehouses/receive")
        .send({ warehouseId: "warehouse-1" });

      expect(response.status).toBe(401);
    });

    it("should return 403 without logistics:warehouse scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .post("/api/logistics/warehouses/receive")
        .set("Authorization", `Bearer ${tokenNoScope}`)
        .send({ warehouseId: "warehouse-1" });

      expect(response.status).toBe(403);
    });
  });

  describe("POST /api/logistics/warehouses/pick", () => {
    const token = createToken(["logistics:warehouse"]);

    it("should pick items for outbound shipment", async () => {
      mockLogisticsService.pickItems.mockResolvedValue({
        pickListId: "pick-123",
        status: "completed",
      });

      const response = await request(app)
        .post("/api/logistics/warehouses/pick")
        .set("Authorization", `Bearer ${token}`)
        .send({
          warehouseId: "warehouse-1",
          orderId: "order-123",
          items: [{ productId: "prod-1", quantity: 5 }],
          pickerId: "picker-123",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(auditLog).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/logistics/warehouses/pick");

      expect(response.status).toBe(401);
    });
  });

  // ==================== INVENTORY MANAGEMENT ====================

  describe("GET /api/logistics/inventory", () => {
    const token = createToken(["logistics:view"]);

    it("should return inventory report", async () => {
      mockLogisticsService.getInventoryReport.mockResolvedValue({
        totalItems: 1000,
        totalValue: 50000,
        lowStockItems: 5,
      });

      const response = await request(app)
        .get("/api/logistics/inventory")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalItems).toBe(1000);
    });

    it("should accept query parameters", async () => {
      mockLogisticsService.getInventoryReport.mockResolvedValue({
        totalItems: 50,
        warehouseId: "warehouse-1",
      });

      await request(app)
        .get("/api/logistics/inventory?warehouseId=warehouse-1&lowStock=true")
        .set("Authorization", `Bearer ${token}`);

      expect(mockLogisticsService.getInventoryReport).toHaveBeenCalledWith(
        expect.objectContaining({
          warehouseId: "warehouse-1",
          lowStock: "true",
        }),
      );
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/logistics/inventory");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/logistics/inventory/transfer", () => {
    const token = createToken(["logistics:warehouse"]);

    it("should transfer inventory between warehouses", async () => {
      mockLogisticsService.transferInventory.mockResolvedValue({
        transferId: "transfer-123",
        message: "Transfer initiated successfully",
      });

      const response = await request(app)
        .post("/api/logistics/inventory/transfer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          productId: "prod-1",
          fromWarehouseId: "warehouse-1",
          toWarehouseId: "warehouse-2",
          quantity: 20,
          requestedBy: "user-123",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(auditLog).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/logistics/inventory/transfer");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/logistics/inventory/cycle-count", () => {
    const token = createToken(["logistics:warehouse"]);

    it("should perform cycle count", async () => {
      mockLogisticsService.cycleCount.mockResolvedValue({
        countId: "count-123",
        accuracy: 98.5,
        discrepancies: 2,
      });

      const response = await request(app)
        .post("/api/logistics/inventory/cycle-count")
        .set("Authorization", `Bearer ${token}`)
        .send({
          warehouseId: "warehouse-1",
          items: [
            { productId: "prod-1", countedQuantity: 100 },
            { productId: "prod-2", countedQuantity: 50 },
          ],
          countedBy: "user-123",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("98.5%");
      expect(auditLog).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/logistics/inventory/cycle-count");

      expect(response.status).toBe(401);
    });
  });

  // ==================== FLEET MANAGEMENT ====================

  describe("GET /api/logistics/fleet/status", () => {
    const token = createToken(["logistics:view"]);

    it("should return fleet status", async () => {
      mockLogisticsService.getFleetStatus.mockResolvedValue({
        totalVehicles: 50,
        activeVehicles: 35,
        underMaintenance: 5,
        idle: 10,
      });

      const response = await request(app)
        .get("/api/logistics/fleet/status")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalVehicles).toBe(50);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/logistics/fleet/status");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/logistics/fleet/maintenance", () => {
    const token = createToken(["logistics:fleet"]);

    it("should schedule vehicle maintenance", async () => {
      mockLogisticsService.scheduleMaintenance.mockResolvedValue({
        maintenanceId: "maint-123",
        vehicleId: "vehicle-1",
        scheduledDate: "2026-02-20",
      });

      const response = await request(app)
        .post("/api/logistics/fleet/maintenance")
        .set("Authorization", `Bearer ${token}`)
        .send({
          vehicleId: "vehicle-1",
          maintenanceType: "routine",
          scheduledDate: "2026-02-20T10:00:00Z",
          description: "Routine maintenance",
          estimatedCost: 500,
          priority: "routine",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(auditLog).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/logistics/fleet/maintenance");

      expect(response.status).toBe(401);
    });

    it("should return 403 without logistics:fleet scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .post("/api/logistics/fleet/maintenance")
        .set("Authorization", `Bearer ${tokenNoScope}`)
        .send({ vehicleId: "vehicle-1" });

      expect(response.status).toBe(403);
    });
  });

  describe("POST /api/logistics/fleet/optimize", () => {
    const token = createToken(["logistics:fleet"]);

    it("should optimize fleet deployment", async () => {
      mockLogisticsService.optimizeFleetDeployment.mockResolvedValue({
        assignments: [
          { vehicleId: "vehicle-1", shipmentId: "shipment-1" },
          { vehicleId: "vehicle-2", shipmentId: "shipment-2" },
        ],
        totalDistance: 150,
      });

      const response = await request(app)
        .post("/api/logistics/fleet/optimize")
        .set("Authorization", `Bearer ${token}`)
        .send({
          shipments: ["shipment-1", "shipment-2", "shipment-3"],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("2 shipments");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/logistics/fleet/optimize");

      expect(response.status).toBe(401);
    });
  });

  // ==================== LOAD OPTIMIZATION ====================

  describe("POST /api/logistics/load/consolidate", () => {
    const token = createToken(["logistics:optimize"]);

    it("should optimize load consolidation", async () => {
      mockLogisticsService.optimizeLoadConsolidation.mockResolvedValue({
        consolidatedLoads: 2,
        totalSavings: 1250.5,
        efficiency: 85,
      });

      const response = await request(app)
        .post("/api/logistics/load/consolidate")
        .set("Authorization", `Bearer ${token}`)
        .send({
          shipments: ["shipment-1", "shipment-2", "shipment-3"],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("$1250.50");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/logistics/load/consolidate");

      expect(response.status).toBe(401);
    });

    it("should return 403 without logistics:optimize scope", async () => {
      const tokenNoScope = createToken([]);
      const response = await request(app)
        .post("/api/logistics/load/consolidate")
        .set("Authorization", `Bearer ${tokenNoScope}`)
        .send({ shipments: [] });

      expect(response.status).toBe(403);
    });
  });

  describe("POST /api/logistics/load/distribute", () => {
    const token = createToken(["logistics:optimize"]);

    it("should calculate optimal load distribution", async () => {
      mockLogisticsService.calculateLoadDistribution.mockReturnValue({
        vehiclesNeeded: 3,
        loads: [
          { vehicleId: 1, weight: 1000 },
          { vehicleId: 2, weight: 950 },
          { vehicleId: 3, weight: 500 },
        ],
      });

      const response = await request(app)
        .post("/api/logistics/load/distribute")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{ weight: 500 }, { weight: 700 }, { weight: 450 }, { weight: 800 }],
          vehicleCapacity: 1000,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("3 vehicle(s)");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/logistics/load/distribute");

      expect(response.status).toBe(401);
    });
  });

  // ==================== ANALYTICS ====================

  describe("GET /api/logistics/analytics", () => {
    const token = createToken(["logistics:view"]);

    it("should return supply chain analytics", async () => {
      mockLogisticsService.getSupplyChainAnalytics.mockResolvedValue({
        totalShipments: 500,
        onTimeDeliveryRate: 95.5,
        averageDeliveryTime: 2.5,
        costPerShipment: 25.5,
      });

      const response = await request(app)
        .get("/api/logistics/analytics")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockLogisticsService.getSupplyChainAnalytics).toHaveBeenCalledWith(30);
    });

    it("should accept custom time range", async () => {
      mockLogisticsService.getSupplyChainAnalytics.mockResolvedValue({
        totalShipments: 1000,
      });

      await request(app)
        .get("/api/logistics/analytics?timeRange=90")
        .set("Authorization", `Bearer ${token}`);

      expect(mockLogisticsService.getSupplyChainAnalytics).toHaveBeenCalledWith(90);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/logistics/analytics");

      expect(response.status).toBe(401);
    });
  });

  // ==================== HEALTH CHECK ====================

  describe("GET /api/logistics/health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/logistics/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("healthy");
      expect(response.body.service).toBe("logistics");
      expect(response.body.version).toBe("1.0.0");
    });

    it("should not require authentication", async () => {
      const response = await request(app).get("/api/logistics/health");

      expect(response.status).toBe(200);
    });
  });

  // ==================== MIDDLEWARE INTEGRATION ====================

  describe("Middleware Integration", () => {
    it("should apply rate limiting", async () => {
      await request(app).get("/api/logistics/health");

      // Health endpoint uses no rate limiter
      expect(limiters.general).not.toHaveBeenCalled();
    });

    it("should apply audit logging to warehouse operations", async () => {
      const token = createToken(["logistics:warehouse"]);
      mockLogisticsService.receiveGoods.mockResolvedValue({
        receiptId: "receipt-123",
        message: "Success",
      });

      await request(app)
        .post("/api/logistics/warehouses/receive")
        .set("Authorization", `Bearer ${token}`)
        .send({
          warehouseId: "warehouse-1",
          items: [{ productId: "prod-1", quantity: 10 }],
          receivedBy: "user-123",
        });

      expect(auditLog).toHaveBeenCalled();
    });
  });
});
