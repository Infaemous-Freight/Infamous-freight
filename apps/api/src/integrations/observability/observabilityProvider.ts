import {
  configuredIntegration,
  disabledIntegration,
  type IntegrationHealthCheck,
  type IntegrationProvider,
} from '../types';

export type ObservabilityProviderName = 'sentry' | 'mock-observability';

export type ObservabilityEventLevel = 'info' | 'warning' | 'error';

export interface ObservabilityEvent {
  level: ObservabilityEventLevel;
  message: string;
  context?: Record<string, string | number | boolean | null>;
}

export interface ObservabilityEventResult {
  provider: ObservabilityProviderName;
  status: 'skipped' | 'captured' | 'failed';
  eventId?: string;
  message?: string;
}

export interface ObservabilityProvider extends IntegrationProvider {
  providerName: ObservabilityProviderName;
  captureEvent(event: ObservabilityEvent): Promise<ObservabilityEventResult>;
}

export abstract class EnvGatedObservabilityProvider implements ObservabilityProvider {
  abstract providerName: ObservabilityProviderName;
  readonly category = 'observability' as const;

  protected constructor(private readonly requiredEnvKeys: string[]) {}

  isConfigured(): boolean {
    return this.requiredEnvKeys.every((key) => Boolean(process.env[key]?.trim()));
  }

  async healthCheck(): Promise<IntegrationHealthCheck> {
    if (!this.isConfigured()) {
      return disabledIntegration(
        this.providerName,
        this.category,
        `${this.providerName} observability is disabled because one or more required environment variables are missing.`,
      );
    }

    return configuredIntegration(
      this.providerName,
      this.category,
      `${this.providerName} observability configuration is present. Run a safe test event before relying on production alerting.`,
    );
  }

  abstract captureEvent(event: ObservabilityEvent): Promise<ObservabilityEventResult>;
}
