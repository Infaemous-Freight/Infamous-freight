import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoist all mocks so vi.mock factories can reference them ───────────────────
const {
  mockAuthRepo,
  mockHashPassword,
  mockVerifyPassword,
  mockSignAccess,
  mockSignRefresh,
  mockVerifyRefresh,
  mockHashRefreshToken,
  mockGenerateJti,
  mockSanitizeUser,
  mockCalcExpiry,
  mockSetCookie,
  mockClearCookie,
} = vi.hoisted(() => ({
  mockAuthRepo: {
    findUserByEmail: vi.fn(),
    createUser: vi.fn(),
    updateLastLoginAt: vi.fn(),
    createRefreshToken: vi.fn(),
    findRefreshTokenByJti: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeAllActiveRefreshTokensForUser: vi.fn(),
  },
  mockHashPassword: vi.fn(async () => "hashed-pw"),
  mockVerifyPassword: vi.fn(async () => true),
  mockSignAccess: vi.fn(() => "access.token.mock"),
  mockSignRefresh: vi.fn(() => "refresh.token.mock"),
  mockVerifyRefresh: vi.fn(() => ({ sub: "user-1", jti: "jti-abc", type: "refresh" })),
  mockHashRefreshToken: vi.fn(() => "refresh-token-hash"),
  mockGenerateJti: vi.fn(() => "jti-abc"),
  mockSanitizeUser: vi.fn((u: any) => ({ id: u.id, email: u.email })),
  mockCalcExpiry: vi.fn(() => new Date("2099-01-01")),
  mockSetCookie: vi.fn(),
  mockClearCookie: vi.fn(),
}));

vi.mock("./auth.repository.js", () => ({ authRepository: mockAuthRepo }));
vi.mock("./password.utils.js", () => ({
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword,
}));
vi.mock("./auth.utils.js", () => ({
  signAccessToken: mockSignAccess,
  signRefreshToken: mockSignRefresh,
  verifyRefreshToken: mockVerifyRefresh,
  hashRefreshToken: mockHashRefreshToken,
  generateJti: mockGenerateJti,
  sanitizeUser: mockSanitizeUser,
  calculateExpiryDate: mockCalcExpiry,
  setRefreshTokenCookie: mockSetCookie,
  clearRefreshTokenCookie: mockClearCookie,
}));
vi.mock("../../config/env.js", () => ({
  env: {
    jwtAccessExpiresIn: "15m",
    jwtRefreshExpiresIn: "7d",
    authCookieName: "refresh_token",
    authCookieEnabled: false,
    STRIPE_SECRET_KEY: undefined,
  },
}));

import { authService } from "./auth.service.js";
import { ApiError } from "../../utils/errors.js";

const mockContext = { ipAddress: "127.0.0.1", userAgent: "test-agent" };

const fakeUser = {
  id: "user-1",
  email: "test@example.com",
  firstName: "Jane",
  lastName: "Doe",
  passwordHash: "hashed-pw",
  isActive: true,
  role: "user",
};

// ── register ──────────────────────────────────────────────────────────────────
describe("authService.register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a user and returns sanitized user + token pair", async () => {
    mockAuthRepo.findUserByEmail.mockResolvedValue(null);
    mockAuthRepo.createUser.mockResolvedValue(fakeUser);
    mockAuthRepo.createRefreshToken.mockResolvedValue({});

    const result = await authService.register(
      { firstName: "Jane", lastName: "Doe", email: "test@example.com", password: "Secret1!" },
      mockContext,
    );

    expect(mockHashPassword).toHaveBeenCalledWith("Secret1!");
    expect(mockAuthRepo.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "test@example.com", passwordHash: "hashed-pw" }),
    );
    expect(result.user).toEqual({ id: "user-1", email: "test@example.com" });
    expect(result.tokens.accessToken).toBe("access.token.mock");
    expect(result.tokens.refreshToken).toBe("refresh.token.mock");
  });

  it("throws 409 when email is already registered", async () => {
    mockAuthRepo.findUserByEmail.mockResolvedValue(fakeUser);

    await expect(
      authService.register(
        { firstName: "Jane", lastName: "Doe", email: "test@example.com", password: "Secret1!" },
        mockContext,
      ),
    ).rejects.toThrow(ApiError);

    const err = await authService
      .register(
        { firstName: "Jane", lastName: "Doe", email: "test@example.com", password: "Secret1!" },
        mockContext,
      )
      .catch((e) => e);
    expect(err.statusCode).toBe(409);
  });
});

// ── login ─────────────────────────────────────────────────────────────────────
describe("authService.login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns user and tokens on valid credentials", async () => {
    mockAuthRepo.findUserByEmail.mockResolvedValue(fakeUser);
    mockVerifyPassword.mockResolvedValue(true);
    mockAuthRepo.updateLastLoginAt.mockResolvedValue({});
    mockAuthRepo.createRefreshToken.mockResolvedValue({});

    const result = await authService.login(
      { email: "test@example.com", password: "Secret1!" },
      mockContext,
    );

    expect(mockAuthRepo.updateLastLoginAt).toHaveBeenCalledWith("user-1");
    expect(result.tokens.accessToken).toBe("access.token.mock");
    expect(result.user).toEqual({ id: "user-1", email: "test@example.com" });
  });

  it("throws 401 when user is not found", async () => {
    mockAuthRepo.findUserByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: "missing@example.com", password: "pass" }, mockContext),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 401 when password does not match", async () => {
    mockAuthRepo.findUserByEmail.mockResolvedValue(fakeUser);
    mockVerifyPassword.mockResolvedValue(false);

    await expect(
      authService.login({ email: "test@example.com", password: "wrong" }, mockContext),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 403 when user is inactive", async () => {
    mockAuthRepo.findUserByEmail.mockResolvedValue({ ...fakeUser, isActive: false });
    mockVerifyPassword.mockResolvedValue(true);

    await expect(
      authService.login({ email: "test@example.com", password: "Secret1!" }, mockContext),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ── refresh ───────────────────────────────────────────────────────────────────
describe("authService.refresh", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeRequest(refreshToken?: string) {
    return {
      cookies: refreshToken ? { refresh_token: refreshToken } : {},
      body: {},
      headers: {},
      ip: "127.0.0.1",
      get: (h: string) => (h === "user-agent" ? "test-agent" : undefined),
    } as any;
  }

  const tokenRecord = {
    jti: "jti-abc",
    tokenHash: "refresh-token-hash",
    revokedAt: null,
    expiresAt: new Date("2099-01-01"),
    userId: "user-1",
    user: fakeUser,
  };

  it("throws 401 when no refresh token is present", async () => {
    await expect(authService.refresh(makeRequest())).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 401 when refresh token record is not found", async () => {
    mockVerifyRefresh.mockReturnValue({ sub: "user-1", jti: "jti-abc", type: "refresh" });
    mockAuthRepo.findRefreshTokenByJti.mockResolvedValue(null);

    await expect(authService.refresh(makeRequest("refresh.token.mock"))).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("issues a new token pair on a valid refresh token", async () => {
    mockVerifyRefresh.mockReturnValue({ sub: "user-1", jti: "jti-abc", type: "refresh" });
    mockHashRefreshToken.mockReturnValue("refresh-token-hash");
    mockAuthRepo.findRefreshTokenByJti.mockResolvedValue(tokenRecord);
    mockAuthRepo.revokeRefreshToken.mockResolvedValue({});
    mockAuthRepo.createRefreshToken.mockResolvedValue({});

    const result = await authService.refresh(makeRequest("refresh.token.mock"));

    expect(result.accessToken).toBe("access.token.mock");
    expect(result.refreshToken).toBe("refresh.token.mock");
  });

  it("revokes all tokens and throws 401 on token hash mismatch (token rotation theft detection)", async () => {
    mockVerifyRefresh.mockReturnValue({ sub: "user-1", jti: "jti-abc", type: "refresh" });
    mockHashRefreshToken.mockReturnValue("different-hash"); // mismatch
    mockAuthRepo.findRefreshTokenByJti.mockResolvedValue(tokenRecord);
    mockAuthRepo.revokeAllActiveRefreshTokensForUser.mockResolvedValue({});

    await expect(authService.refresh(makeRequest("refresh.token.mock"))).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(mockAuthRepo.revokeAllActiveRefreshTokensForUser).toHaveBeenCalledWith(
      "user-1",
      "127.0.0.1",
    );
  });
});
