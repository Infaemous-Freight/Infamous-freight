export type IntegrationHealthStatus = 'disabled' | 'configured' | 'degraded' | 'healthy';

export type IntegrationCategory =
  | 'auth'
  | 'billing'
  | 'loadBoard'
  | 'tracking'
  | 'accounting'
  | 'messaging'
  | 'observability'
  | 'analytics'
  | 'mobile';

export interface IntegrationHealthCheck {
  provider: string;
  category: IntegrationCategory;
  status: IntegrationHealthStatus;
  checkedAt: string;
  message?: string;
}

export interface IntegrationProvider {
  providerName: string;
  category: IntegrationCategory;
  isConfigured(): boolean;
  healthCheck(): Promise<IntegrationHealthCheck>;
}

export function integrationCheckedAt(): string {
  return new Date().toISOString();
}

export function disabledIntegration(
  provider: string,
  category: IntegrationCategory,
  message = 'Integration is disabled because required configuration is missing.',
): IntegrationHealthCheck {
  return {
    provider,
    category,
    status: 'disabled',
    checkedAt: integrationCheckedAt(),
    message,
  };
}

export function configuredIntegration(
  provider: string,
  category: IntegrationCategory,
  message = 'Integration configuration is present. Live provider verification still requires a production smoke test.',
): IntegrationHealthCheck {
  return {
    provider,
    category,
    status: 'configured',
    checkedAt: integrationCheckedAt(),
    message,
  };
}
