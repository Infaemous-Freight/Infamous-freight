import { describe, it, expect, beforeEach, vi } from "vitest";
import { HTTP_STATUS } from "@infamous-freight/shared";
import {
  requireShipper,
  requireDriver,
  requireAdmin,
  enforceOrgIsolation,
} from "./authGuards.js";

describe("authGuards middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: {
        sub: "user-1",
        role: "shipper",
        organizationId: "org-1",
      },
      params: {},
      query: {},
      path: "/test",
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    next = vi.fn();
  });

  it("allows matching organizationId in params", () => {
    req.params.organizationId = "org-1";

    enforceOrgIsolation(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("blocks cross-organization access attempt", () => {
    req.params.organizationId = "org-2";

    enforceOrgIsolation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
    expect(next).not.toHaveBeenCalled();
  });

  it("enforces shipper, driver, and admin role checks", () => {
    requireShipper(req, res, next);
    expect(next).toHaveBeenCalledWith();

    req.user.role = "driver";
    requireDriver(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);

    req.user.role = "admin";
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalledTimes(3);
  });
});
