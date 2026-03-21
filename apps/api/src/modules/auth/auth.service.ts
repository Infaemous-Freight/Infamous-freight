import type { Request } from "express";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/errors.js";
import {
  AUTH_ERROR_CODES,
  INVALID_CREDENTIALS_MESSAGE,
  REFRESH_TOKEN_COOKIE_BODY_FIELD,
} from "./auth.constants.js";
import { authRepository } from "./auth.repository.js";
import {
  calculateExpiryDate,
  clearRefreshTokenCookie,
  generateJti,
  hashRefreshToken,
  sanitizeUser,
  setRefreshTokenCookie,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./auth.utils.js";
import { hashPassword, verifyPassword } from "./password.utils.js";
import type {
  AuthTokensResponse,
  JwtAccessTokenPayload,
  RefreshTokenRequestContext,
  SanitizedUser,
  TokenPair,
} from "./auth.types.js";

function getClientMetadata(request: Request): RefreshTokenRequestContext {
  const forwardedFor = request.headers["x-forwarded-for"];
  const ipAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim() ?? null
      : request.ip ?? null;

  return {
    ipAddress,
    userAgent: request.get("user-agent") ?? null,
  };
}

function buildAccessToken(user: { id: string; email: string; role: string }): string {
  const payload: JwtAccessTokenPayload = {
    sub: user.id,
    type: "access",
    role: "user",
    email: user.email,
  };

  return signAccessToken(payload);
}

async function issueTokenPair(
  user: { id: string; email: string; role: string },
  context: RefreshTokenRequestContext,
): Promise<TokenPair> {
  const jti = generateJti();
  const refreshToken = signRefreshToken({
    sub: user.id,
    type: "refresh",
    jti,
  });

  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    jti,
    expiresAt: calculateExpiryDate(env.jwtRefreshExpiresIn),
    createdByIp: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    accessToken: buildAccessToken(user),
    refreshToken,
    accessTokenExpiresIn: env.jwtAccessExpiresIn,
    refreshTokenExpiresIn: env.jwtRefreshExpiresIn,
  };
}

function extractRefreshToken(request: Request): string | null {
  const cookieToken = request.cookies?.[env.authCookieName];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  const bodyToken = request.body?.[REFRESH_TOKEN_COOKIE_BODY_FIELD];
  return typeof bodyToken === "string" && bodyToken.length > 0 ? bodyToken : null;
}

function buildAuthResponse(user: SanitizedUser, tokenPair: TokenPair): { user: SanitizedUser; accessToken: string; accessTokenExpiresIn: string } {
  return {
    user,
    accessToken: tokenPair.accessToken,
    accessTokenExpiresIn: tokenPair.accessTokenExpiresIn,
  };
}

export const authService = {
  getClientMetadata,

  async register(
    input: { firstName: string; lastName: string; email: string; password: string },
    context: RefreshTokenRequestContext,
  ): Promise<{ user: SanitizedUser; tokens: TokenPair }> {
    const existingUser = await authRepository.findUserByEmail(input.email);
    if (existingUser) {
      throw new ApiError(409, AUTH_ERROR_CODES.emailAlreadyRegistered, "Email is already registered");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.createUser({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash,
    });

    const tokenPair = await issueTokenPair({ ...user, role: "user" }, context);
    return { user: sanitizeUser(user), tokens: tokenPair };
  },

  async login(
    input: { email: string; password: string },
    context: RefreshTokenRequestContext,
  ): Promise<{ user: SanitizedUser; tokens: TokenPair }> {
    const user = await authRepository.findUserByEmail(input.email);

    if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
      throw new ApiError(401, AUTH_ERROR_CODES.invalidCredentials, INVALID_CREDENTIALS_MESSAGE);
    }

    if (!user.isActive) {
      throw new ApiError(403, AUTH_ERROR_CODES.inactiveUser, "User account is inactive");
    }

    await authRepository.updateLastLoginAt(user.id);
    const tokenPair = await issueTokenPair(user, context);

    return {
      user: sanitizeUser(user),
      tokens: tokenPair,
    };
  },

  async refresh(request: Request): Promise<AuthTokensResponse & { refreshToken: string }> {
    const rawRefreshToken = extractRefreshToken(request);

    if (!rawRefreshToken) {
      throw new ApiError(401, AUTH_ERROR_CODES.invalidRefreshToken, "Refresh token is required");
    }

    const payload = verifyRefreshToken(rawRefreshToken);
    const tokenRecord = await authRepository.findRefreshTokenByJti(payload.jti);

    if (!tokenRecord) {
      throw new ApiError(401, AUTH_ERROR_CODES.invalidRefreshToken, "Invalid refresh token");
    }

    const context = getClientMetadata(request);
    const tokenHash = hashRefreshToken(rawRefreshToken);

    if (tokenRecord.tokenHash !== tokenHash) {
      await authRepository.revokeAllActiveRefreshTokensForUser(tokenRecord.userId, context.ipAddress);
      throw new ApiError(401, AUTH_ERROR_CODES.invalidRefreshToken, "Invalid refresh token");
    }

    if (tokenRecord.revokedAt || tokenRecord.expiresAt <= new Date()) {
      await authRepository.revokeAllActiveRefreshTokensForUser(tokenRecord.userId, context.ipAddress);
      throw new ApiError(401, AUTH_ERROR_CODES.invalidRefreshToken, "Refresh token is no longer valid");
    }

    if (!tokenRecord.user.isActive) {
      await authRepository.revokeAllActiveRefreshTokensForUser(tokenRecord.userId, context.ipAddress);
      throw new ApiError(403, AUTH_ERROR_CODES.inactiveUser, "User account is inactive");
    }

    const replacementTokenPair = await issueTokenPair(tokenRecord.user, context);
    const replacementPayload = verifyRefreshToken(replacementTokenPair.refreshToken);
    const replacementRecord = await authRepository.findRefreshTokenByJti(replacementPayload.jti);

    if (!replacementRecord) {
      throw new ApiError(500, "REFRESH_ROTATION_FAILED", "Failed to rotate refresh token");
    }

    await authRepository.revokeRefreshToken(tokenRecord.id, context.ipAddress, replacementRecord.id);

    return {
      accessToken: replacementTokenPair.accessToken,
      accessTokenExpiresIn: replacementTokenPair.accessTokenExpiresIn,
      refreshToken: replacementTokenPair.refreshToken,
    };
  },

  async logout(request: Request): Promise<void> {
    const rawRefreshToken = extractRefreshToken(request);

    if (!rawRefreshToken) {
      return;
    }

    try {
      const payload = verifyRefreshToken(rawRefreshToken);
      const tokenRecord = await authRepository.findRefreshTokenByJti(payload.jti);
      if (!tokenRecord || tokenRecord.revokedAt) {
        return;
      }

      const context = getClientMetadata(request);
      await authRepository.revokeRefreshToken(tokenRecord.id, context.ipAddress);
    } catch {
      return;
    }
  },

  async logoutAll(userId: string, ipAddress: string | null): Promise<void> {
    await authRepository.revokeAllActiveRefreshTokensForUser(userId, ipAddress);
  },

  async getCurrentUser(userId: string): Promise<SanitizedUser> {
    const user = await authRepository.findSafeUserById(userId);
    if (!user) {
      throw new ApiError(404, AUTH_ERROR_CODES.userNotFound, "User not found");
    }

    return sanitizeUser(user);
  },

  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
