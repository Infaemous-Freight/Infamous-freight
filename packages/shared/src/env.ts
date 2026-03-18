/**
 * Centralized Environment Configuration
 *
 * Single source of truth for all environment variables across the monorepo.
 * Provides type-safe access with validated defaults.
 *
 * Usage:
 *   import { env } from '@infamous-freight/shared';
 *   const port = env.API_PORT;
 */

// Helper to parse boolean environment variables
const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
};

// Helper to parse number environment variables
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Environment configuration object
 * All env vars should be accessed through this object
 */
export const env = {
  // General
  NODE_ENV: process.env.NODE_ENV ?? "development",

  // API Configuration
  API_PORT: parseNumber(process.env.API_PORT, 4000),
  API_BASE_URL: process.env.API_BASE_URL ?? "http://localhost:4000",
  REQUEST_TIMEOUT_MS: parseNumber(process.env.REQUEST_TIMEOUT_MS, 30000),

  // Web Configuration
  WEB_PORT: parseNumber(process.env.WEB_PORT, 3000),
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  // Database
  DATABASE_URL: process.env.DATABASE_URL ?? "",

  // Security
  get JWT_SECRET() {
    const v = process.env.JWT_SECRET;
    if (!v && process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set in production");
    }
    if (v === "dev-secret-NOT-FOR-PRODUCTION" && process.env.NODE_ENV === "production") {
      throw new Error("Insecure default JWT_SECRET used in production");
    }
    return v ?? "dev-secret-NOT-FOR-PRODUCTION";
  },
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(",") ?? ["http://localhost:3000"],

  // Rate Limiting
  API_RATE_LIMIT_WINDOW_MS: parseNumber(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  API_RATE_LIMIT_MAX_REQUESTS: parseNumber(process.env.API_RATE_LIMIT_MAX_REQUESTS, 100),

  // Storage
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER ?? "s3",
  STORAGE_REGION: process.env.STORAGE_REGION ?? "auto",
  STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT,
  STORAGE_BUCKET: process.env.STORAGE_BUCKET ?? "infamous-freight",

  // AI Services
  AI_PROVIDER: process.env.AI_PROVIDER ?? "synthetic",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,

  // Voice Services
  VOICE_MAX_FILE_SIZE_MB: parseNumber(process.env.VOICE_MAX_FILE_SIZE_MB, 10),

  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN,
  DD_SERVICE: process.env.DD_SERVICE ?? "infamous-freight-api",
  DD_ENV: process.env.DD_ENV ?? process.env.NODE_ENV ?? "development",
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",

  // Feature Flags
  FEATURE_GET_TRUCKN: parseBoolean(process.env.FEATURE_GET_TRUCKN, true),
  MARKETPLACE_ENABLED: parseBoolean(process.env.MARKETPLACE_ENABLED, true),
  BULLBOARD_ENABLED: parseBoolean(process.env.BULLBOARD_ENABLED, true),
  BULLBOARD_PATH: process.env.BULLBOARD_PATH ?? "/ops/queues",

  // CDN
  CDN_URL: process.env.CDN_URL ?? "https://cdn.infamous-freight.com",

  // Payment
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,

  // Datadog RUM (Web)
  NEXT_PUBLIC_DD_APP_ID: process.env.NEXT_PUBLIC_DD_APP_ID,
  NEXT_PUBLIC_DD_CLIENT_TOKEN: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN,
  NEXT_PUBLIC_DD_SITE: process.env.NEXT_PUBLIC_DD_SITE ?? "datadoghq.com",
  NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV ?? "development",
} as const;

/**
 * Type for environment configuration
 */
export type EnvConfig = typeof env;

/**
 * Validate required environment variables
 * Call this at application startup to fail fast if critical env vars are missing
 */
export function validateEnv(): void {
  const errors: string[] = [];

  // Check critical production env vars
  if (env.NODE_ENV === "production") {
    if (!env.DATABASE_URL) {
      errors.push("DATABASE_URL is required in production");
    }
    void env.JWT_SECRET;
  }

  if (errors.length > 0) {
    console.error("Environment validation failed:", errors);
    throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
  }
}
