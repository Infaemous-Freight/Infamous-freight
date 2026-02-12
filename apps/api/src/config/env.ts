/**
 * Environment Configuration with Zod Validation
 * Ensures all required environment variables are present and properly typed
 */

import { z } from "zod";

const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("4000"),
  API_PORT: z.string().default("4000"),

  // Database
  DATABASE_URL: z.string().url().optional(),
  PERSISTENCE_MODE: z.enum(["auto", "json"]).default("auto"),

  // JWT & Auth
  JWT_SECRET: z.string().min(12).default("dev_insecure_change_me_please_update"),
  JWT_EXPIRY: z.string().default("7d"),

  // Avatar Storage (local disk or s3-compatible)
  AVATAR_STORAGE: z.enum(["local", "s3"]).default("local"),
  AVATAR_UPLOAD_DIR: z.string().default("apps/api/public/uploads"),
  AVATAR_MAX_FILE_SIZE_MB: z.string().default("5"),
  AVATAR_MAX_DIMENSIONS: z.string().default("2048x2048"),

  // Allowed Avatar File Types (comma-separated)
  AVATAR_ALLOWED_TYPES: z.string().default("image/jpeg,image/png,image/webp"),

  // Avatar Data Store
  AVATAR_DATA_STORE: z.string().default("apps/api/data/avatars.json"),

  // Rate Limiting for Avatar Operations
  RATE_LIMIT_AVATAR_WINDOW_MS: z.string().default("15"), // minutes
  RATE_LIMIT_AVATAR_MAX: z.string().default("20"), // uploads per window

  // S3-compatible (Cloudflare R2 / AWS S3 / DO Spaces)
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().optional(),

  // CORS & Security
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001"),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // AI Providers
  AI_PROVIDER: z.enum(["stub", "openai", "anthropic"]).default("stub"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-sonnet-latest"),

  // Stripe (optional)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().optional(),
  STRIPE_CANCEL_URL: z.string().optional(),
});

// Parse and validate environment
const parsedEnv = envSchema.parse(process.env);

export const env = {
  // Core
  nodeEnv: parsedEnv.NODE_ENV,
  port: parseInt(parsedEnv.PORT, 10),
  apiPort: parseInt(parsedEnv.API_PORT, 10),

  // Database
  databaseUrl: parsedEnv.DATABASE_URL,
  persistenceMode: parsedEnv.PERSISTENCE_MODE,

  // JWT & Auth
  jwtSecret: parsedEnv.JWT_SECRET,
  jwtExpiry: parsedEnv.JWT_EXPIRY,

  // Avatar Storage
  avatarStorage: parsedEnv.AVATAR_STORAGE,
  avatarUploadDir: parsedEnv.AVATAR_UPLOAD_DIR,
  avatarMaxFileSizeMB: parseInt(parsedEnv.AVATAR_MAX_FILE_SIZE_MB, 10),
  avatarMaxDimensions: parsedEnv.AVATAR_MAX_DIMENSIONS,

  // Allowed Avatar File Types
  avatarAllowedTypes: parsedEnv.AVATAR_ALLOWED_TYPES.split(","),

  // Avatar Data Store
  avatarDataStore: parsedEnv.AVATAR_DATA_STORE,

  // Rate Limiting
  rateLimitAvatarWindowMs: parseInt(parsedEnv.RATE_LIMIT_AVATAR_WINDOW_MS, 10) * 60 * 1000,
  rateLimitAvatarMax: parseInt(parsedEnv.RATE_LIMIT_AVATAR_MAX, 10),

  // S3-compatible
  s3Bucket: parsedEnv.S3_BUCKET,
  s3Region: parsedEnv.S3_REGION,
  s3Endpoint: parsedEnv.S3_ENDPOINT,
  s3AccessKeyId: parsedEnv.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: parsedEnv.S3_SECRET_ACCESS_KEY,
  s3PublicBaseUrl: parsedEnv.S3_PUBLIC_BASE_URL,

  // CORS & Security
  corsOrigins: parsedEnv.CORS_ORIGINS.split(","),

  // Logging
  logLevel: parsedEnv.LOG_LEVEL,

  // AI Providers
  aiProvider: parsedEnv.AI_PROVIDER,
  openaiApiKey: parsedEnv.OPENAI_API_KEY,
  openaiModel: parsedEnv.OPENAI_MODEL,
  anthropicApiKey: parsedEnv.ANTHROPIC_API_KEY,
  anthropicModel: parsedEnv.ANTHROPIC_MODEL,
};

export default env;
