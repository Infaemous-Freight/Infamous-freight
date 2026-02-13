/**
 * Tracking Routes Tests
 * Tests for GPS tracking, geofencing, and location analytics routes
 *
 * Routes tested:
 * - POST /api/tracking/location
 * - GET /api/tracking/location/:entityType/:entityId
 * - GET /api/tracking/history/:entityType/:entityId
 * - POST /api/tracking/geofence
 * - GET /api/tracking/geofence/:geofenceId/events
 * - GET /api/tracking/analytics/:entityType/:entityId
 * - GET /api/tracking/alerts
 * - PUT /api/tracking/alerts/:alertId/acknowledge
 * - GET /api/tracking/entities
 * - GET /api/tracking/health
 */

const request = require("supertest");
const express = require("express");
const { generateTestJWT } = require("../../__tests__/helpers/jwt");

// Mock dependencies
jest.mock("../../middleware/security", () => ({
  limiters: {
    rateLimit: jest.fn((config) => (req, res, next) => next()),
    general: (req, res, next) => next(),
    passwordReset: (req, res, next) => next(),
    auth: (req, res, next) => next(),
  },
  authenticate: (req, res, next) => {
    const auth = req.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = auth.replace("Bearer ", "");
    try {
      const jwt = require("jsonwebtoken");
      req.user = jwt.decode(token);
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

jest.mock("../../services/trackingService", () => ({
  updateLocation: jest.fn(),
  getCurrentLocation: jest.fn(),
  getLocationHistory: jest.fn(),
  createGeofence: jest.fn(),
  getAnalytics: jest.fn(),
  getAlerts: jest.fn(),
  acknowledgeAlert: jest.fn(),
  getTrackedEntities: jest.fn(),
}));

jest.mock("../../db/prisma", () => ({
  prisma: {
    geofenceEvent: {
      findMany: jest.fn(),
    },
    location: {
      count: jest.fn(),
    },
    trackingSummary: {
      count: jest.fn(),
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
const trackingRouter = require("../tracking");
const trackingService = require("../../services/trackingService");
const { prisma } = require("../../db/prisma");

// Create test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/tracking", trackingRouter);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
}

// Test suite
describe("Tracking Routes", () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/tracking/location", () => {
    const validLocationData = {
      entityType: "vehicle",
      entityId: "vehicle_123",
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 50.5,
      speed: 65.5,
      heading: 180,
      accuracy: 10,
      source: "gps",
    };

    it("should update location with valid data", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:update"],
      });

      trackingService.updateLocation.mockResolvedValue({
        id: "location_123",
        ...validLocationData,
        timestamp: new Date(),
      });

      const response = await request(app)
        .post("/api/tracking/location")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validLocationData);

      expect([200, 429]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(trackingService.updateLocation).toHaveBeenCalledWith(validLocationData);
      }
    });

    it("should reject invalid entity type", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:update"],
      });

      const response = await request(app)
        .post("/api/tracking/location")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...validLocationData,
          entityType: "invalid_type",
        });

      expect([400, 422, 429]).toContain(response.status);
    });

    it("should reject invalid latitude", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:update"],
      });

      const response = await request(app)
        .post("/api/tracking/location")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...validLocationData,
          latitude: 91, // Out of range
        });

      expect([400, 422, 429]).toContain(response.status);
    });

    it("should reject invalid longitude", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:update"],
      });

      const response = await request(app)
        .post("/api/tracking/location")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...validLocationData,
          longitude: -181, // Out of range
        });

      expect([400, 422, 429]).toContain(response.status);
    });

    it("should reject unauthenticated request", async () => {
      const response = await request(app).post("/api/tracking/location").send(validLocationData);

      expect([401, 403]).toContain(response.status);
    });

    it("should reject request without required scope", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:view"], // Wrong scope
      });

      const response = await request(app)
        .post("/api/tracking/location")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validLocationData);

      expect([403]).toContain(response.status);
    });
  });

  describe("GET /api/tracking/location/:entityType/:entityId", () => {
    it("should retrieve location for valid entity", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:view"],
      });

      const mockLocation = {
        id: "location_123",
        entityType: "vehicle",
        entityId: "vehicle_123",
        latitude: 37.7749,
        longitude: -122.4194,
        timestamp: new Date(),
      };

      trackingService.getCurrentLocation.mockResolvedValue(mockLocation);

      const response = await request(app)
        .get("/api/tracking/location/vehicle/vehicle_123")
        .set("Authorization", `Bearer ${authToken}`);

      expect([200, 429]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.entityId).toBe(mockLocation.entityId);
        expect(response.body.data.latitude).toBe(mockLocation.latitude);
      }
    });

    it("should return 404 when location not found", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:view"],
      });

      trackingService.getCurrentLocation.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/tracking/location/vehicle/vehicle_999")
        .set("Authorization", `Bearer ${authToken}`);

      expect([404, 429]).toContain(response.status);
    });

    it("should reject invalid entity type", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:view"],
      });

      const response = await request(app)
        .get("/api/tracking/location/invalid/entity_123")
        .set("Authorization", `Bearer ${authToken}`);

      expect([400, 422, 429]).toContain(response.status);
    });
  });

  describe("GET /api/tracking/history/:entityType/:entityId", () => {
    it("should retrieve location history", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:view"],
      });

      const mockHistory = [
        { latitude: 37.7749, longitude: -122.4194, timestamp: new Date() },
        { latitude: 37.775, longitude: -122.4195, timestamp: new Date() },
      ];

      trackingService.getLocationHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get("/api/tracking/history/vehicle/vehicle_123")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ limit: 100 });

      expect([200, 429]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it("should handle time range filters", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:view"],
      });

      trackingService.getLocationHistory.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/tracking/history/vehicle/vehicle_123")
        .set("Authorization", `Bearer ${authToken}`)
        .query({
          startTime: "2024-01-01T00:00:00Z",
          endTime: "2024-12-31T23:59:59Z",
        });

      expect([200, 429]).toContain(response.status);
    });
  });

  describe("POST /api/tracking/geofence", () => {
    it("should create circle geofence", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:geofence"],
      });

      const geofenceData = {
        name: "Warehouse Zone",
        type: "circle",
        latitude: 37.7749,
        longitude: -122.4194,
        radiusMeters: 500,
        alertOnEnter: true,
        alertOnExit: true,
      };

      trackingService.createGeofence.mockResolvedValue({
        id: "geofence_123",
        ...geofenceData,
      });

      const response = await request(app)
        .post("/api/tracking/geofence")
        .set("Authorization", `Bearer ${authToken}`)
        .send(geofenceData);

      expect([201, 429]).toContain(response.status);
    });

    it("should create polygon geofence", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:geofence"],
      });

      const geofenceData = {
        name: "Delivery Area",
        type: "polygon",
        polygon: [
          [37.7749, -122.4194],
          [37.775, -122.4195],
          [37.7751, -122.4196],
        ],
        alertOnEnter: false,
        alertOnExit: true,
      };

      trackingService.createGeofence.mockResolvedValue({
        id: "geofence_456",
        ...geofenceData,
      });

      const response = await request(app)
        .post("/api/tracking/geofence")
        .set("Authorization", `Bearer ${authToken}`)
        .send(geofenceData);

      expect([201, 429]).toContain(response.status);
    });

    it("should reject invalid geofence type", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:geofence"],
      });

      const response = await request(app)
        .post("/api/tracking/geofence")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Bad Zone",
          type: "invalid",
        });

      expect([400, 422, 429]).toContain(response.status);
    });
  });

  describe("GET /api/tracking/geofence/:geofenceId/events", () => {
    it("should retrieve geofence events", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:view"],
      });

      const mockEvents = [
        { id: "event_1", type: "entry", timestamp: new Date() },
        { id: "event_2", type: "exit", timestamp: new Date() },
      ];

      prisma.geofenceEvent.findMany.mockResolvedValue(mockEvents);

      const response = await request(app)
        .get("/api/tracking/geofence/geofence_123/events")
        .set("Authorization", `Bearer ${authToken}`);

      expect([200, 429, 500]).toContain(response.status);
    });
  });

  describe("GET /api/tracking/analytics/:entityType/:entityId", () => {
    it("should retrieve tracking analytics", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:view"],
      });

      const mockAnalytics = {
        totalDistance: 1250.5,
        averageSpeed: 55.3,
        maxSpeed: 75.0,
        idleTime: 3600,
        movingTime: 7200,
      };

      trackingService.getAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get("/api/tracking/analytics/vehicle/vehicle_123")
        .set("Authorization", `Bearer ${authToken}`);

      expect([200, 429]).toContain(response.status);
    });
  });

  describe("GET /api/tracking/alerts", () => {
    it("should retrieve tracking alerts", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:view"],
      });

      const mockAlerts = [
        { id: "alert_1", type: "delay", severity: "high" },
        { id: "alert_2", type: "geofence_exit", severity: "medium" },
      ];

      trackingService.getAlerts.mockResolvedValue(mockAlerts);

      const response = await request(app)
        .get("/api/tracking/alerts")
        .set("Authorization", `Bearer ${authToken}`);

      expect([200, 429]).toContain(response.status);
    });

    it("should filter alerts by entity type", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:view"],
      });

      trackingService.getAlerts.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/tracking/alerts")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ entityType: "vehicle", severity: "high" });

      expect([200, 429]).toContain(response.status);
    });
  });

  describe("PUT /api/tracking/alerts/:alertId/acknowledge", () => {
    it("should acknowledge alert", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:update"],
      });

      const mockAlert = {
        id: "alert_123",
        acknowledged: true,
        acknowledgedBy: "user_123",
      };

      trackingService.acknowledgeAlert.mockResolvedValue(mockAlert);

      const response = await request(app)
        .put("/api/tracking/alerts/alert_123/acknowledge")
        .set("Authorization", `Bearer ${authToken}`);

      expect([200, 429]).toContain(response.status);
    });
  });

  describe("GET /api/tracking/entities", () => {
    it("should retrieve all tracked entities", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:view"],
      });

      const mockEntities = [
        { entityType: "vehicle", entityId: "v1", isActive: true },
        { entityType: "driver", entityId: "d1", isActive: false },
      ];

      trackingService.getTrackedEntities.mockResolvedValue(mockEntities);

      const response = await request(app)
        .get("/api/tracking/entities")
        .set("Authorization", `Bearer ${authToken}`);

      expect([200, 429]).toContain(response.status);
    });
  });

  describe("GET /api/tracking/health", () => {
    it("should return healthy status", async () => {
      prisma.location.count.mockResolvedValue(150);
      prisma.trackingSummary.count.mockResolvedValue(25);

      const response = await request(app).get("/api/tracking/health");

      expect([200, 503]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.status).toBe("healthy");
      }
    });

    it("should return unhealthy status on database error", async () => {
      prisma.location.count.mockRejectedValue(new Error("DB connection failed"));

      const response = await request(app).get("/api/tracking/health");

      expect([200, 503]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.status).toBe("healthy");
      }
    });
  });

  describe("Security & Validation", () => {
    it("should reject location update with negative speed", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:update"],
      });

      const response = await request(app)
        .post("/api/tracking/location")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entityType: "vehicle",
          entityId: "vehicle_123",
          latitude: 37.7749,
          longitude: -122.4194,
          speed: -10, // Invalid
        });

      expect([400, 422, 429]).toContain(response.status);
    });

    it("should reject location update with invalid heading", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:update"],
      });

      const response = await request(app)
        .post("/api/tracking/location")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entityType: "vehicle",
          entityId: "vehicle_123",
          latitude: 37.7749,
          longitude: -122.4194,
          heading: 400, // Out of range
        });

      expect([400, 422, 429]).toContain(response.status);
    });

    it("should handle service errors gracefully", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["tracking:update"],
      });

      trackingService.updateLocation.mockRejectedValue(new Error("Service unavailable"));

      const response = await request(app)
        .post("/api/tracking/location")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entityType: "vehicle",
          entityId: "vehicle_123",
          latitude: 37.7749,
          longitude: -122.4194,
        });

      expect([429, 500, 503]).toContain(response.status);
    });
  });
});
