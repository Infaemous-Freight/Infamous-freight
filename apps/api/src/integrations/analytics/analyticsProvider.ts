import {
  configuredIntegration,
  disabledIntegration,
  type IntegrationHealthCheck,
  type IntegrationProvider,
} from '../types';

export type AnalyticsProviderName = 'posthog' | 'mock-analytics';

export interface AnalyticsEvent {
  name: string;
  distinctId?: string;
  properties?: Record<string, string | number | boolean | null>;
  occurredAt?: string;
}

export interface AnalyticsEventResult {
  provider: AnalyticsProviderName;
  status: 'skipped' | 'tracked' | 'failed';
  eventId?: string;
  message?: string;
}

export interface AnalyticsProvider extends IntegrationProvider {
  providerName: AnalyticsProviderName;
  trackEvent(event: AnalyticsEvent): Promise<AnalyticsEventResult>;
}

export abstract class EnvGatedAnalyticsProvider implements AnalyticsProvider {
  abstract providerName: AnalyticsProviderName;
  readonly category = 'analytics' as const;

  protected constructor(private readonly requiredEnvKeys: string[]) {}

  isConfigured(): boolean {
    return this.requiredEnvKeys.every((key) => Boolean(process.env[key]?.trim()));
  }

  async healthCheck(): Promise<IntegrationHealthCheck> {
    if (!this.isConfigured()) {
      return disabledIntegration(
        this.providerName,
        this.category,
        `${this.providerName} analytics is disabled because one or more required environment variables are missing.`,
      );
    }

    return configuredIntegration(
      this.providerName,
      this.category,
      `${this.providerName} analytics configuration is present. Run safe event tracking tests before relying on production metrics.`,
    );
  }

  abstract trackEvent(event: AnalyticsEvent): Promise<AnalyticsEventResult>;
}
