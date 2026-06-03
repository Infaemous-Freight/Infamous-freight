import {
  EnvGatedTrackingProvider,
  trackingNow,
  type TrackingEvent,
  type TrackingLookupRequest,
} from './trackingProvider';

export class Project44Provider extends EnvGatedTrackingProvider {
  providerName = 'project44' as const;

  constructor() {
    super(['PROJECT44_API_KEY']);
  }

  async getLatestEvent(_request: TrackingLookupRequest): Promise<TrackingEvent> {
    if (!this.isConfigured()) {
      return {
        provider: this.providerName,
        status: 'unknown',
        occurredAt: trackingNow(),
        source: 'provider',
        message: 'project44 tracking skipped because PROJECT44_API_KEY is not configured.',
      };
    }

    throw new Error('project44 tracking requires approved endpoint mapping before live calls are enabled.');
  }
}

export const project44Provider = new Project44Provider();
