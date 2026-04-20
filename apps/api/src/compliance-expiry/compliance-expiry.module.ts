import { Module } from '@nestjs/common';
import { ComplianceExpiryService } from './compliance-expiry.service';
import { ComplianceExpiryController } from './compliance-expiry.controller';

@Module({
  providers: [ComplianceExpiryService],
  controllers: [ComplianceExpiryController],
  exports: [ComplianceExpiryService],
})
export class ComplianceExpiryModule {}
