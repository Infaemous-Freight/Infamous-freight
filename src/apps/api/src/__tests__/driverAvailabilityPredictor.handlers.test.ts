/**
 * Tests for Driver Availability Predictor API Handlers
 */

import { jest } from "@jest/globals";
import {
  predictAvailability,
  getRecommendations,
} from "../services/driverAvailabilityPredictor";

describe("Driver Availability Predictor API Handlers", () => {
  describe("predictAvailability", () => {
    it("should predict driver availability successfully", async () => {
      const req = {
        body: {
          driverId: "driver-123",
          currentTime: new Date().toISOString(),
          weatherCondition: "clear",
          trafficLevel: 30,
          recentLoadCount: 5,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await predictAvailability(req as any, res as any);

      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0] as any;
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.availabilityProbability).toBeGreaterThanOrEqual(0);
      expect(result.data.availabilityProbability).toBeLessThanOrEqual(1);
    });

    it("should return 400 if driverId is missing", async () => {
      const req = {
        body: {
          weatherCondition: "clear",
          trafficLevel: 30,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await predictAvailability(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: expect.any(String),
            statusCode: expect.any(Number),
          }),
        }),
      );
    });

    it("should handle different weather conditions", async () => {
      const weatherConditions = ["clear", "rain", "snow", "fog"];

      for (const weather of weatherConditions) {
        const req = {
          body: {
            driverId: "driver-weather-test",
            currentTime: new Date().toISOString(),
            weatherCondition: weather,
            trafficLevel: 50,
            recentLoadCount: 3,
          },
        };

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        };

        await predictAvailability(req as any, res as any);

        const result = res.json.mock.calls[0][0] as any;
        expect(result.success).toBe(true);
      }
    });

    it("should handle high traffic levels", async () => {
      const req = {
        body: {
          driverId: "driver-traffic",
          currentTime: new Date().toISOString(),
          weatherCondition: "clear",
          trafficLevel: 95,
          recentLoadCount: 10,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await predictAvailability(req as any, res as any);

      const result = res.json.mock.calls[0][0] as any;
      expect(result.success).toBe(true);
      expect(result.data.factors.traffic).toBeDefined();
    });

    it("should include confidence score", async () => {
      const req = {
        body: {
          driverId: "driver-confidence",
          currentTime: new Date().toISOString(),
          weatherCondition: "rain",
          trafficLevel: 60,
          recentLoadCount: 7,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await predictAvailability(req as any, res as any);

      const result = res.json.mock.calls[0][0] as any;
      expect(result.data.confidence).toBeGreaterThanOrEqual(0);
      expect(result.data.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("getRecommendations", () => {
    it("should return driver recommendations", async () => {
      const req = {
        body: {
          targetTime: new Date().toISOString(),
          minAvailability: 0.7,
          limit: 10,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await getRecommendations(req as any, res as any);

      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0] as any;
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data.recommendations)).toBe(true);
    });

    it("should return 400 if targetTime is missing", async () => {
      const req = {
        body: {
          minAvailability: 0.7,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await getRecommendations(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should filter by minimum availability threshold", async () => {
      const req = {
        body: {
          targetTime: new Date().toISOString(),
          minAvailability: 0.8,
          limit: 5,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await getRecommendations(req as any, res as any);

      const result = res.json.mock.calls[0][0] as any;
      if (result.success && result.data.recommendations.length > 0) {
        result.data.recommendations.forEach((rec: any) => {
          expect(rec.availabilityProbability).toBeGreaterThanOrEqual(0.8);
        });
      }
    });

    it("should respect limit parameter", async () => {
      const req = {
        body: {
          targetTime: new Date().toISOString(),
          minAvailability: 0.5,
          limit: 3,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await getRecommendations(req as any, res as any);

      const result = res.json.mock.calls[0][0] as any;
      expect(result.data.recommendations.length).toBeLessThanOrEqual(3);
    });
  });

  describe("Error Handling", () => {
    it("should handle prediction errors gracefully", async () => {
      const req = {
        body: {
          driverId: "error-driver",
          currentTime: "invalid-date",
          weatherCondition: "clear",
          trafficLevel: 50,
          recentLoadCount: 5,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await predictAvailability(req as any, res as any);

      expect(res.json).toHaveBeenCalled();
    });

    it("should handle recommendation errors gracefully", async () => {
      const req = {
        body: {
          targetTime: "invalid",
          minAvailability: -1,
          limit: 0,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await getRecommendations(req as any, res as any);

      expect(res.json).toHaveBeenCalled();
    });
  });
});
