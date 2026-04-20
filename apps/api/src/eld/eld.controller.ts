import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ELDService } from './eld.service';
import { ELDProvider } from './unified-hos.adapter';

@Controller('eld')
export class ELDController {
  constructor(private readonly eldService: ELDService) {}

  @Post('connect')
  async connect(
    @Body() body: { carrierId: string; provider: ELDProvider; accessToken: string },
  ) {
    return this.eldService.connectProvider(body.carrierId, body.provider, body.accessToken);
  }

  @Get(':carrierId/drivers')
  async getDriversHOS(@Param('carrierId') carrierId: string) {
    return this.eldService.getAllDriversHOS(carrierId);
  }

  @Get(':carrierId/drivers/:driverId/hos')
  async getDriverHOS(@Param('carrierId') carrierId: string, @Param('driverId') driverId: string) {
    return this.eldService.getDriverHOS(carrierId, driverId);
  }

  @Get(':carrierId/drivers/:driverId/location')
  async getDriverLocation(@Param('carrierId') carrierId: string, @Param('driverId') driverId: string) {
    return this.eldService.getDriverLocation(carrierId, driverId);
  }

  @Post(':carrierId/sync')
  async syncHOS(@Param('carrierId') carrierId: string) {
    await this.eldService.syncHOSData(carrierId);
    return { success: true };
  }

  @Post(':carrierId/disconnect')
  async disconnect(@Param('carrierId') carrierId: string) {
    await this.eldService.disconnect(carrierId);
    return { success: true };
  }

  @Get(':carrierId/provider')
  async getProvider(@Param('carrierId') carrierId: string) {
    return { provider: this.eldService.getConnectedProvider(carrierId) };
  }
}
