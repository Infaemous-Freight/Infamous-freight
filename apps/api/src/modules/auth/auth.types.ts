export type AuthRole = "user";

export interface SanitizedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  accessTokenExpiresIn: string;
}

export interface AuthenticatedUserContext {
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface JwtAccessTokenPayload {
  sub: string;
  type: "access";
  role: AuthRole;
  email?: string;
}

export interface JwtRefreshTokenPayload {
  sub: string;
  type: "refresh";
  jti: string;
}

export interface RefreshTokenRequestContext {
  ipAddress: string | null;
  userAgent: string | null;
}
