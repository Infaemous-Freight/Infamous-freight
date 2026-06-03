import {
  EnvGatedTrackingProvider,
  trackingNow,
  type TrackingEvent,
  type TrackingLookupRequest,
} from './trackingProvider';

export class MockTrackingProvider extends EnvGatedTrackingProvider {
  providerName = 'mock-tracking' as const;

  constructor() {
    super([]);
  }

  override isConfigured(): boolean {
    return true;
  }

  async getLatestEvent(_request: TrackingLookupRequest): Promise<TrackingEvent> {
    return {
      provider: this.providerName,
      status: 'in_transit',
      occurredAt: trackingNow(),
      eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      location: {
        city: 'Tulsa',
        state: 'OK',
        country: 'US',
      },
      source: 'mock',
      message: 'Mock shipment is in transit for local and CI testing.',
    };
  }
}

export const mockTrackingProvider = new MockTrackingProvider();
