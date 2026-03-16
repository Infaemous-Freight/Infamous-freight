import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV:     z.enum(['development', 'test', 'production']).default('development'),
  PORT:         z.coerce.number().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL:    z.string().url().default('redis://localhost:6379'),
  JWT_SECRET:   z.string().min(32),
  CORS_ORIGIN:  z.string().optional(),
  LOG_LEVEL:    z.enum(['trace','debug','info','warn','error','fatal']).default('info'),
});

const _parsed = EnvSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('❌ Invalid environment variables:', _parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _parsed.data;
