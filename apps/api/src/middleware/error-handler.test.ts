import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { ZodError, z } from "zod";
import { ApiError } from "../utils/errors.js";
import { errorHandler, notFound } from "./error-handler.js";

function mockResponse(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("error-handler middleware", () => {
  it("returns notFound response with requestId when available", () => {
    const req = {
      requestId: "req-123",
      headers: {},
    } as unknown as Request;
    const res = mockResponse();

    notFound(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
        requestId: "req-123",
      },
    });
  });

  it("returns ApiError payload with x-request-id fallback", () => {
    const req = {
      headers: { "x-request-id": "req-from-header" },
    } as unknown as Request;
    const res = mockResponse();
    const next = vi.fn() as unknown as NextFunction;

    errorHandler(new ApiError(403, "FORBIDDEN", "Access denied"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Access denied",
        requestId: "req-from-header",
      },
    });
  });

  it("returns validation payload for zod errors", () => {
    const req = {
      headers: {},
      requestId: "req-zod",
    } as unknown as Request;
    const res = mockResponse();
    const next = vi.fn() as unknown as NextFunction;

    let validationError: ZodError;
    try {
      z.object({ tenantId: z.string().uuid() }).parse({ tenantId: "bad-id" });
      throw new Error("Expected parse to fail");
    } catch (error) {
      validationError = error as ZodError;
    }

    errorHandler(validationError!, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "VALIDATION_ERROR",
          requestId: "req-zod",
        }),
      }),
    );
  });
});
