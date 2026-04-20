import { Module } from '@nestjs/common';
import { BrokerCreditService } from './broker-credit.service';
import { BrokerCreditController } from './broker-credit.controller';

@Module({
  providers: [BrokerCreditService],
  controllers: [BrokerCreditController],
  exports: [BrokerCreditService],
})
export class BrokerCreditModule {}
