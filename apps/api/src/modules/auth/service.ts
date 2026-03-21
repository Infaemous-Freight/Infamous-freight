import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../db/prisma.js";
import { ENV } from "../../env.js";
import { HttpError } from "../../utils/errors.js";
import type { AccessTokenClaims, AuthResponse, AuthRole, AuthTokens } from "./types.js";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const BCRYPT_ROUNDS = 12;

function createRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildClaims(input: {
  userId: string;
  tenantId: string;
  role: AuthRole;
  email: string;
  sessionId: string;
}): AccessTokenClaims {
  return {
    sub: input.userId,
    tenantId: input.tenantId,
    role: input.role,
    email: input.email,
    sessionId: input.sessionId,
  };
}

function signAccessToken(claims: AccessTokenClaims): string {
  return jwt.sign(claims, ENV.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
}

async function issueTokens(input: {
  userId: string;
  tenantId: string;
  role: AuthRole;
  email: string;
}): Promise<AuthTokens> {
  const refreshToken = createRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

  const session = await prisma.authSession.create({
    data: {
      userId: input.userId,
      tokenHash,
      expiresAt,
    },
    select: { id: true },
  });

  const accessToken = signAccessToken(
    buildClaims({
      userId: input.userId,
      tenantId: input.tenantId,
      role: input.role,
      email: input.email,
      sessionId: session.id,
    }),
  );

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
  };
}

function sanitizeUser(user: {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role as AuthRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function register(input: {
  email: string;
  password: string;
  tenantName: string;
  role: AuthRole;
}): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, "Email already in use");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({ data: { name: input.tenantName } });
    return tx.user.create({
      data: {
        tenantId: tenant.id,
        email: input.email,
        passwordHash,
        role: input.role,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  const tokens = await issueTokens({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role as AuthRole,
    email: user.email,
  });

  return { user: sanitizeUser(user), tokens };
}

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      tenantId: true,
      email: true,
      role: true,
      passwordHash: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, "Invalid credentials");
  }

  const tokens = await issueTokens({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role as AuthRole,
    email: user.email,
  });

  return { user: sanitizeUser(user), tokens };
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const tokenHash = hashToken(refreshToken);
  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          tenantId: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new HttpError(401, "Invalid refresh token");
  }

  await prisma.authSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokens({
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: session.user.role as AuthRole,
    email: session.user.email,
  });

  return { user: sanitizeUser(session.user), tokens };
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  const session = await prisma.authSession.findUnique({ where: { tokenHash } });
  if (!session) {
    return;
  }

  await prisma.authSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tenantId: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return sanitizeUser(user);
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  return jwt.verify(token, ENV.JWT_SECRET) as AccessTokenClaims;
}
