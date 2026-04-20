import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RateConService, RateConData } from './ratecon.service';

@Controller('ratecons')
export class RateConController {
  constructor(private readonly rateConService: RateConService) {}

  @Post('generate')
  async generate(@Body() data: RateConData) {
    return this.rateConService.generateRateCon(data);
  }

  @Post('email')
  async emailToBroker(@Body() body: { data: RateConData; brokerEmail: string; templateId?: string }) {
    return this.rateConService.emailToBroker(body.data, body.brokerEmail, body.templateId);
  }

  @Post('templates')
  async createTemplate(@Body() body: Omit<import('./ratecon.service').RateConTemplate, 'id'>) {
    return this.rateConService.createTemplate(body);
  }

  @Get('templates/:carrierId')
  async getTemplates(@Param('carrierId') carrierId: string) {
    return this.rateConService.getTemplates(carrierId);
  }
}
