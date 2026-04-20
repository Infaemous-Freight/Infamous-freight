import { Module } from '@nestjs/common';
import { RateAnalyticsService } from './rate-analytics.service';
import { RateAnalyticsController } from './rate-analytics.controller';

@Module({
  providers: [RateAnalyticsService],
  controllers: [RateAnalyticsController],
  exports: [RateAnalyticsService],
})
export class RateAnalyticsModule {}
