import {
  EnvGatedMobileOperationsProvider,
  type DriverStatusUpdateRequest,
  type DriverStatusUpdateResult,
} from './mobileOperationsProvider';

export class MockMobileOperationsProvider extends EnvGatedMobileOperationsProvider {
  providerName = 'mock-mobile-operations' as const;

  constructor() {
    super([]);
  }

  override isConfigured(): boolean {
    return true;
  }

  async updateDriverStatus(request: DriverStatusUpdateRequest): Promise<DriverStatusUpdateResult> {
    return {
      provider: this.providerName,
      status: 'updated',
      driverId: request.driverId,
      shipmentId: request.shipmentId,
      message: 'Mock mobile operation recorded for local and CI testing.',
    };
  }
}

export const mockMobileOperationsProvider = new MockMobileOperationsProvider();
