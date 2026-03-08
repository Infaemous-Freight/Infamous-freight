import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AuthClaims = {
  sub: string;
  email: string;
  organizationId: string;
  role: string;
  scopes: string[];
};

export function verifyAccessToken(token: string): AuthClaims {
  const decoded = jwt.verify(token, env.JWT_PUBLIC_KEY, {
    algorithms: ["RS256"]
  });

  return decoded as AuthClaims;
}
