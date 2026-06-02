const requiredEnvVars = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CORS_ORIGINS',
] as const;

const requiredAuthEnvVars = ['SUPABASE_JWT_SECRET', 'JWT_SECRET'] as const;

function hasValue(key: string): boolean {
  return Boolean(process.env[key]?.trim());
}

export function validateEnv(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing: string[] = requiredEnvVars.filter((key) => !hasValue(key));
  const hasAuthSecret = requiredAuthEnvVars.some((key) => hasValue(key));

  if (!hasAuthSecret) {
    missing.push('SUPABASE_JWT_SECRET or JWT_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
