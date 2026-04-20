import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { LoadBoardAggregatorService, LoadSearchFilters, UnifiedLoad } from './load-board-aggregator.service';
import { SkipRateLimit } from '../rate-limit/skip-rate-limit.decorator';

@Controller('loads')
export class LoadsController {
  constructor(private readonly loadService: LoadBoardAggregatorService) {}

  @Get('search')
  @SkipRateLimit()
  async search(@Query() query: LoadSearchFilters): Promise<UnifiedLoad[]> {
    return this.loadService.searchAllBoards(query);
  }

  @Post('alerts/subscribe')
  async subscribeToAlerts(
    @Body() body: { carrierId: string; lanes: { origin: string; destination: string }[] },
  ): Promise<{ success: boolean }> {
    await this.loadService.subscribeToLaneAlerts(body.carrierId, body.lanes);
    return { success: true };
  }

  @Get('alerts/check')
  @SkipRateLimit()
  async checkAlerts(): Promise<Array<{ carrierId: string; loads: UnifiedLoad[] }>> {
    return this.loadService.checkNewLoadsForAlerts();
  }
}
