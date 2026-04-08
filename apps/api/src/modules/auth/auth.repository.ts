import type { Prisma, RefreshToken, User } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

const safeUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isActive: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const loginUserSelect = {
  ...safeUserSelect,
  passwordHash: true,
  role: true,
} satisfies Prisma.UserSelect;

export type SafeUserRecord = Prisma.UserGetPayload<{ select: typeof safeUserSelect }>;
export type LoginUserRecord = Prisma.UserGetPayload<{ select: typeof loginUserSelect }>;
export type RefreshTokenRecord = RefreshToken & { user: LoginUserRecord };

export const authRepository = {
  findUserByEmail(email: string): Promise<LoginUserRecord | null> {
    return prisma.user.findUnique({ where: { email }, select: loginUserSelect });
  },

  findSafeUserById(id: string): Promise<SafeUserRecord | null> {
    return prisma.user.findUnique({ where: { id }, select: safeUserSelect });
  },

  createUser(
    data: Pick<User, "email" | "firstName" | "lastName" | "passwordHash">,
  ): Promise<SafeUserRecord> {
    return prisma.user.create({
      data: {
        ...data,
        role: "SHIPPER" as const,
      },
      select: safeUserSelect,
    });
  },

  updateLastLoginAt(userId: string): Promise<void> {
    return prisma.user
      .update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
        select: { id: true },
      })
      .then(() => undefined);
  },

  createRefreshToken(data: Prisma.RefreshTokenUncheckedCreateInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  },

  findRefreshTokenByJti(jti: string): Promise<RefreshTokenRecord | null> {
    return prisma.refreshToken.findUnique({
      where: { jti },
      include: {
        user: {
          select: loginUserSelect,
        },
      },
    }) as Promise<RefreshTokenRecord | null>;
  },

  revokeRefreshToken(
    tokenId: string,
    revokedByIp: string | null,
    replacedByTokenId?: string,
  ): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        revokedAt: new Date(),
        revokedByIp,
        replacedByTokenId,
      },
    });
  },

  revokeAllActiveRefreshTokensForUser(userId: string, revokedByIp: string | null): Promise<number> {
    return prisma.refreshToken
      .updateMany({
        where: {
          userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          revokedAt: new Date(),
          revokedByIp,
        },
      })
      .then((result: { count: number }) => result.count);
  },
};
