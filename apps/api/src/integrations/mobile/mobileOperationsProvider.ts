import {
  configuredIntegration,
  disabledIntegration,
  type IntegrationHealthCheck,
  type IntegrationProvider,
} from '../types';

export type MobileOperationsProviderName = 'mobile-operations' | 'mock-mobile-operations';

export type DriverStatus = 'available' | 'assigned' | 'in_transit' | 'delayed' | 'delivered' | 'off_duty';

export interface DriverStatusUpdateRequest {
  driverId: string;
  shipmentId?: string;
  status: DriverStatus;
  occurredAt?: string;
  note?: string;
}

export interface DriverStatusUpdateResult {
  provider: MobileOperationsProviderName;
  status: 'skipped' | 'updated' | 'failed';
  driverId: string;
  shipmentId?: string;
  message?: string;
}

export interface MobileOperationsProvider extends IntegrationProvider {
  providerName: MobileOperationsProviderName;
  updateDriverStatus(request: DriverStatusUpdateRequest): Promise<DriverStatusUpdateResult>;
}

export abstract class EnvGatedMobileOperationsProvider implements MobileOperationsProvider {
  abstract providerName: MobileOperationsProviderName;
  readonly category = 'mobile' as const;

  protected constructor(private readonly requiredEnvKeys: string[]) {}

  isConfigured(): boolean {
    return this.requiredEnvKeys.every((key) => Boolean(process.env[key]?.trim()));
  }

  async healthCheck(): Promise<IntegrationHealthCheck> {
    if (!this.isConfigured()) {
      return disabledIntegration(
        this.providerName,
        this.category,
        `${this.providerName} mobile operations are disabled because one or more required environment variables are missing.`,
      );
    }

    return configuredIntegration(
      this.providerName,
      this.category,
      `${this.providerName} mobile operations configuration is present. Run driver workflow tests before production use.`,
    );
  }

  abstract updateDriverStatus(request: DriverStatusUpdateRequest): Promise<DriverStatusUpdateResult>;
}
