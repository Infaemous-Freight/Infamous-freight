import {
  EnvGatedObservabilityProvider,
  type ObservabilityEvent,
  type ObservabilityEventResult,
} from './observabilityProvider';

export class SentryProvider extends EnvGatedObservabilityProvider {
  providerName = 'sentry' as const;

  constructor() {
    super(['SENTRY_DSN']);
  }

  async captureEvent(event: ObservabilityEvent): Promise<ObservabilityEventResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.providerName,
        status: 'skipped',
        message: 'Sentry event skipped because required configuration is missing.',
      };
    }

    throw new Error(`Sentry capture is not wired yet for event: ${event.message}`);
  }
}

export const sentryProvider = new SentryProvider();
