import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JwtClaims } from "../types/jwt.js";

function normalizePemKey(key: string): string {
  // Support keys provided with literal '\n' sequences in env files
  return key.replace(/\\n/g, "\n");
}

export function verifyAccessToken(token: string): JwtClaims {
  return jwt.verify(token, normalizePemKey(env.JWT_PUBLIC_KEY), {
    algorithms: ["RS256"]
  }) as JwtClaims;
}

export function signAccessToken(claims: JwtClaims): string {
  return jwt.sign(claims, normalizePemKey(env.JWT_PRIVATE_KEY), {
    algorithm: "RS256",
    expiresIn: `${env.ACCESS_TOKEN_TTL_MIN}m`
  });
}
