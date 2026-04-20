import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LoadBoardAggregatorService } from './load-board-aggregator.service';
import { LoadsController } from './loads.controller';
import { RedisModule } from '../redis/redis.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';

@Module({
  imports: [HttpModule, RedisModule, RateLimitModule],
  providers: [LoadBoardAggregatorService],
  controllers: [LoadsController],
  exports: [LoadBoardAggregatorService],
})
export class LoadsModule {}
