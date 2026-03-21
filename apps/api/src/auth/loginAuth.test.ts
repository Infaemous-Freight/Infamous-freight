import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import {
  hashRefreshToken,
  generateRefreshToken,
  issueAccessToken,
  verifyAccessToken,
} from "./loginAuth.js";

const SECRET = "test-jwt-secret-for-unit-tests";

const testUser = {
  id: "user-001",
  email: "dispatcher@example.com",
  role: "dispatcher",
  tenantId: "tenant-001",
};

describe("hashRefreshToken", () => {
  it("returns a hex string", () => {
    const hash = hashRefreshToken("some-raw-token");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces the same hash for the same input", () => {
    expect(hashRefreshToken("abc")).toBe(hashRefreshToken("abc"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashRefreshToken("abc")).not.toBe(hashRefreshToken("def"));
  });
});

describe("generateRefreshToken", () => {
  it("returns a hex string of length 80", () => {
    const token = generateRefreshToken();
    expect(token).toMatch(/^[0-9a-f]{80}$/);
  });

  it("produces unique tokens on successive calls", () => {
    const t1 = generateRefreshToken();
    const t2 = generateRefreshToken();
    expect(t1).not.toBe(t2);
  });
});

describe("issueAccessToken", () => {
  it("returns a valid JWT string", () => {
    const token = issueAccessToken(testUser, SECRET);
    expect(typeof token).toBe("string");
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

  it("encodes the correct claims", () => {
    const token = issueAccessToken(testUser, SECRET);
    const decoded = jwt.decode(token) as Record<string, unknown>;
    expect(decoded.sub).toBe("user-001");
    expect(decoded.email).toBe("dispatcher@example.com");
    expect(decoded.role).toBe("dispatcher");
    expect(decoded.tenant_id).toBe("tenant-001");
    expect(decoded.scopes).toEqual([]);
  });

  it("sets a 15-minute expiry", () => {
    const before = Math.floor(Date.now() / 1000);
    const token = issueAccessToken(testUser, SECRET);
    const after = Math.floor(Date.now() / 1000);
    const decoded = jwt.decode(token) as Record<string, number>;
    expect(decoded.exp).toBeGreaterThanOrEqual(before + 15 * 60);
    expect(decoded.exp).toBeLessThanOrEqual(after + 15 * 60 + 2);
  });
});

describe("verifyAccessToken", () => {
  it("decodes a valid token", () => {
    const token = issueAccessToken(testUser, SECRET);
    const payload = verifyAccessToken(token, SECRET);
    expect(payload.sub).toBe("user-001");
    expect(payload.role).toBe("dispatcher");
    expect(payload.tenant_id).toBe("tenant-001");
  });

  it("throws on an expired token", () => {
    const expired = jwt.sign({ sub: "user-001" }, SECRET, { expiresIn: -1 });
    expect(() => verifyAccessToken(expired, SECRET)).toThrow();
  });

  it("throws on a token signed with a different secret", () => {
    const token = issueAccessToken(testUser, SECRET);
    expect(() => verifyAccessToken(token, "wrong-secret")).toThrow();
  });

  it("throws on a malformed token", () => {
    expect(() => verifyAccessToken("not.a.jwt", SECRET)).toThrow();
  });
});
