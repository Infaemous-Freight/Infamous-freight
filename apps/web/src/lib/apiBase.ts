export function normalizeApiBaseUrl(configuredBase?: string): string {
  let trimmed = configuredBase?.trim().replace(/\/+$/, '') ?? '';

  if (!trimmed) return '/api';
  while (trimmed.endsWith('/api/api')) {
    trimmed = trimmed.slice(0, -4);
  }
  if (trimmed.endsWith('/api')) return trimmed;

  return `${trimmed}/api`;
}

export function getConfiguredApiBaseUrl(): string {
  return normalizeApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL,
  );
}
