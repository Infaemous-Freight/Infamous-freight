export const AUTH_ROLES = ["dispatcher", "driver", "admin"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  role: AuthRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

export interface AccessTokenClaims {
  sub: string;
  tenantId: string;
  role: AuthRole;
  email: string;
  sessionId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    tenantId: string;
    email: string;
    role: AuthRole;
    createdAt: Date;
    updatedAt: Date;
  };
  tokens: AuthTokens;
}
