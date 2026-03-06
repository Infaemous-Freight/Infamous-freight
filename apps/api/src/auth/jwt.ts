import jwt from "jsonwebtoken";
import type { Role } from "@infamous/shared";
import { ENV } from "../env.js";

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: Role;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
}
