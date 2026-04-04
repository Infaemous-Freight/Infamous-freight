import { describe, expect, it } from "vitest";

import { isValidDatabaseUrl } from "./database-url.js";

describe("isValidDatabaseUrl", () => {
  it("accepts complete postgres connection strings", () => {
    expect(isValidDatabaseUrl("postgresql://infamous:secret@infamous-freight-db.flycast:5432/infamous_freight_prod")).toBe(true);
    expect(isValidDatabaseUrl("postgres://infamous-freight-db.flycast:5432/infamous_freight_prod")).toBe(true);
  });

  it("rejects urls without a database name or hostname", () => {
    expect(isValidDatabaseUrl("postgresql://infamous-freight-db.flycast")).toBe(false);
    expect(isValidDatabaseUrl("postgresql://infamous-freight-db.flycast/")).toBe(false);
    expect(isValidDatabaseUrl("postgresql:///infamous_freight_prod")).toBe(false);
  });

  it("rejects non-postgres protocols", () => {
    expect(isValidDatabaseUrl("mysql://localhost:3306/infamous_freight")).toBe(false);
  });
});
