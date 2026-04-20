import { Module } from '@nestjs/common';
import { RateConService } from './ratecon.service';
import { RateConController } from './ratecon.controller';

@Module({
  providers: [RateConService],
  controllers: [RateConController],
  exports: [RateConService],
})
export class RateConModule {}
