/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Application Constants Tests
 */

const {
  RATE_LIMITS,
  PAGINATION,
  GEO_BOUNDS,
  FEEDBACK,
  BONUSES,
  METRICS,
  SHIPMENT_PRIORITIES,
  SHIPMENT_STATUSES,
  HTTP_STATUS,
  ERROR_MESSAGES,
  VALIDATION,
  FILE_UPLOAD,
} = require("../../src/config/constants");

describe("Application Constants", () => {
  describe("HTTP_STATUS", () => {
    it("should have correct success codes", () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.ACCEPTED).toBe(202);
      expect(HTTP_STATUS.NO_CONTENT).toBe(204);
    });

    it("should have correct client error codes", () => {
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.CONFLICT).toBe(409);
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
    });

    it("should have correct server error codes", () => {
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
      expect(HTTP_STATUS.BAD_GATEWAY).toBe(502);
      expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503);
    });
  });

  describe("RATE_LIMITS", () => {
    it("should define rate limits for all service types", () => {
      expect(RATE_LIMITS.GENERAL).toBeDefined();
      expect(RATE_LIMITS.AUTH).toBeDefined();
      expect(RATE_LIMITS.AI).toBeDefined();
      expect(RATE_LIMITS.BILLING).toBeDefined();
      expect(RATE_LIMITS.VOICE).toBeDefined();
      expect(RATE_LIMITS.TRACKING).toBeDefined();
    });

    it("should have correct general rate limit values", () => {
      expect(RATE_LIMITS.GENERAL.MAX_REQUESTS).toBe(100);
      expect(RATE_LIMITS.GENERAL.WINDOW_MS).toBe(15 * 60 * 1000);
    });

    it("should have correct auth rate limit values", () => {
      expect(RATE_LIMITS.AUTH.MAX_REQUESTS).toBe(5);
    });

    it("should have correct AI rate limit values", () => {
      expect(RATE_LIMITS.AI.MAX_REQUESTS).toBe(20);
      expect(RATE_LIMITS.AI.WINDOW_MS).toBe(60 * 1000);
    });

    it("should have correct billing rate limit values", () => {
      expect(RATE_LIMITS.BILLING.MAX_REQUESTS).toBe(30);
    });
  });

  describe("PAGINATION", () => {
    it("should define pagination defaults", () => {
      expect(PAGINATION.DEFAULT_LIMIT).toBe(50);
      expect(PAGINATION.DEFAULT_OFFSET).toBe(0);
      expect(PAGINATION.MAX_LIMIT).toBe(100);
    });
  });

  describe("GEO_BOUNDS", () => {
    it("should define valid latitude bounds", () => {
      expect(GEO_BOUNDS.LATITUDE.MIN).toBe(-90);
      expect(GEO_BOUNDS.LATITUDE.MAX).toBe(90);
    });

    it("should define valid longitude bounds", () => {
      expect(GEO_BOUNDS.LONGITUDE.MIN).toBe(-180);
      expect(GEO_BOUNDS.LONGITUDE.MAX).toBe(180);
    });
  });

  describe("SHIPMENT_STATUSES", () => {
    it("should define all required shipment statuses", () => {
      expect(SHIPMENT_STATUSES.PENDING).toBe("pending");
      expect(SHIPMENT_STATUSES.IN_TRANSIT).toBe("in_transit");
      expect(SHIPMENT_STATUSES.DELIVERED).toBe("delivered");
      expect(SHIPMENT_STATUSES.CANCELLED).toBe("cancelled");
      expect(SHIPMENT_STATUSES.FAILED).toBe("failed");
    });
  });

  describe("SHIPMENT_PRIORITIES", () => {
    it("should be an array of priority values", () => {
      expect(Array.isArray(SHIPMENT_PRIORITIES)).toBe(true);
      expect(SHIPMENT_PRIORITIES).toContain("standard");
      expect(SHIPMENT_PRIORITIES).toContain("high");
      expect(SHIPMENT_PRIORITIES).toContain("urgent");
      expect(SHIPMENT_PRIORITIES).toContain("low");
    });
  });

  describe("ERROR_MESSAGES", () => {
    it("should define all standard error messages", () => {
      expect(ERROR_MESSAGES.UNAUTHORIZED).toBeDefined();
      expect(ERROR_MESSAGES.FORBIDDEN).toBeDefined();
      expect(ERROR_MESSAGES.NOT_FOUND).toBeDefined();
      expect(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED).toBeDefined();
      expect(ERROR_MESSAGES.INTERNAL_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.VALIDATION_FAILED).toBeDefined();
    });
  });

  describe("VALIDATION", () => {
    it("should define email max length per RFC 5321", () => {
      expect(VALIDATION.EMAIL_MAX_LENGTH).toBe(320);
    });

    it("should define phone length bounds", () => {
      expect(VALIDATION.PHONE_MIN_LENGTH).toBe(10);
      expect(VALIDATION.PHONE_MAX_LENGTH).toBe(15);
    });

    it("should include UUID regex pattern", () => {
      expect(VALIDATION.UUID_REGEX).toBeInstanceOf(RegExp);
      expect(VALIDATION.UUID_REGEX.test("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
      expect(VALIDATION.UUID_REGEX.test("not-a-uuid")).toBe(false);
    });
  });

  describe("FILE_UPLOAD", () => {
    it("should define voice upload limits", () => {
      expect(FILE_UPLOAD.VOICE.MAX_SIZE_BYTES).toBe(10 * 1024 * 1024);
      expect(Array.isArray(FILE_UPLOAD.VOICE.ALLOWED_TYPES)).toBe(true);
      expect(FILE_UPLOAD.VOICE.ALLOWED_TYPES).toContain("audio/mpeg");
    });

    it("should define document upload limits", () => {
      expect(FILE_UPLOAD.DOCUMENT.MAX_SIZE_BYTES).toBe(50 * 1024 * 1024);
      expect(Array.isArray(FILE_UPLOAD.DOCUMENT.ALLOWED_TYPES)).toBe(true);
      expect(FILE_UPLOAD.DOCUMENT.ALLOWED_TYPES).toContain("application/pdf");
    });
  });

  describe("FEEDBACK", () => {
    it("should define feedback constants", () => {
      expect(FEEDBACK.ID_PREFIX).toBe("fb_");
      expect(FEEDBACK.MAX_LENGTH).toBe(5000);
      expect(FEEDBACK.CRITICAL_RATING_THRESHOLD).toBe(2);
    });
  });

  describe("BONUSES", () => {
    it("should define referral constants", () => {
      expect(BONUSES.REFERRAL_CODE_PREFIX).toBe("REF-");
      expect(BONUSES.REFERRAL_EXPIRY_MS).toBeGreaterThan(0);
    });
  });

  describe("METRICS", () => {
    it("should define cache TTL", () => {
      expect(METRICS.CACHE_TTL_MS).toBe(60000);
    });
  });
});
