import { Controller, Post, Body } from '@nestjs/common';
import { CarrierPacketService } from './carrier-packet.service';

@Controller('carrier-packet')
export class CarrierPacketController {
  constructor(private readonly service: CarrierPacketService) {}

  @Post('generate')
  async generate(@Body() body: { data: any; requirements?: any }) {
    return this.service.generatePacket(body.data, body.requirements);
  }

  @Post('w9')
  async generateW9(@Body() body: { data: any }) {
    return this.service.generateW9(body.data);
  }

  @Post('coi')
  async generateCOI(@Body() body: { data: any }) {
    return this.service.generateCOI(body.data);
  }
}
