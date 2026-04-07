import { describe, expect, it } from "vitest";
import { requireTenantContext, withTenantWhere } from "./tenant-scope.js";

describe("tenant-scope", () => {
  it("requires tenant context", () => {
    expect(() => requireTenantContext(undefined)).toThrow(/tenantId context is required/);
  });

  it("injects tenantId into where clauses", () => {
    expect(withTenantWhere("tenant-1", { id: "abc" })).toEqual({
      id: "abc",
      tenantId: "tenant-1",
    });
  });
});
