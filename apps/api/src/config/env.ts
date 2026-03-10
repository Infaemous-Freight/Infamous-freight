import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url().optional(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  // legacy optional keys used in parts of the codebase
  API_PORT: z.coerce.number().int().positive().optional(),
  CORS_ORIGINS: z.string().optional(),
  AVATAR_STORAGE: z.enum(["local", "s3"]).optional(),
  AVATAR_UPLOAD_DIR: z.string().optional(),
  AVATAR_MAX_FILE_SIZE_MB: z.coerce.number().int().positive().optional(),
  AVATAR_ALLOWED_TYPES: z.string().optional(),
  AVATAR_DATA_STORE: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  // compatibility aliases
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  apiPort: parsed.API_PORT ?? parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  redisUrl: parsed.REDIS_URL,
  jwtSecret: parsed.JWT_SECRET,
  logLevel: parsed.LOG_LEVEL,
  corsOrigins: (parsed.CORS_ORIGINS ?? "http://localhost:3000").split(","),
  avatarStorage: parsed.AVATAR_STORAGE ?? "local",
  avatarUploadDir: parsed.AVATAR_UPLOAD_DIR ?? "apps/api/public/uploads",
  avatarMaxFileSizeMB: parsed.AVATAR_MAX_FILE_SIZE_MB ?? 5,
  avatarAllowedTypes: (parsed.AVATAR_ALLOWED_TYPES ?? "image/jpeg,image/png,image/webp").split(","),
  avatarDataStore: parsed.AVATAR_DATA_STORE ?? "apps/api/data/avatars.json",
  s3Bucket: parsed.S3_BUCKET,
  s3Region: parsed.S3_REGION,
  s3Endpoint: parsed.S3_ENDPOINT,
  s3AccessKeyId: parsed.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: parsed.S3_SECRET_ACCESS_KEY,
  s3PublicBaseUrl: parsed.S3_PUBLIC_BASE_URL,
};

export default env;
