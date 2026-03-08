import jwt from "jsonwebtoken";
import type { JwtClaims } from "@infamous/shared";
import { env } from "../config/env.js";

export function verifyAccessToken(token: string): JwtClaims {
  return jwt.verify(token, env.jwtPublicKey ?? env.jwtSecret, {
    algorithms: ["RS256"]
  }) as JwtClaims;
}
