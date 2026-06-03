import {
  EnvGatedLoadBoardProvider,
  formatLane,
  type LoadBoardPostRequest,
  type LoadBoardPostResult,
  type LoadBoardRateRequest,
  type LoadBoardRateResult,
} from './loadBoardProvider';

export class TruckstopProvider extends EnvGatedLoadBoardProvider {
  providerName = 'truckstop' as const;

  constructor() {
    super(['TRUCKSTOP_API_KEY']);
  }

  async getRateEstimate(request: LoadBoardRateRequest): Promise<LoadBoardRateResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.providerName,
        lane: formatLane(request),
        equipmentType: request.equipmentType,
        currency: 'USD',
        source: 'provider',
      };
    }

    throw new Error('Truckstop rate integration requires approved endpoint mapping before live calls are enabled.');
  }

  async postLoad(_request: LoadBoardPostRequest): Promise<LoadBoardPostResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.providerName,
        status: 'skipped',
        message: 'Truckstop load posting skipped because TRUCKSTOP_API_KEY is not configured.',
      };
    }

    throw new Error('Truckstop load posting integration requires approved endpoint mapping before live calls are enabled.');
  }
}

export const truckstopProvider = new TruckstopProvider();
