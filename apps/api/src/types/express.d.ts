import type { AuthClaims } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthClaims;
    }
  }
}

export {};
