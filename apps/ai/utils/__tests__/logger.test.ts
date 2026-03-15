import { vi } from "vitest";
/**
 * Tests for AI TypeScript Logger
 */

import { logger } from "../logger";

describe("AI TypeScript Logger", () => {
  // Mock console to avoid test output noise
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation();
    vi.spyOn(console, "error").mockImplementation();
    vi.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic logging methods", () => {
    test("info() logs without throwing", () => {
      expect(() => logger.info("test message")).not.toThrow();
    });

    test("error() logs without throwing", () => {
      expect(() => logger.error("error message")).not.toThrow();
    });

    test("warn() logs without throwing", () => {
      expect(() => logger.warn("warning message")).not.toThrow();
    });

    test("debug() logs without throwing", () => {
      expect(() => logger.debug("debug message")).not.toThrow();
    });
  });

  describe("AI-specific logging methods", () => {
    test("aiDecision() logs structured decision data", () => {
      const decisionId = "dec-123";
      const data = {
        role: "fleet-manager",
        action: "optimize-route",
        confidence: 0.95,
      };

      expect(() => logger.aiDecision({ decisionId, ...data })).not.toThrow();
    });

    test("aiConfidence() logs confidence scores with thresholds", () => {
      const decisionId = "dec-456";
      const confidence = {
        value: 0.78,
        reasoning: "Moderate historical data",
        threshold: 0.75,
      };

      expect(() => logger.aiConfidence({ decisionId, ...confidence })).not.toThrow();
    });

    test("aiOverride() logs human overrides with reason", () => {
      const decisionId = "dec-789";
      const override = {
        overrideBy: "manager-456",
        reason: "Special circumstances",
        timestamp: new Date().toISOString(),
      };

      expect(() => logger.aiOverride({ decisionId, ...override })).not.toThrow();
    });

    test("aiGuardrail() logs guardrail violations", () => {
      const violation = {
        type: "safety-threshold",
        severity: "critical",
        description: "Temperature threshold exceeded",
        action: "rejected",
      };

      expect(() => logger.aiGuardrail(violation)).not.toThrow();
    });
  });

  describe("TypeScript type safety", () => {
    test("accepts typed metadata objects", () => {
      const metadata: Record<string, unknown> = {
        userId: "user-123",
        requestId: "req-456",
        timestamp: Date.now(),
      };

      expect(() => logger.info("typed message", metadata)).not.toThrow();
    });

    test("handles Error objects correctly", () => {
      const error = new Error("Typed error");
      error.stack = "Stack trace";

      expect(() => logger.error("Error with stack", { error })).not.toThrow();
    });
  });

  describe("Structured data", () => {
    test("logs complex nested objects", () => {
      const complexData = {
        shipment: {
          id: "ship-123",
          status: "in-transit",
          route: ["origin", "waypoint1", "destination"],
        },
        driver: {
          id: "drv-456",
          name: "John Doe",
        },
      };

      expect(() => logger.info("Complex shipment data", complexData)).not.toThrow();
    });
  });
});
