import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JwtClaims } from "../types/jwt.js";

export function verifyAccessToken(token: string): JwtClaims {
  return jwt.verify(token, env.JWT_PUBLIC_KEY, {
    algorithms: ["RS256"]
  }) as JwtClaims;
}

export function signAccessToken(claims: JwtClaims): string {
  return jwt.sign(claims, env.JWT_PRIVATE_KEY, {
    algorithm: "RS256",
    expiresIn: `${env.ACCESS_TOKEN_TTL_MIN}m`
  });
}
