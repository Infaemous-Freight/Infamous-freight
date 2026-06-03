import {
  EnvGatedAnalyticsProvider,
  type AnalyticsEvent,
  type AnalyticsEventResult,
} from './analyticsProvider';

export class MockAnalyticsProvider extends EnvGatedAnalyticsProvider {
  providerName = 'mock-analytics' as const;

  constructor() {
    super([]);
  }

  override isConfigured(): boolean {
    return true;
  }

  async trackEvent(event: AnalyticsEvent): Promise<AnalyticsEventResult> {
    return {
      provider: this.providerName,
      status: 'tracked',
      eventId: `mock-${event.name}-${Date.now()}`,
      message: 'Mock analytics provider tracked the event for local and CI testing.',
    };
  }
}

export const mockAnalyticsProvider = new MockAnalyticsProvider();
