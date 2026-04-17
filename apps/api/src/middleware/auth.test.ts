import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors.js";
import { getRequiredTenantId, requireTenantContext } from "./auth.js";

describe("requireTenantContext", () => {
  it("returns TENANT_CONTEXT_REQUIRED when auth or tenant context is missing", () => {
    const req = { headers: {} } as Request;
    const next = vi.fn();

    requireTenantContext(req, {} as Response, next as NextFunction);

    const err = next.mock.calls[0]?.[0] as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("TENANT_CONTEXT_REQUIRED");
  });

  it("hydrates req.user.tenantId from auth organizationId when missing", () => {
    const req = {
      headers: {},
      auth: {
        userId: "user_1",
        role: "SHIPPER",
        tokenType: "access",
        organizationId: "tenant_from_auth",
      },
      user: {
        id: "user_1",
        sub: "user_1",
        email: "user@example.com",
        role: "SHIPPER",
      },
    } as unknown as Request;

    const next = vi.fn();

    requireTenantContext(req, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith();
    expect(req.user?.tenantId).toBe("tenant_from_auth");
    expect(req.tenantId).toBe("tenant_from_auth");
  });

  it("getRequiredTenantId returns tenantId when present", () => {
    const req = { tenantId: "tenant_123", headers: {} } as Request;
    expect(getRequiredTenantId(req)).toBe("tenant_123");
  });

  it("getRequiredTenantId throws ApiError when tenantId is missing", () => {
    const req = { headers: {} } as Request;
    expect(() => getRequiredTenantId(req)).toThrowError(ApiError);
    expect(() => getRequiredTenantId(req)).toThrowError("Tenant context is required");
  });
});
