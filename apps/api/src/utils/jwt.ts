import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type AuthClaims = {
  sub: string;
  email: string;
  organizationId: string;
  role: string;
  scopes: string[];
};

export function verifyAccessToken(token: string): AuthClaims {
  const decoded = jwt.verify(token, env.jwtPublicKey ?? env.jwtSecret, {
    algorithms: ["RS256", "HS256"],
  });

  return decoded as AuthClaims;
}
