import {
  EnvGatedObservabilityProvider,
  type ObservabilityEvent,
  type ObservabilityEventResult,
} from './observabilityProvider';

export class MockObservabilityProvider extends EnvGatedObservabilityProvider {
  providerName = 'mock-observability' as const;

  constructor() {
    super([]);
  }

  override isConfigured(): boolean {
    return true;
  }

  async captureEvent(event: ObservabilityEvent): Promise<ObservabilityEventResult> {
    return {
      provider: this.providerName,
      status: 'captured',
      eventId: `mock-${event.level}-${Date.now()}`,
      message: 'Mock observability provider captured the event for local and CI testing.',
    };
  }
}

export const mockObservabilityProvider = new MockObservabilityProvider();
