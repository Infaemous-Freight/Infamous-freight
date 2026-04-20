import { Module } from '@nestjs/common';
import { GeofencingService } from './geofencing.service';
import { GeofencingController } from './geofencing.controller';

@Module({
  providers: [GeofencingService],
  controllers: [GeofencingController],
  exports: [GeofencingService],
})
export class GeofencingModule {}
