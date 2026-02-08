/**
 * Tests for Route Optimizer API Handlers
 */

import { jest } from "@jest/globals";
import { optimizeRoute, optimizeMultiStop } from "../services/routeOptimizer";

describe("Route Optimizer API Handlers", () => {
  describe("optimizeRoute", () => {
    it("should optimize a simple route successfully", async () => {
      const req = {
        body: {
          start: { lat: 40.7128, lng: -74.006, name: "Start" },
          end: { lat: 40.758, lng: -73.9855, name: "End" },
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeRoute(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            waypoints: expect.any(Array),
            totalDistance: expect.any(Number),
            estimatedTime: expect.any(Number),
          }),
          optimization: expect.objectContaining({
            comparedToBaseline: expect.any(String),
            fuelSavings: expect.objectContaining({
              liters: expect.any(Number),
              cost: expect.any(Number),
            }),
            timeEstimate: expect.any(String),
          }),
        }),
      );
    });

    it("should optimize route with waypoints", async () => {
      const req = {
        body: {
          start: { lat: 40.7128, lng: -74.006 },
          end: { lat: 40.758, lng: -73.9855 },
          waypoints: [
            { lat: 40.7489, lng: -73.968 },
            { lat: 40.7614, lng: -73.9776 },
          ],
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeRoute(req, res);

      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0] as any;
      expect(result.success).toBe(true);
      expect(result.data.waypoints.length).toBeGreaterThanOrEqual(2);
    });

    it("should return 400 if start is missing", async () => {
      const req = {
        body: {
          end: { lat: 40.758, lng: -73.9855 },
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeRoute(req, res);

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

    it("should return 400 if end is missing", async () => {
      const req = {
        body: {
          start: { lat: 40.7128, lng: -74.006 },
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should format time estimate correctly", async () => {
      const req = {
        body: {
          start: { lat: 40.7128, lng: -74.006 },
          end: { lat: 42.3601, lng: -71.0589 }, // Boston
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeRoute(req, res);

      const result = res.json.mock.calls[0][0] as any;
      expect(result.optimization.timeEstimate).toMatch(/\dh \d+m/);
    });

    it("should handle errors gracefully", async () => {
      const req = {
        body: {
          start: null,
          end: { lat: 40.758, lng: -73.9855 },
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle internal server errors", async () => {
      // Force an error by passing data that causes RouteOptimizer to fail
      const req = {
        body: {
          start: { lat: NaN, lng: NaN },
          end: { lat: NaN, lng: NaN },
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeRoute(req, res);

      // Should handle error gracefully
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("optimizeMultiStop", () => {
    it("should optimize multi-stop route successfully", async () => {
      const req = {
        body: {
          start: { lat: 40.7128, lng: -74.006 },
          stops: [
            { lat: 40.758, lng: -73.9855 },
            { lat: 40.7489, lng: -73.968 },
            { lat: 40.7614, lng: -73.9776 },
          ],
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeMultiStop(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            waypoints: expect.any(Array),
            totalDistance: expect.any(Number),
          }),
          optimization: expect.objectContaining({
            stopCount: 3,
            comparedToBaseline: expect.any(String),
            fuelSavings: expect.objectContaining({
              liters: expect.any(Number),
              cost: expect.any(Number),
            }),
          }),
        }),
      );
    });

    it("should return 400 if start is missing", async () => {
      const req = {
        body: {
          stops: [{ lat: 40.758, lng: -73.9855 }],
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeMultiStop(req, res);

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

    it("should return 400 if stops is missing", async () => {
      const req = {
        body: {
          start: { lat: 40.7128, lng: -74.006 },
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeMultiStop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if stops is not an array", async () => {
      const req = {
        body: {
          start: { lat: 40.7128, lng: -74.006 },
          stops: "not-an-array",
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeMultiStop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if stops array is empty", async () => {
      const req = {
        body: {
          start: { lat: 40.7128, lng: -74.006 },
          stops: [],
        },
      };

      const res = {
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeMultiStop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle single stop", async () => {
      const req = {
        body: {
          start: { lat: 40.7128, lng: -74.006 },
          stops: [{ lat: 40.758, lng: -73.9855 }],
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeMultiStop(req, res);

      const result = res.json.mock.calls[0][0] as any;
      expect(result.success).toBe(true);
      expect(result.optimization.stopCount).toBe(1);
    });

    it("should handle many stops", async () => {
      const req = {
        body: {
          start: { lat: 40.7128, lng: -74.006 },
          stops: Array.from({ length: 15 }, (_, i) => ({
            lat: 40.7128 + (i + 1) * 0.01,
            lng: -74.006 + (i + 1) * 0.01,
          })),
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeMultiStop(req, res);

      const result = res.json.mock.calls[0][0] as any;
      expect(result.success).toBe(true);
      expect(result.optimization.stopCount).toBe(15);
    });

    it("should handle errors gracefully", async () => {
      const req = {
        body: {
          start: null,
          stops: [{ lat: 40.758, lng: -73.9855 }],
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeMultiStop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should calculate efficiency percentage", async () => {
      const req = {
        body: {
          start: { lat: 40.7128, lng: -74.006 },
          stops: [
            { lat: 40.758, lng: -73.9855 },
            { lat: 40.7489, lng: -73.968 },
          ],
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeMultiStop(req, res);

      const result = res.json.mock.calls[0][0] as any;
      expect(result.optimization.comparedToBaseline).toMatch(/%/);
    });

    it("should handle internal server errors", async () => {
      // Force an error by passing invalid data that causes RouteOptimizer to fail
      const req = {
        body: {
          start: { lat: NaN, lng: NaN },
          stops: [{ lat: 40.758, lng: -73.9855 }],
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await optimizeMultiStop(req, res);

      // Should handle error gracefully
      expect(res.json).toHaveBeenCalled();
    });
  });
});
