import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BrokerCreditService, BrokerRating } from './broker-credit.service';

@Controller('broker-credit')
export class BrokerCreditController {
  constructor(private readonly service: BrokerCreditService) {}

  @Get(':mcNumber')
  async getProfile(@Param('mcNumber') mcNumber: string) {
    return this.service.getBrokerCredit(mcNumber);
  }

  @Get(':mcNumber/ratings')
  async getRatings(@Param('mcNumber') mcNumber: string) {
    return this.service.getBrokerRatings(mcNumber);
  }

  @Post(':mcNumber/rate')
  async rateBroker(@Param('mcNumber') mcNumber: string, @Body() rating: Omit<BrokerRating, 'brokerMc' | 'createdAt'>) {
    await this.service.rateBroker({ ...rating, brokerMc: mcNumber, createdAt: new Date() });
    return { success: true };
  }

  @Get(':mcNumber/safety-check')
  async safetyCheck(@Param('mcNumber') mcNumber: string, @Body('rate') rate: number) {
    return this.service.checkLoadSafety(mcNumber, rate);
  }
}
