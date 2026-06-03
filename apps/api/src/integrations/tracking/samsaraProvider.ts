import {
  EnvGatedTrackingProvider,
  trackingNow,
  type TrackingEvent,
  type TrackingLookupRequest,
} from './trackingProvider';

export class SamsaraProvider extends EnvGatedTrackingProvider {
  providerName = 'samsara' as const;

  constructor() {
    super(['SAMSARA_API_TOKEN']);
  }

  async getLatestEvent(_request: TrackingLookupRequest): Promise<TrackingEvent> {
    if (!this.isConfigured()) {
      return {
        provider: this.providerName,
        status: 'unknown',
        occurredAt: trackingNow(),
        source: 'provider',
        message: 'Samsara tracking skipped because SAMSARA_API_TOKEN is not configured.',
      };
    }

    throw new Error('Samsara tracking requires approved endpoint mapping before live calls are enabled.');
  }
}

export const samsaraProvider = new SamsaraProvider();
