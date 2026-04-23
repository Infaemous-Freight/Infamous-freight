import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from './config/env.validation';

// Core infrastructure
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';

// Feature modules
import { LoadsModule } from './loads/loads.module';
import { InvoiceModule } from './invoice/invoice.module';
import { ELDModule } from './eld/eld.module';
import { ChatModule } from './chat/chat.module';
import { PayrollModule } from './payroll/payroll.module';
import { FactoringModule } from './factoring/factoring.module';
import { CSAMonitorModule } from './compliance-csa/csa-monitor.module';
import { ComplianceExpiryModule } from './compliance-expiry/compliance-expiry.module';
import { AccountingModule } from './accounting/accounting.module';
import { RateAnalyticsModule } from './rate-analytics/rate-analytics.module';
import { BrokerCreditModule } from './broker-credit/broker-credit.module';
import { GeofencingModule } from './geofencing/geofencing.module';
import { IFTAModule } from './ifta/ifta.module';
import { RBACModule } from './rbac/rbac.module';
import { RateConModule } from './ratecon/ratecon.module';

// Controllers
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    PrismaModule,
    RedisModule,
    RateLimitModule,
    RBACModule,

    LoadsModule,
    InvoiceModule,
    ELDModule,
    ChatModule,
    PayrollModule,
    FactoringModule,
    CSAMonitorModule,
    ComplianceExpiryModule,
    AccountingModule,
    RateAnalyticsModule,
    BrokerCreditModule,
    GeofencingModule,
    IFTAModule,
    RateConModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
