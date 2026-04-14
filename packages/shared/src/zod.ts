import { z } from "zod";

export const zTenantId = z.string().min(3);

export const zCreateShipment = z.object({
  tenantId: zTenantId,
  origin: z.string().min(2),
  destination: z.string().min(2),
  reference: z.string().optional(),
  driverId: z.string().optional(),
});

export const zCreateLoad = z.object({
  tenantId: zTenantId,
  originCity: z.string().min(2),
  originState: z.string().min(2),
  destCity: z.string().min(2),
  destState: z.string().min(2),
  distanceMi: z.number().int().positive(),
  weightLb: z.number().int().positive(),
  rateCents: z.number().int().nonnegative(),
});

export const zAICommand = z.object({
  tenantId: zTenantId,
  input: z.string().min(1),
  context: z.record(z.string(), z.any()).optional(),
});

/** Base environment schema. Fields are optional to support all environments (dev/test/prod).
 *  Use at call-site: `EnvSchema.parse(process.env)` — add stricter validation per-app as needed.
 */
export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export type EnvSchemaConfig = z.infer<typeof EnvSchema>;
