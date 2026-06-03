import {
  EnvGatedLoadBoardProvider,
  formatLane,
  type LoadBoardPostRequest,
  type LoadBoardPostResult,
  type LoadBoardRateRequest,
  type LoadBoardRateResult,
} from './loadBoardProvider';

export class MockLoadBoardProvider extends EnvGatedLoadBoardProvider {
  providerName = 'mock-load-board' as const;

  constructor() {
    super([]);
  }

  override isConfigured(): boolean {
    return true;
  }

  async getRateEstimate(request: LoadBoardRateRequest): Promise<LoadBoardRateResult> {
    return {
      provider: this.providerName,
      lane: formatLane(request),
      equipmentType: request.equipmentType,
      currency: 'USD',
      lowRate: 1800,
      averageRate: 2200,
      highRate: 2600,
      source: 'mock',
    };
  }

  async postLoad(request: LoadBoardPostRequest): Promise<LoadBoardPostResult> {
    return {
      provider: this.providerName,
      externalPostId: `mock-${request.loadId}`,
      status: 'posted',
      message: 'Mock load board accepted the load for testing.',
    };
  }
}

export const mockLoadBoardProvider = new MockLoadBoardProvider();
