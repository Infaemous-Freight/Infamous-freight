import "dotenv/config";

import { z } from "zod";

const durationSchema = z.string().trim().min(2);
const pemSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => value.replace(/\\n/g, "\n"));
const booleanStringSchema = z.enum(["true", "false"]).transform((value) => value === "true");

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_PORT: z.coerce.number().int().positive().default(4000),
    PORT: z.coerce.number().int().positive().optional(),
    API_PORT: z.coerce.number().int().positive().optional(),
    DATABASE_URL: z.string().trim().min(1),
    JWT_ALGORITHM: z.enum(["RS256", "HS256"]).default("HS256"),
    JWT_PRIVATE_KEY: pemSchema.optional(),
    JWT_PUBLIC_KEY: pemSchema.optional(),
    JWT_SECRET: z.string().trim().min(32).optional(),
    JWT_ACCESS_EXPIRES_IN: durationSchema.default("15m"),
    JWT_REFRESH_EXPIRES_IN: durationSchema.default("7d"),
    JWT_ISSUER: z.string().trim().min(1).default("infamous-freight"),
    JWT_AUDIENCE: z.string().trim().min(1).default("infamous-freight-api"),
    AUTH_COOKIE_ENABLED: z.string().default("true").pipe(booleanStringSchema),
    AUTH_COOKIE_NAME: z.string().trim().min(1).default("if_refresh_token"),
    AUTH_COOKIE_DOMAIN: z.string().trim().optional().default(""),
    AUTH_COOKIE_SECURE: z.string().default("false").pipe(booleanStringSchema),
    AUTH_COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("lax"),
    AUTH_COOKIE_PATH: z.string().trim().min(1).default("/"),
    COOKIE_SECRET: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().trim().min(32).optional(),
    ),
    PASSWORD_PEPPER: z.string().default(""),
    CORS_ORIGIN: z.string().trim().min(1).default("http://localhost:3000"),
    RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),
    ARGON2_MEMORY_COST: z.coerce.number().int().positive().default(19456),
    ARGON2_TIME_COST: z.coerce.number().int().positive().default(2),
    ARGON2_PARALLELISM: z.coerce.number().int().positive().default(1),
    REDIS_URL: z.string().optional(),
    PERSISTENCE_MODE: z.enum(["auto", "json"]).optional().default("auto"),
    SENTRY_DSN: z.string().optional(),
    WEBHOOK_SECRET: z.string().optional(),
    AVATAR_STORAGE: z.enum(["local", "s3"]).optional().default("local"),
    AVATAR_UPLOAD_DIR: z.string().optional().default("apps/api/public/uploads"),
    AVATAR_MAX_FILE_SIZE_MB: z.coerce.number().int().positive().optional().default(5),
    AVATAR_MAX_DIMENSIONS: z.string().optional().default("2048x2048"),
    AVATAR_ALLOWED_TYPES: z.string().optional().default("image/jpeg,image/png,image/webp"),
    AVATAR_DATA_STORE: z.string().optional().default("apps/api/data/avatars.json"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional().default("info"),
    AI_PROVIDER: z.preprocess(
      (value) => {
        if (typeof value !== "string") return undefined;
        const normalized = value.trim().toLowerCase();
        return ["stub", "openai", "anthropic"].includes(normalized) ? normalized : undefined;
      },
      z.enum(["stub", "openai", "anthropic"]).optional().default("stub"),
    ),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().optional().default("gpt-4o-mini"),
    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_MODEL: z.string().optional().default("claude-3-5-sonnet-latest"),

    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_PUBLIC_BASE_URL: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_STARTER: z.string().optional(),
    STRIPE_PRICE_PRO: z.string().optional(),
    STRIPE_PRICE_ENTERPRISE: z.string().optional(),
    STRIPE_SUCCESS_URL: z.string().optional(),
    STRIPE_CANCEL_URL: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.JWT_ALGORITHM === "RS256") {
      if (!values.JWT_PRIVATE_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_PRIVATE_KEY"],
          message: "JWT_PRIVATE_KEY is required when JWT_ALGORITHM=RS256",
        });
      }

      if (!values.JWT_PUBLIC_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_PUBLIC_KEY"],
          message: "JWT_PUBLIC_KEY is required when JWT_ALGORITHM=RS256",
        });
      }
    }

    if (values.JWT_ALGORITHM === "HS256" && !values.JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET is required when JWT_ALGORITHM=HS256",
      });
    }

    if (values.AUTH_COOKIE_SAME_SITE === "none" && !values.AUTH_COOKIE_SECURE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["AUTH_COOKIE_SECURE"],
        message: "AUTH_COOKIE_SECURE must be true when AUTH_COOKIE_SAME_SITE=none",
      });
    }
  });

const parsed = envSchema.parse(process.env);

export const env = {
  nodeEnv: parsed.NODE_ENV,
  appPort: parsed.PORT ?? parsed.API_PORT ?? parsed.APP_PORT,
  databaseUrl: parsed.DATABASE_URL,
  jwtAlgorithm: parsed.JWT_ALGORITHM,
  jwtPrivateKey: parsed.JWT_PRIVATE_KEY,
  jwtPublicKey: parsed.JWT_PUBLIC_KEY,
  jwtSecret: parsed.JWT_SECRET,
  jwtAccessExpiresIn: parsed.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: parsed.JWT_REFRESH_EXPIRES_IN,
  jwtIssuer: parsed.JWT_ISSUER,
  jwtAudience: parsed.JWT_AUDIENCE,
  corsOrigin: parsed.CORS_ORIGIN,
  authCookieEnabled: parsed.AUTH_COOKIE_ENABLED,
  authCookieName: parsed.AUTH_COOKIE_NAME,
  authCookieDomain: parsed.AUTH_COOKIE_DOMAIN || undefined,
  authCookieSecure: parsed.AUTH_COOKIE_SECURE,
  authCookieSameSite: parsed.AUTH_COOKIE_SAME_SITE,
  authCookiePath: parsed.AUTH_COOKIE_PATH,
  cookieSecret: parsed.COOKIE_SECRET,
  passwordPepper: parsed.PASSWORD_PEPPER,
  rateLimitAuthMax: parsed.RATE_LIMIT_AUTH_MAX,
  argon2: {
    memoryCost: parsed.ARGON2_MEMORY_COST,
    timeCost: parsed.ARGON2_TIME_COST,
    parallelism: parsed.ARGON2_PARALLELISM,
  },
  redisUrl: parsed.REDIS_URL,
  persistenceMode: parsed.PERSISTENCE_MODE,
  sentryDsn: parsed.SENTRY_DSN,
  webhookSecret: parsed.WEBHOOK_SECRET,
  s3Bucket: parsed.S3_BUCKET,
  s3Region: parsed.S3_REGION,
  s3Endpoint: parsed.S3_ENDPOINT,
  s3AccessKeyId: parsed.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: parsed.S3_SECRET_ACCESS_KEY,
  s3PublicBaseUrl: parsed.S3_PUBLIC_BASE_URL,
  avatarStorage: parsed.AVATAR_STORAGE,
  avatarUploadDir: parsed.AVATAR_UPLOAD_DIR,
  avatarMaxFileSizeMB: parsed.AVATAR_MAX_FILE_SIZE_MB,
  avatarMaxDimensions: parsed.AVATAR_MAX_DIMENSIONS,
  avatarAllowedTypes: parsed.AVATAR_ALLOWED_TYPES.split(","),
  avatarDataStore: parsed.AVATAR_DATA_STORE,
  logLevel: parsed.LOG_LEVEL,
  aiProvider: parsed.AI_PROVIDER,
  openaiApiKey: parsed.OPENAI_API_KEY,
  openaiModel: parsed.OPENAI_MODEL,
  anthropicApiKey: parsed.ANTHROPIC_API_KEY,
  anthropicModel: parsed.ANTHROPIC_MODEL,
  STRIPE_SECRET_KEY: parsed.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: parsed.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_STARTER: parsed.STRIPE_PRICE_STARTER,
  STRIPE_PRICE_PRO: parsed.STRIPE_PRICE_PRO,
  STRIPE_PRICE_ENTERPRISE: parsed.STRIPE_PRICE_ENTERPRISE,
  STRIPE_SUCCESS_URL: parsed.STRIPE_SUCCESS_URL,
  STRIPE_CANCEL_URL: parsed.STRIPE_CANCEL_URL,
} as const;
