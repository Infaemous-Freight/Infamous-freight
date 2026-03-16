/**
 * env.ts — Validated environment configuration
 *
 * Single source of truth for all runtime env vars.
 * Import this instead of reading process.env directly.
 *
 * Fails fast at startup if required vars are missing in production.
 */
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),
  CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  STRIPE_SECRET_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const formatted = result.error.format();
  console.error("❌ Invalid environment configuration:\n", JSON.stringify(formatted, null, 2));
  process.exit(1);
}

export const env = result.data;
export type Env = typeof env;
