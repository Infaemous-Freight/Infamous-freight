/**
 * Phase 10: AI/ML Services Test Suite
 *
 * Comprehensive tests for all Phase 10 AI/ML services
 */

const request = require("supertest");
const app = require("../src/server");
const jwt = require("jsonwebtoken");

// Test JWT with AI scopes
const testJWT = jwt.sign(
  {
    sub: "test-user-123",
    email: "test@example.com",
    scopes: ["ai:fraud", "ai:forecast", "ai:route", "ai:maintenance", "ai:maintenance:sensors"],
  },
  process.env.JWT_SECRET || "test-secret",
  { expiresIn: "1h" },
);

describe("Phase 10: AI/ML Services", () => {
  /**
   * =========================
   * FRAUD DETECTION AI TESTS
   * =========================
   */
  describe("Fraud Detection AI", () => {
    it("should analyze transaction for fraud", async () => {
      const response = await request(app)
        .post("/api/ai/fraud/analyze")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          userId: "550e8400-e29b-41d4-a716-446655440000",
          amount: 5000,
          currency: "USD",
          paymentMethod: "card",
          ipAddress: "192.168.1.1",
          deviceFingerprint: { known: true, id: "device-123" },
          location: { lat: 40.7128, lon: -74.006 },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("fraudCheckId");
      expect(response.body.data).toHaveProperty("riskScore");
      expect(response.body.data).toHaveProperty("riskLevel");
      expect(response.body.data).toHaveProperty("recommendedAction");
      expect(response.body.data.riskScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.riskScore).toBeLessThanOrEqual(100);
      expect(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(response.body.data.riskLevel);
    });

    it("should reject high-risk crypto transaction", async () => {
      const response = await request(app)
        .post("/api/ai/fraud/analyze")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          userId: "550e8400-e29b-41d4-a716-446655440000",
          amount: 50000,
          currency: "BTC",
          paymentMethod: "crypto",
          ipAddress: "192.168.1.1",
          location: { lat: 40.7128, lon: -74.006 },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.riskScore).toBeGreaterThan(50);
    });

    it("should get user fraud statistics", async () => {
      const response = await request(app)
        .get("/api/ai/fraud/user/550e8400-e29b-41d4-a716-446655440000/stats?days=30")
        .set("Authorization", `Bearer ${testJWT}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("totalChecks");
      expect(response.body.data).toHaveProperty("blockedCount");
      expect(response.body.data).toHaveProperty("avgRiskScore");
    });

    it("should require authentication for fraud analysis", async () => {
      const response = await request(app).post("/api/ai/fraud/analyze").send({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        amount: 1000,
        currency: "USD",
        paymentMethod: "card",
      });

      expect(response.status).toBe(401);
    });
  });

  /**
   * ==========================
   * DEMAND FORECASTING TESTS
   * ==========================
   */
  describe("Demand Forecasting", () => {
    it("should generate weekly demand forecast", async () => {
      const response = await request(app)
        .post("/api/ai/forecast/generate")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          region: "all",
          horizon: "WEEKLY",
          includeConfidenceIntervals: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("forecastId");
      expect(response.body.data).toHaveProperty("forecast");
      expect(response.body.data.forecast).toBeInstanceOf(Array);
      expect(response.body.data.forecast.length).toBeGreaterThan(0);
      expect(response.body.data.forecast[0]).toHaveProperty("date");
      expect(response.body.data.forecast[0]).toHaveProperty("value");
      expect(response.body.data.forecast[0]).toHaveProperty("lower_bound");
      expect(response.body.data.forecast[0]).toHaveProperty("upper_bound");
    });

    it("should generate monthly forecast with specific model", async () => {
      const response = await request(app)
        .post("/api/ai/forecast/generate")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          region: "US-East",
          horizon: "MONTHLY",
          modelPreference: "PROPHET",
          includeConfidenceIntervals: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.models).toContain("PROPHET");
      expect(response.body.data.forecast.length).toBeGreaterThanOrEqual(3);
    });

    it("should evaluate forecast accuracy", async () => {
      // First generate a forecast
      const forecastResponse = await request(app)
        .post("/api/ai/forecast/generate")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({ region: "all", horizon: "WEEKLY" });

      const forecastId = forecastResponse.body.data.forecastId;

      // Then evaluate it
      const response = await request(app)
        .get(`/api/ai/forecast/${forecastId}/accuracy`)
        .set("Authorization", `Bearer ${testJWT}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("forecastId");
      expect(response.body.data).toHaveProperty("mape");
      expect(response.body.data).toHaveProperty("accuracy");
    });

    it("should validate horizon parameter", async () => {
      const response = await request(app)
        .post("/api/ai/forecast/generate")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          region: "all",
          horizon: "INVALID",
        });

      expect(response.status).toBe(400);
    });
  });

  /**
   * ===========================
   * ROUTE OPTIMIZATION TESTS
   * ===========================
   */
  describe("Route Optimization AI", () => {
    const testStops = [
      { id: "1", latitude: 40.7128, longitude: -74.006, address: "New York, NY" },
      { id: "2", latitude: 34.0522, longitude: -118.2437, address: "Los Angeles, CA" },
      { id: "3", latitude: 41.8781, longitude: -87.6298, address: "Chicago, IL" },
      { id: "4", latitude: 29.7604, longitude: -95.3698, address: "Houston, TX" },
      { id: "5", latitude: 33.4484, longitude: -112.074, address: "Phoenix, AZ" },
    ];

    it("should optimize route with 2-opt algorithm", async () => {
      const response = await request(app)
        .post("/api/ai/route/optimize")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          stops: testStops,
          algorithm: "TWO_OPT",
          vehicleType: "TRUCK",
          includeTraffic: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("optimizedStops");
      expect(response.body.data).toHaveProperty("totalDistance");
      expect(response.body.data).toHaveProperty("estimatedDuration");
      expect(response.body.data).toHaveProperty("estimatedFuelCost");
      expect(response.body.data).toHaveProperty("directions");
      expect(response.body.data.optimizedStops.length).toBe(testStops.length);
      expect(response.body.data.totalDistance).toBeGreaterThan(0);
    });

    it("should optimize route with genetic algorithm", async () => {
      const response = await request(app)
        .post("/api/ai/route/optimize")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          stops: testStops,
          algorithm: "GENETIC",
          vehicleType: "SEMI",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.algorithm).toBe("GENETIC");
    });

    it("should handle dynamic rerouting", async () => {
      const response = await request(app)
        .post("/api/ai/route/reroute")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          currentLocation: { lat: 39.9526, lon: -75.1652 },
          remainingStops: testStops.slice(1),
          algorithm: "TWO_OPT",
          includeTraffic: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.optimizedStops.length).toBe(testStops.length);
    });

    it("should reject routes with too many stops", async () => {
      const tooManyStops = Array(60)
        .fill(null)
        .map((_, i) => ({
          id: `stop-${i}`,
          latitude: 40 + Math.random(),
          longitude: -74 + Math.random(),
          address: `Address ${i}`,
        }));

      const response = await request(app)
        .post("/api/ai/route/optimize")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          stops: tooManyStops,
          algorithm: "TWO_OPT",
        });

      expect(response.status).toBe(400);
    });

    it("should require at least 2 stops", async () => {
      const response = await request(app)
        .post("/api/ai/route/optimize")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          stops: [testStops[0]],
          algorithm: "TWO_OPT",
        });

      expect(response.status).toBe(400);
    });
  });

  /**
   * ================================
   * PREDICTIVE MAINTENANCE TESTS
   * ================================
   */
  describe("Predictive Maintenance", () => {
    const testVehicleId = "550e8400-e29b-41d4-a716-446655440000";

    it("should analyze vehicle health", async () => {
      const response = await request(app)
        .post(`/api/ai/maintenance/analyze/${testVehicleId}`)
        .set("Authorization", `Bearer ${testJWT}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("analysisId");
      expect(response.body.data).toHaveProperty("overallHealth");
      expect(response.body.data).toHaveProperty("components");
      expect(response.body.data).toHaveProperty("predictions");
      expect(response.body.data).toHaveProperty("recommendations");
      expect(response.body.data.overallHealth).toHaveProperty("score");
      expect(response.body.data.overallHealth).toHaveProperty("level");
      expect(response.body.data.overallHealth.score).toBeGreaterThanOrEqual(0);
      expect(response.body.data.overallHealth.score).toBeLessThanOrEqual(100);
    });

    it("should ingest IoT sensor data", async () => {
      const sensorData = [
        { sensor: "oil_pressure", value: 45.5, unit: "psi", timestamp: new Date().toISOString() },
        { sensor: "coolant_temp", value: 95.2, unit: "°C", timestamp: new Date().toISOString() },
        { sensor: "tire_pressure", value: 32.0, unit: "psi", timestamp: new Date().toISOString() },
      ];

      const response = await request(app)
        .post(`/api/ai/maintenance/sensors/${testVehicleId}`)
        .set("Authorization", `Bearer ${testJWT}`)
        .send({ sensorData });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("readingsIngested");
      expect(response.body.data.readingsIngested).toBe(3);
      expect(response.body.data).toHaveProperty("alerts");
    });

    it("should detect critical sensor alerts", async () => {
      const criticalData = [
        { sensor: "oil_pressure", value: 10, unit: "psi", timestamp: new Date().toISOString() }, // Below threshold
        { sensor: "coolant_temp", value: 120, unit: "°C", timestamp: new Date().toISOString() }, // Above threshold
      ];

      const response = await request(app)
        .post(`/api/ai/maintenance/sensors/${testVehicleId}`)
        .set("Authorization", `Bearer ${testJWT}`)
        .send({ sensorData: criticalData });

      expect(response.status).toBe(200);
      expect(response.body.data.alerts.length).toBeGreaterThan(0);
      expect(response.body.data.alerts[0]).toHaveProperty("severity");
      expect(response.body.data.alerts[0].severity).toBe("critical");
    });

    it("should get fleet maintenance overview", async () => {
      const response = await request(app)
        .get("/api/ai/maintenance/fleet/overview")
        .set("Authorization", `Bearer ${testJWT}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("totalVehicles");
      expect(response.body.data).toHaveProperty("healthyVehicles");
      expect(response.body.data).toHaveProperty("needsAttention");
      expect(response.body.data).toHaveProperty("criticalVehicles");
      expect(response.body.data).toHaveProperty("estimatedMaintenanceCost");
    });

    it("should require sensor scope for data ingestion", async () => {
      const jwtWithoutSensorScope = jwt.sign(
        {
          sub: "test-user-123",
          scopes: ["ai:maintenance"],
        },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "1h" },
      );

      const response = await request(app)
        .post(`/api/ai/maintenance/sensors/${testVehicleId}`)
        .set("Authorization", `Bearer ${jwtWithoutSensorScope}`)
        .send({
          sensorData: [
            { sensor: "oil_pressure", value: 45, unit: "psi", timestamp: new Date().toISOString() },
          ],
        });

      expect(response.status).toBe(403);
    });
  });

  /**
   * ====================
   * PERFORMANCE TESTS
   * ====================
   */
  describe("Performance Tests", () => {
    it("should complete fraud analysis in <200ms", async () => {
      const start = Date.now();

      const response = await request(app)
        .post("/api/ai/fraud/analyze")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          userId: "550e8400-e29b-41d4-a716-446655440000",
          amount: 1000,
          currency: "USD",
          paymentMethod: "card",
        });

      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(200);
      expect(response.body.data.processingTime).toBeLessThan(200);
    });

    it("should complete route optimization in <5s for 20 stops", async () => {
      const stops = Array(20)
        .fill(null)
        .map((_, i) => ({
          id: `stop-${i}`,
          latitude: 40 + Math.random(),
          longitude: -74 + Math.random(),
          address: `Address ${i}`,
        }));

      const start = Date.now();

      const response = await request(app)
        .post("/api/ai/route/optimize")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({ stops, algorithm: "TWO_OPT" });

      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000);
    });

    it("should complete forecast generation in <3s", async () => {
      const start = Date.now();

      const response = await request(app)
        .post("/api/ai/forecast/generate")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          region: "all",
          horizon: "WEEKLY",
        });

      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(3000);
    });
  });

  /**
   * ====================
   * HEALTH CHECK TESTS
   * ====================
   */
  describe("Phase 10 Health Check", () => {
    it("should return operational status for all services", async () => {
      const response = await request(app).get("/api/ai/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.phase).toBe("Phase 10: AI/ML Services");
      expect(response.body.data.status).toBe("operational");
      expect(response.body.data.services).toHaveProperty("fraudDetection");
      expect(response.body.data.services).toHaveProperty("demandForecasting");
      expect(response.body.data.services).toHaveProperty("routeOptimization");
      expect(response.body.data.services).toHaveProperty("predictiveMaintenance");
      expect(response.body.data.modelVersions).toHaveProperty("fraudDetection");
    });
  });

  /**
   * ====================
   * ERROR HANDLING TESTS
   * ====================
   */
  describe("Error Handling", () => {
    it("should handle invalid UUID format", async () => {
      const response = await request(app)
        .post("/api/ai/fraud/analyze")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          userId: "invalid-uuid",
          amount: 1000,
          currency: "USD",
          paymentMethod: "card",
        });

      expect(response.status).toBe(400);
    });

    it("should handle missing required fields", async () => {
      const response = await request(app)
        .post("/api/ai/route/optimize")
        .set("Authorization", `Bearer ${testJWT}`)
        .send({
          algorithm: "TWO_OPT",
        });

      expect(response.status).toBe(400);
    });

    it("should respect rate limits", async () => {
      // Make multiple rapid requests
      const requests = Array(25)
        .fill(null)
        .map(() =>
          request(app)
            .post("/api/ai/fraud/analyze")
            .set("Authorization", `Bearer ${testJWT}`)
            .send({
              userId: "550e8400-e29b-41d4-a716-446655440000",
              amount: 100,
              currency: "USD",
              paymentMethod: "card",
            }),
        );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some((r) => r.status === 429);

      expect(rateLimited).toBe(true);
    });
  });
});
