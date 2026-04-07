import { env } from "./env.js";

export function runStartupChecks(): void {
  if (env.nodeEnv !== "production") {
    return;
  }

  if (env.authCookieEnabled && !env.cookieSecret) {
    throw new Error("Startup check failed: COOKIE_SECRET is required in production when auth cookies are enabled.");
  }

  if (env.jwtAlgorithm === "HS256" && !env.jwtSecret) {
    throw new Error("Startup check failed: JWT_SECRET is required in production when JWT_ALGORITHM=HS256.");
  }

  if (env.jwtAlgorithm === "RS256" && (!env.jwtPrivateKey || !env.jwtPublicKey)) {
    throw new Error(
      "Startup check failed: JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are required in production when JWT_ALGORITHM=RS256.",
    );
  }

  const googleAuthPartiallyConfigured =
    Boolean(env.googleClientId) !== Boolean(env.googleClientSecret);

  if (googleAuthPartiallyConfigured) {
    throw new Error(
      "Startup check failed: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must either both be set or both be unset.",
    );
  }
}
