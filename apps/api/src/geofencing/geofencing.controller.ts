import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { GeofencingService } from './geofencing.service';

@Controller('geofencing')
export class GeofencingController {
  constructor(private readonly service: GeofencingService) {}

  @Post('create')
  async create(@Body() body: {
    loadId: string;
    type: 'pickup' | 'delivery';
    lat: number;
    lng: number;
    address: string;
    scheduledTime: string;
    customerName: string;
    radiusMeters?: number;
  }) {
    return this.service.createGeofence(
      body.loadId, body.type, body.lat, body.lng,
      body.address, new Date(body.scheduledTime), body.customerName, body.radiusMeters,
    );
  }

  @Post('check-location')
  async checkLocation(@Body() body: { driverId: string; lat: number; lng: number }) {
    return this.service.checkDriverLocation(body.driverId, body.lat, body.lng);
  }

  @Post('eta')
  async calculateETA(@Body() body: {
    driverId: string; currentLat: number; currentLng: number;
    destLat: number; destLng: number; averageSpeedMph?: number;
  }) {
    return this.service.calculateETA(
      body.driverId, body.currentLat, body.currentLng,
      body.destLat, body.destLng, body.averageSpeedMph,
    );
  }

  @Get('load/:loadId')
  async getForLoad(@Param('loadId') loadId: string) {
    return this.service.getGeofencesForLoad(loadId);
  }

  @Post('tracking-link')
  async generateTrackingLink(@Body('loadId') loadId: string) {
    const url = await this.service.generateTrackingLink(loadId);
    return { url };
  }
}
