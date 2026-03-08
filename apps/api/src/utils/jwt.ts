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
  const verificationKey = env.jwtPublicKey ?? env.jwtSecret;

  if (!verificationKey) {
    throw new Error("JWT verification key is not configured");
  }

  const algorithms = env.jwtPublicKey ? (["RS256"] as jwt.Algorithm[]) : (["HS256"] as jwt.Algorithm[]);

  const decoded = jwt.verify(token, verificationKey, {
    algorithms,
  });

  return decoded as AuthClaims;
}
