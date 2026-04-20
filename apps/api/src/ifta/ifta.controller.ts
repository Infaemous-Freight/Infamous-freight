import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { IFTAService, FuelPurchase } from './ifta.service';

@Controller('ifta')
export class IFTAController {
  constructor(private readonly iftaService: IFTAService) {}

  @Post('fuel-purchase')
  async addFuelPurchase(@Body() purchase: FuelPurchase) {
    await this.iftaService.addFuelPurchase(purchase);
    return { success: true };
  }

  @Post('import-fuel')
  async importFuel(@Body() body: { carrierId: string; csvData: string }) {
    return this.iftaService.importFuelCSV(body.carrierId, body.csvData);
  }

  @Post('calculate')
  async calculate(@Body() body: {
    carrierId: string;
    year: number;
    quarter: 1 | 2 | 3 | 4;
    mileageData: Array<{ state: string; miles: number }>;
    fuelPurchases: FuelPurchase[];
  }) {
    return this.iftaService.calculateQuarterlyReturn(
      body.carrierId, body.year, body.quarter, body.mileageData, body.fuelPurchases,
    );
  }

  @Get('deadlines/:year')
  async getDeadlines(@Param('year') year: string) {
    return this.iftaService.getFilingDeadlines(parseInt(year));
  }

  @Post(':carrierId/export-excel')
  async exportExcel(@Param('carrierId') carrierId: string, @Body() report: any) {
    return this.iftaService.exportToExcel(report);
  }
}
