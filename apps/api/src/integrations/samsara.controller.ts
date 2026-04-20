/**
 * Samsara Integration Controller
 * API endpoints for ELD data
 */
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SamsaraService } from './samsara.service';

@Controller('integrations/samsara')
export class SamsaraController {
  constructor(private readonly samsaraService: SamsaraService) {}

  @Get('vehicles')
  async getVehicles() {
    return this.samsaraService.getVehicles();
  }

  @Get('locations')
  async getLocations(@Query('vehicleIds') vehicleIds?: string) {
    const ids = vehicleIds ? vehicleIds.split(',') : undefined;
    return this.samsaraService.getVehicleLocations(ids);
  }

  @Get('hos')
  async getHOS(@Query('driverIds') driverIds?: string) {
    const ids = driverIds ? driverIds.split(',') : undefined;
    return this.samsaraService.getHOSClocks(ids);
  }

  @Get('stats')
  async getStats(@Query('vehicleIds') vehicleIds?: string) {
    const ids = vehicleIds ? vehicleIds.split(',') : undefined;
    return this.samsaraService.getVehicleStats(ids);
  }

  @Get('safety-scores')
  async getSafetyScores(
    @Query('driverIds') driverIds?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    const ids = driverIds ? driverIds.split(',') : undefined;
    return this.samsaraService.getSafetyScores(ids, startTime, endTime);
  }

  @Post('dispatch')
  async createDispatch(@Body() routeData: any) {
    return this.samsaraService.createDispatchRoute(routeData);
  }

  @Post('webhook')
  async handleWebhook(@Body() event: any) {
    return this.samsaraService.handleWebhook(event);
  }
}
