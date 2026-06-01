export function normalizeApiBaseUrl(configuredBase?: string): string {
  const trimmed = configuredBase?.trim().replace(/\/+$/, '') ?? '';

  if (!trimmed) return '/api';
  if (trimmed.endsWith('/api')) return trimmed;

  return `${trimmed}/api`;
}

export function getConfiguredApiBaseUrl(): string {
  return normalizeApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL,
  );
}
