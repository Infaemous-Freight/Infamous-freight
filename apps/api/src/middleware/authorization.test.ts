import { describe, expect, it, vi } from "vitest";
import { requirePermission } from "./authorization.js";

describe("requirePermission", () => {
  it("allows admin role for billing update", () => {
    const req: any = { auth: { role: "ADMIN", userId: "u1" }, method: "POST", path: "/x", headers: {} };
    const next = vi.fn();

    requirePermission("billing:update")(req, {} as any, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("denies viewer role for billing update", () => {
    const req: any = { auth: { role: "VIEWER", userId: "u1" }, method: "POST", path: "/x", headers: {} };
    const next = vi.fn();

    requirePermission("billing:update")(req, {} as any, next);

    const err = next.mock.calls[0]?.[0];
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("PERMISSION_DENIED");
  });
});
