type EnvRecord = Record<string, string | undefined>;

const allowedNodeEnvs = new Set(['development', 'test', 'production']);

function parsePort(value: string | undefined, fallback: number): string {
  const port = Number(value ?? fallback);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return String(port);
}

function parseBoolean(value: string | undefined, fallback: boolean): string {
  if (value === undefined || value === '') {
    return String(fallback);
  }

  if (value === 'true' || value === 'false') {
    return value;
  }

  throw new Error(`Invalid boolean value: ${value}`);
}

export function validateEnv(config: EnvRecord): EnvRecord {
  const normalized: EnvRecord = {
    ...config,
    NODE_ENV: config.NODE_ENV && allowedNodeEnvs.has(config.NODE_ENV)
      ? config.NODE_ENV
      : 'development',
    PORT: parsePort(config.PORT, 3001),
    API_RATE_LIMIT_ENABLED: parseBoolean(config.API_RATE_LIMIT_ENABLED, true),
  };

  if (normalized.DATABASE_URL && !normalized.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string');
  }

  if ((normalized.REDIS_HOST && !normalized.REDIS_PORT) || (!normalized.REDIS_HOST && normalized.REDIS_PORT)) {
    throw new Error('REDIS_HOST and REDIS_PORT must be provided together');
  }

  return normalized;
}
