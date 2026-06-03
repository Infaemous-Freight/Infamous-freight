import {
  EnvGatedLoadBoardProvider,
  formatLane,
  type LoadBoardPostRequest,
  type LoadBoardPostResult,
  type LoadBoardRateRequest,
  type LoadBoardRateResult,
} from './loadBoardProvider';

export class DatProvider extends EnvGatedLoadBoardProvider {
  providerName = 'dat' as const;

  constructor() {
    super(['DAT_API_KEY']);
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

    throw new Error('DAT rate estimate integration requires approved DAT API endpoint mapping before live calls are enabled.');
  }

  async postLoad(_request: LoadBoardPostRequest): Promise<LoadBoardPostResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.providerName,
        status: 'skipped',
        message: 'DAT load posting skipped because DAT_API_KEY is not configured.',
      };
    }

    throw new Error('DAT load posting integration requires approved DAT API endpoint mapping before live calls are enabled.');
  }
}

export const datProvider = new DatProvider();
