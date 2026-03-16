import jwt from "jsonwebtoken";
import type { Role } from "@infamous-freight/shared";
import { env } from "../env.js";

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: Role;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
