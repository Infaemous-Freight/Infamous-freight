/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Zod Validation Schemas Tests
 */

const {
  uuidSchema,
  emailSchema,
  phoneSchema,
  latitudeSchema,
  longitudeSchema,
  coordinatesSchema,
  paginationSchema,
  createShipmentSchema,
  updateShipmentSchema,
  createUserSchema,
  updateUserSchema,
  createPaymentSchema,
  refundSchema,
  updateLocationSchema,
  feedbackSchema,
  validateRequest,
} = require("../../src/lib/validation");

describe("Validation Schemas", () => {
  describe("uuidSchema", () => {
    it("should accept valid UUID", () => {
      const result = uuidSchema.safeParse("123e4567-e89b-12d3-a456-426614174000");
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = uuidSchema.safeParse("not-a-uuid");
      expect(result.success).toBe(false);
    });
  });

  describe("emailSchema", () => {
    it("should accept valid email", () => {
      const result = emailSchema.safeParse("test@example.com");
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = emailSchema.safeParse("not-an-email");
      expect(result.success).toBe(false);
    });

    it("should reject email exceeding max length", () => {
      const longEmail = "a".repeat(310) + "@example.com";
      const result = emailSchema.safeParse(longEmail);
      expect(result.success).toBe(false);
    });
  });

  describe("phoneSchema", () => {
    it("should accept valid phone number", () => {
      const result = phoneSchema.safeParse("+1 (555) 123-4567");
      expect(result.success).toBe(true);
    });

    it("should reject phone that is too short", () => {
      const result = phoneSchema.safeParse("123");
      expect(result.success).toBe(false);
    });

    it("should reject phone with invalid characters", () => {
      const result = phoneSchema.safeParse("abc-def-ghij");
      expect(result.success).toBe(false);
    });
  });

  describe("latitudeSchema", () => {
    it("should accept valid latitude", () => {
      expect(latitudeSchema.safeParse(40.7128).success).toBe(true);
      expect(latitudeSchema.safeParse(-90).success).toBe(true);
      expect(latitudeSchema.safeParse(90).success).toBe(true);
    });

    it("should reject latitude out of range", () => {
      expect(latitudeSchema.safeParse(91).success).toBe(false);
      expect(latitudeSchema.safeParse(-91).success).toBe(false);
    });
  });

  describe("longitudeSchema", () => {
    it("should accept valid longitude", () => {
      expect(longitudeSchema.safeParse(-74.006).success).toBe(true);
      expect(longitudeSchema.safeParse(-180).success).toBe(true);
      expect(longitudeSchema.safeParse(180).success).toBe(true);
    });

    it("should reject longitude out of range", () => {
      expect(longitudeSchema.safeParse(181).success).toBe(false);
      expect(longitudeSchema.safeParse(-181).success).toBe(false);
    });
  });

  describe("coordinatesSchema", () => {
    it("should accept valid coordinates object", () => {
      const result = coordinatesSchema.safeParse({ latitude: 40.7128, longitude: -74.006 });
      expect(result.success).toBe(true);
    });

    it("should reject invalid coordinates", () => {
      const result = coordinatesSchema.safeParse({ latitude: 200, longitude: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe("paginationSchema", () => {
    it("should accept valid pagination params", () => {
      const result = paginationSchema.safeParse({ limit: "10", offset: "0" });
      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(10);
      expect(result.data.offset).toBe(0);
    });

    it("should apply defaults when not provided", () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(0);
    });

    it("should reject limit exceeding 100", () => {
      const result = paginationSchema.safeParse({ limit: 200 });
      expect(result.success).toBe(false);
    });

    it("should reject negative offset", () => {
      const result = paginationSchema.safeParse({ offset: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe("createShipmentSchema", () => {
    it("should accept valid shipment creation data", () => {
      const result = createShipmentSchema.safeParse({
        trackingNumber: "TRK-001",
        weight: 10,
        priority: "standard",
      });
      expect(result.success).toBe(true);
    });

    it("should reject when tracking number is missing", () => {
      const result = createShipmentSchema.safeParse({ weight: 10 });
      expect(result.success).toBe(false);
    });

    it("should apply default priority", () => {
      const result = createShipmentSchema.safeParse({ trackingNumber: "TRK-001" });
      expect(result.success).toBe(true);
      expect(result.data.priority).toBe("standard");
    });
  });

  describe("updateShipmentSchema", () => {
    it("should accept valid status update", () => {
      const result = updateShipmentSchema.safeParse({ status: "delivered" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = updateShipmentSchema.safeParse({ status: "unknown_status" });
      expect(result.success).toBe(false);
    });
  });

  describe("createUserSchema", () => {
    it("should accept valid user creation data", () => {
      const result = createUserSchema.safeParse({
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "user",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const result = createUserSchema.safeParse({ email: "user@example.com" });
      expect(result.success).toBe(false);
    });

    it("should default role to user", () => {
      const result = createUserSchema.safeParse({
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
      });
      expect(result.success).toBe(true);
      expect(result.data.role).toBe("user");
    });
  });

  describe("updateUserSchema", () => {
    it("should accept partial user update", () => {
      const result = updateUserSchema.safeParse({ firstName: "Jane" });
      expect(result.success).toBe(true);
    });

    it("should accept empty update object", () => {
      const result = updateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("createPaymentSchema", () => {
    it("should accept valid payment data", () => {
      const result = createPaymentSchema.safeParse({
        amount: 99.99,
        currency: "USD",
        paymentMethod: "card",
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero or negative amount", () => {
      const result = createPaymentSchema.safeParse({
        amount: 0,
        paymentMethod: "card",
      });
      expect(result.success).toBe(false);
    });

    it("should default currency to USD", () => {
      const result = createPaymentSchema.safeParse({ amount: 50, paymentMethod: "card" });
      expect(result.success).toBe(true);
      expect(result.data.currency).toBe("USD");
    });
  });

  describe("refundSchema", () => {
    it("should accept valid refund request", () => {
      const result = refundSchema.safeParse({
        paymentId: "123e4567-e89b-12d3-a456-426614174000",
        reason: "Customer requested refund",
      });
      expect(result.success).toBe(true);
    });

    it("should require reason", () => {
      const result = refundSchema.safeParse({
        paymentId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateLocationSchema", () => {
    it("should accept valid location update", () => {
      const result = updateLocationSchema.safeParse({
        shipmentId: "123e4567-e89b-12d3-a456-426614174000",
        latitude: 40.7128,
        longitude: -74.006,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid coordinates", () => {
      const result = updateLocationSchema.safeParse({
        shipmentId: "123e4567-e89b-12d3-a456-426614174000",
        latitude: 200,
        longitude: -74.006,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("feedbackSchema", () => {
    it("should accept valid feedback", () => {
      const result = feedbackSchema.safeParse({
        rating: 5,
        comment: "Great service!",
        category: "service",
      });
      expect(result.success).toBe(true);
    });

    it("should reject rating out of range", () => {
      expect(feedbackSchema.safeParse({ rating: 0 }).success).toBe(false);
      expect(feedbackSchema.safeParse({ rating: 6 }).success).toBe(false);
    });

    it("should default category to other", () => {
      const result = feedbackSchema.safeParse({ rating: 4 });
      expect(result.success).toBe(true);
      expect(result.data.category).toBe("other");
    });
  });

  describe("validateRequest middleware", () => {
    const { z } = require("zod");
    const testSchema = z.object({ name: z.string().min(1) });

    it("should pass valid request body to next()", () => {
      const middleware = validateRequest(testSchema, "body");
      const req = { body: { name: "test" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body).toEqual({ name: "test" });
    });

    it("should return 400 for invalid request body", () => {
      const middleware = validateRequest(testSchema, "body");
      const req = { body: { name: "" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Validation failed" }),
      );
    });

    it("should validate query params when source is query", () => {
      const middleware = validateRequest(testSchema, "query");
      const req = { query: { name: "test" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
