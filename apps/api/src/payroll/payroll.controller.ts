import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PayrollService, DriverPayProfile } from './payroll.service';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('profile')
  async setProfile(@Body() profile: DriverPayProfile) {
    await this.payrollService.setPayProfile(profile);
    return { success: true };
  }

  @Get('profile/:driverId')
  async getProfile(@Param('driverId') driverId: string) {
    return this.payrollService.getPayProfile(driverId);
  }

  @Post('calculate-load')
  async calculateLoad(@Body() body: { driverId: string; loadData: any }) {
    return this.payrollService.calculateLoadSettlement(body.driverId, body.loadData);
  }

  @Post('generate-weekly')
  async generateWeekly(@Body() body: { driverId: string; weekStart: string; loads: any[] }) {
    return this.payrollService.generateWeeklySettlement(body.driverId, new Date(body.weekStart), body.loads);
  }

  @Post(':settlementId/approve')
  async approve(@Param('settlementId') settlementId: string) {
    return this.payrollService.approveSettlement(settlementId);
  }

  @Post(':settlementId/pay')
  async markPaid(@Param('settlementId') settlementId: string, @Body() body: { method: 'ach' | 'paypal' | 'check'; reference: string }) {
    return this.payrollService.markAsPaid(settlementId, body.method, body.reference);
  }

  @Get('settlements/:driverId')
  async getSettlements(@Param('driverId') driverId: string) {
    return this.payrollService.getDriverSettlements(driverId);
  }

  @Get('earnings/:driverId')
  async getEarnings(@Param('driverId') driverId: string) {
    return this.payrollService.getDriverEarnings(driverId);
  }
}
