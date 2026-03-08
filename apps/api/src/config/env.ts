import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  JWT_PRIVATE_KEY: z.string().min(1),
  ACCESS_TOKEN_TTL_MIN: z.coerce.number().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(14),
  MAPBOX_ACCESS_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export const env = envSchema.parse(process.env);
