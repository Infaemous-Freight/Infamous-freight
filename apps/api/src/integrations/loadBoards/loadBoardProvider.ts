import {
  configuredIntegration,
  disabledIntegration,
  type IntegrationHealthCheck,
  type IntegrationProvider,
} from '../types';

export type LoadBoardProviderName = 'dat' | 'truckstop' | 'mock-load-board';

export interface LoadBoardRateRequest {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  equipmentType: string;
  pickupDate?: string;
}

export interface LoadBoardRateResult {
  provider: LoadBoardProviderName;
  lane: string;
  equipmentType: string;
  currency: 'USD';
  lowRate?: number;
  averageRate?: number;
  highRate?: number;
  source: 'mock' | 'provider';
}

export interface LoadBoardPostRequest extends LoadBoardRateRequest {
  loadId: string;
  weightPounds?: number;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export interface LoadBoardPostResult {
  provider: LoadBoardProviderName;
  externalPostId?: string;
  status: 'skipped' | 'posted' | 'failed';
  message?: string;
}

export interface LoadBoardProvider extends IntegrationProvider {
  providerName: LoadBoardProviderName;
  getRateEstimate(request: LoadBoardRateRequest): Promise<LoadBoardRateResult>;
  postLoad(request: LoadBoardPostRequest): Promise<LoadBoardPostResult>;
}

export abstract class EnvGatedLoadBoardProvider implements LoadBoardProvider {
  abstract providerName: LoadBoardProviderName;
  readonly category = 'loadBoard' as const;

  protected constructor(private readonly requiredEnvKeys: string[]) {}

  isConfigured(): boolean {
    return this.requiredEnvKeys.every((key) => Boolean(process.env[key]?.trim()));
  }

  async healthCheck(): Promise<IntegrationHealthCheck> {
    if (!this.isConfigured()) {
      return disabledIntegration(
        this.providerName,
        this.category,
        `${this.providerName} is disabled because one or more required environment variables are missing.`,
      );
    }

    return configuredIntegration(
      this.providerName,
      this.category,
      `${this.providerName} configuration is present. Run a provider smoke test before enabling production traffic.`,
    );
  }

  abstract getRateEstimate(request: LoadBoardRateRequest): Promise<LoadBoardRateResult>;
  abstract postLoad(request: LoadBoardPostRequest): Promise<LoadBoardPostResult>;
}

export function formatLane(request: LoadBoardRateRequest): string {
  return `${request.originCity}, ${request.originState} -> ${request.destinationCity}, ${request.destinationState}`;
}
