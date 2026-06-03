import { getIntegrationProviders } from './providerRegistry';
import { type IntegrationHealthCheck, type IntegrationHealthStatus } from './types';

export interface IntegrationHealthSummary {
  status: IntegrationHealthStatus;
  checkedAt: string;
  total: number;
  healthy: number;
  configured: number;
  degraded: number;
  disabled: number;
  checks: IntegrationHealthCheck[];
}

function summarizeStatus(checks: IntegrationHealthCheck[]): IntegrationHealthStatus {
  if (checks.some((check) => check.status === 'degraded')) {
    return 'degraded';
  }

  if (checks.some((check) => check.status === 'healthy')) {
    return 'healthy';
  }

  if (checks.some((check) => check.status === 'configured')) {
    return 'configured';
  }

  return 'disabled';
}

export async function getIntegrationHealthSummary(): Promise<IntegrationHealthSummary> {
  const providers = getIntegrationProviders();
  const checks = await Promise.all(providers.map((provider) => provider.healthCheck()));

  return {
    status: summarizeStatus(checks),
    checkedAt: new Date().toISOString(),
    total: checks.length,
    healthy: checks.filter((check) => check.status === 'healthy').length,
    configured: checks.filter((check) => check.status === 'configured').length,
    degraded: checks.filter((check) => check.status === 'degraded').length,
    disabled: checks.filter((check) => check.status === 'disabled').length,
    checks,
  };
}
