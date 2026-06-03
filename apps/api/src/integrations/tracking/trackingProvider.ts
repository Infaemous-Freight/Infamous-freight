import {
  configuredIntegration,
  disabledIntegration,
  type IntegrationHealthCheck,
  type IntegrationProvider,
} from '../types';

export type TrackingProviderName = 'project44' | 'fourkites' | 'samsara' | 'motive' | 'mock-tracking';

export type ShipmentTrackingStatus =
  | 'created'
  | 'assigned'
  | 'in_transit'
  | 'delayed'
  | 'arrived'
  | 'delivered'
  | 'exception'
  | 'unknown';

export interface TrackingLookupRequest {
  shipmentId?: string;
  trackingNumber?: string;
  providerShipmentId?: string;
}

export interface TrackingLocation {
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
}

export interface TrackingEvent {
  provider: TrackingProviderName;
  status: ShipmentTrackingStatus;
  occurredAt: string;
  location?: TrackingLocation;
  eta?: string;
  message?: string;
  source: 'mock' | 'provider';
}

export interface TrackingProvider extends IntegrationProvider {
  providerName: TrackingProviderName;
  getLatestEvent(request: TrackingLookupRequest): Promise<TrackingEvent>;
}

export abstract class EnvGatedTrackingProvider implements TrackingProvider {
  abstract providerName: TrackingProviderName;
  readonly category = 'tracking' as const;

  protected constructor(private readonly requiredEnvKeys: string[]) {}

  isConfigured(): boolean {
    return this.requiredEnvKeys.every((key) => Boolean(process.env[key]?.trim()));
  }

  async healthCheck(): Promise<IntegrationHealthCheck> {
    if (!this.isConfigured()) {
      return disabledIntegration(
        this.providerName,
        this.category,
        `${this.providerName} tracking is disabled because one or more required environment variables are missing.`,
      );
    }

    return configuredIntegration(
      this.providerName,
      this.category,
      `${this.providerName} tracking configuration is present. Run a provider smoke test before enabling production traffic.`,
    );
  }

  abstract getLatestEvent(request: TrackingLookupRequest): Promise<TrackingEvent>;
}

export function trackingNow(): string {
  return new Date().toISOString();
}
