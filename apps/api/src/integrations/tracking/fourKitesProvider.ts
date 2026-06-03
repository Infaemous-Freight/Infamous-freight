import {
  EnvGatedTrackingProvider,
  trackingNow,
  type TrackingEvent,
  type TrackingLookupRequest,
} from './trackingProvider';

export class FourKitesProvider extends EnvGatedTrackingProvider {
  providerName = 'fourkites' as const;

  constructor() {
    super(['FOURKITES_API_KEY']);
  }

  async getLatestEvent(_request: TrackingLookupRequest): Promise<TrackingEvent> {
    if (!this.isConfigured()) {
      return {
        provider: this.providerName,
        status: 'unknown',
        occurredAt: trackingNow(),
        source: 'provider',
        message: 'FourKites tracking skipped because FOURKITES_API_KEY is not configured.',
      };
    }

    throw new Error('FourKites tracking requires approved endpoint mapping before live calls are enabled.');
  }
}

export const fourKitesProvider = new FourKitesProvider();
