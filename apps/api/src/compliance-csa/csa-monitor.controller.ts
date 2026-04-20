import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CSAMonitorService } from './csa-monitor.service';

@Controller('csa')
export class CSAMonitorController {
  constructor(private readonly csaService: CSAMonitorService) {}

  @Get('carrier/:dotNumber')
  async getCarrierCSA(@Param('dotNumber') dotNumber: string) {
    return this.csaService.getCarrierCSA(dotNumber);
  }

  @Get('carrier/:dotNumber/alerts')
  async checkAlerts(@Param('dotNumber') dotNumber: string) {
    return this.csaService.checkAlerts(dotNumber);
  }

  @Post('driver')
  async addDriverCSA(@Body() body: any) {
    await this.csaService.addDriverCSA(body);
    return { success: true };
  }

  @Get('driver/:driverId')
  async getDriverCSA(@Param('driverId') driverId: string) {
    return this.csaService.getDriverCSA(driverId);
  }

  @Get('high-risk-drivers')
  async getHighRiskDrivers() {
    return this.csaService.getHighRiskDrivers('all');
  }

  @Post('action-plan')
  async generateActionPlan(@Body() body: { dotNumber: string; basic: any }) {
    return this.csaService.generateActionPlan(body.dotNumber, body.basic);
  }
}
