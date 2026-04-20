import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { RateAnalyticsService } from './rate-analytics.service';

@Controller('rate-analytics')
export class RateAnalyticsController {
  constructor(private readonly service: RateAnalyticsService) {}

  @Post('record')
  async recordRate(@Body() body: {
    date: string;
    ratePerMile: number;
    distance: number;
    equipmentType: string;
    source: 'booked' | 'posted' | 'negotiated';
  }) {
    return this.service.recordRate({
      ...body,
      date: new Date(body.date),
    });
  }

  @Get('trend')
  async getTrend(
    @Query('origin') originState: string,
    @Query('destination') destState: string,
    @Query('equipment') equipmentType: string,
    @Query('days') days?: string,
  ) {
    return this.service.getLaneTrend(originState, destState, equipmentType, days ? parseInt(days) : 90);
  }

  @Post('compare')
  async compareRate(@Body() body: {
    originState: string;
    destState: string;
    equipmentType: string;
    brokerOffer: number;
  }) {
    return this.service.compareRate(body.originState, body.destState, body.equipmentType, body.brokerOffer);
  }

  @Get('rate-of-the-day')
  async rateOfTheDay(@Query('limit') limit?: string) {
    return this.service.getRateOfTheDay(limit ? parseInt(limit) : 5);
  }

  @Get('weekly-report/:carrierId')
  async weeklyReport(@Param('carrierId') carrierId: string) {
    return this.service.generateWeeklyReport(carrierId);
  }
}
