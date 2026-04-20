import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ComplianceExpiryService } from './compliance-expiry.service';

@Controller('compliance')
export class ComplianceExpiryController {
  constructor(private readonly service: ComplianceExpiryService) {}

  @Post('documents')
  async addDocument(@Body() body: any) {
    return this.service.addDocument(body);
  }

  @Get('documents/:carrierId')
  async getDocuments(@Param('carrierId') carrierId: string) {
    return this.service.getDocuments(carrierId);
  }

  @Get('alerts/:carrierId')
  async getAlerts(@Param('carrierId') carrierId: string) {
    return this.service.checkAllAlerts(carrierId);
  }

  @Get('can-dispatch/:carrierId')
  async canDispatch(@Param('carrierId') carrierId: string) {
    return this.service.canDispatch(carrierId);
  }

  @Get('broker-verification/:carrierId')
  async getBrokerVerification(@Param('carrierId') carrierId: string) {
    return this.service.getBrokerVerificationLink(carrierId);
  }

  @Get('dashboard/:carrierId')
  async getDashboard(@Param('carrierId') carrierId: string) {
    return this.service.getComplianceDashboard(carrierId);
  }
}
