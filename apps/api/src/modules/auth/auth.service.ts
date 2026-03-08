import { prisma } from "../../lib/prisma.js";
import { signAccessToken } from "../../lib/jwt.js";
import { randomToken, sha256 } from "../../lib/crypto.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../utils/http-error.js";

export class AuthService {
  async login(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
      scopes: user.scopes as string[]
    });

    const refreshToken = randomToken();
    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    await prisma.refreshToken.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        scopes: user.scopes
      }
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = sha256(refreshToken);

    const existing = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!existing || existing.status !== "ACTIVE") {
      throw new HttpError(401, "Invalid refresh token");
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      await prisma.refreshToken.update({
        where: { id: existing.id },
        data: { status: "EXPIRED" }
      });
      throw new HttpError(401, "Refresh token expired");
    }

    const accessToken = signAccessToken({
      sub: existing.user.id,
      email: existing.user.email,
      organizationId: existing.user.organizationId,
      role: existing.user.role,
      scopes: existing.user.scopes as string[]
    });

    return { accessToken };
  }

  async revoke(refreshToken: string) {
    const tokenHash = sha256(refreshToken);

    const existing = await prisma.refreshToken.findUnique({
      where: { tokenHash }
    });

    if (!existing) {
      return { revoked: true };
    }

    await prisma.refreshToken.update({
      where: { id: existing.id },
      data: {
        status: "REVOKED",
        revokedAt: new Date()
      }
    });

    return { revoked: true };
  }
}
