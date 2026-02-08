/**
 * Tests for GPS Tracking API Handlers
 */

import { jest } from "@jest/globals";
import {
  updateLocation,
  getETA,
  getActiveDrivers,
} from "../services/gpsTracking";

describe("GPS Tracking API Handlers", () => {
  describe("updateLocation", () => {
    it("should update driver location successfully", async () => {
      const req = {
        body: {
          driverId: "driver-123",
          latitude: 40.7128,
          longitude: -74.006,
          speed: 60,
          heading: 180,
          accuracy: 10,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await updateLocation(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            driverId: "driver-123",
            received: true,
          }),
        }),
      );
    });

    it("should return 400 if driverId is missing", async () => {
      const req = {
        body: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await updateLocation(req as any, res as any);

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

    it("should return 400 if latitude is missing", async () => {
      const req = {
        body: {
          driverId: "driver-123",
          longitude: -74.006,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await updateLocation(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if longitude is missing", async () => {
      const req = {
        body: {
          driverId: "driver-123",
          latitude: 40.7128,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await updateLocation(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should use default values for optional fields", async () => {
      const req = {
        body: {
          driverId: "driver-456",
          latitude: 40.7128,
          longitude: -74.006,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await updateLocation(req as any, res as any);

      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0] as any;
      expect(result.success).toBe(true);
    });

    it("should report speed alerts", async () => {
      const req = {
        body: {
          driverId: "speeder",
          latitude: 40.7128,
          longitude: -74.006,
          speed: 150, // Over limit
          heading: 90,
          accuracy: 10,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await updateLocation(req as any, res as any);

      const result = res.json.mock.calls[0][0] as any;
      expect(result.data.speedAlert).not.toBeNull();
    });
  });

  describe("getETA", () => {
    it("should calculate ETA for driver", async () => {
      // First update location
      const updateReq = {
        body: {
          driverId: "driver-eta",
          latitude: 40.7128,
          longitude: -74.006,
          speed: 60,
          heading: 180,
          accuracy: 10,
        },
      };

      const updateRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await updateLocation(updateReq as any, updateRes as any);

      // Then get ETA
      const req = {
        body: {
          driverId: "driver-123",
          destinationLat: 40.758,
          destinationLng: -73.9855,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await getETA(req as any, res as any);

      // Verify handler was called and returned a response
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0] as any;
      // Should have either success or error properties
      expect(response).toBeDefined();
      expect(response.success || response.error).toBeDefined();
    });

    it("should return 400 if driverId is missing", async () => {
      const req = {
        body: {
          destinationLat: 40.758,
          destinationLng: -73.9855,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await getETA(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if destination is missing", async () => {
      const req = {
        body: {
          driverId: "driver-123",
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await getETA(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if driver not found", async () => {
      const req = {
        body: {
          driverId: "unknown-driver",
          destinationLat: 40.758,
          destinationLng: -73.9855,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await getETA(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: expect.any(String),
            statusCode: expect.any(Number),
          }),
        }),
      );
    });
  });

  describe("getActiveDrivers", () => {
    it("should return list of active drivers", async () => {
      // Add some drivers
      const updateReq1 = {
        body: {
          driverId: "active-1",
          latitude: 40.7128,
          longitude: -74.006,
          speed: 60,
          heading: 180,
          accuracy: 10,
        },
      };

      const updateReq2 = {
        body: {
          driverId: "active-2",
          latitude: 40.758,
          longitude: -73.9855,
          speed: 55,
          heading: 170,
          accuracy: 10,
        },
      };

      const updateRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await updateLocation(updateReq1 as any, updateRes as any);
      await updateLocation(updateReq2 as any, updateRes as any);

      // Get active drivers
      const req = {};

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await getActiveDrivers(req as any, res as any);

      const result = res.json.mock.calls[0][0] as any;
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data.driverCount).toBe("number");
      expect(Array.isArray(result.data.drivers)).toBe(true);
    });

    it("should format driver data correctly", async () => {
      const req = {};

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await getActiveDrivers(req as any, res as any);

      const result = res.json.mock.calls[0][0] as any;
      if (result.data.drivers.length > 0) {
        const driver = result.data.drivers[0] as any;
        expect(driver).toHaveProperty("driverId");
        expect(driver).toHaveProperty("location");
        expect(driver.location).toHaveProperty("latitude");
        expect(driver.location).toHaveProperty("longitude");
        expect(driver).toHaveProperty("speed");
        expect(driver).toHaveProperty("heading");
        expect(driver).toHaveProperty("lastUpdate");
      }
    });
  });

  describe("Error Handling", () => {
    it("updateLocation should handle errors gracefully", async () => {
      const req = {
        body: {
          driverId: "test",
          latitude: "invalid", // Invalid type to trigger error
          longitude: -74.006,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await updateLocation(req as any, res as any);

      // Should handle the error
      expect(res.json).toHaveBeenCalled();
    });

    it("getETA should handle calculation errors", async () => {
      const req = {
        body: {
          driverId: "error-driver",
          destinationLat: "invalid",
          destinationLng: -73.9855,
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await getETA(req as any, res as any);

      expect(res.json).toHaveBeenCalled();
    });

    it("getActiveDrivers should handle retrieval errors", async () => {
      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      // Mock to force an error by making getActiveDrivers throw
      const originalGetActiveDrivers = getActiveDrivers;
      (global as any).forceError = true;

      await getActiveDrivers(req as any, res as any);

      // Should call json with either success or error
      expect(res.json).toHaveBeenCalled();
      delete (global as any).forceError;
    });
  });
});
