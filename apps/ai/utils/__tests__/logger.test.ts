/**
 * Tests for AI TypeScript Logger
 */

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { logger } from "../logger";

describe("AI TypeScript Logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("basic methods log without throwing", () => {
    expect(() => logger.info("test message")).not.toThrow();
    expect(() => logger.error("error message")).not.toThrow();
    expect(() => logger.warn("warning message")).not.toThrow();
    expect(() => logger.debug("debug message")).not.toThrow();
  });

  test("aiDecision logs structured decision data", () => {
    expect(() =>
      logger.aiDecision({
        decisionId: "dec-123",
        role: "fleet-manager",
        action: "optimize-route",
        confidence: 0.95,
      }),
    ).not.toThrow();
  });

  test("aiConfidence logs confidence scores", () => {
    expect(() =>
      logger.aiConfidence({
        decisionId: "dec-456",
        value: 0.78,
        reasoning: "Moderate historical data",
        threshold: 0.75,
      }),
    ).not.toThrow();
  });

  test("aiOverride logs overrides", () => {
    expect(() =>
      logger.aiOverride({
        decisionId: "dec-789",
        overrideBy: "manager-456",
        reason: "Special circumstances",
      }),
    ).not.toThrow();
  });

  test("aiGuardrail logs violations", () => {
    expect(() =>
      logger.aiGuardrail({
        type: "safety-threshold",
        severity: "critical",
        description: "Temperature threshold exceeded",
        action: "rejected",
      }),
    ).not.toThrow();
  });

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

    expect(() => logger.error("Error with stack", error)).not.toThrow();
  });
});
