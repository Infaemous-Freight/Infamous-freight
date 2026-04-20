import { Module } from '@nestjs/common';
import { ELDService } from './eld.service';
import { SamsaraService } from './samsara.service';
import { MotiveService } from './motive.service';
import { OmnitracsService } from './omnitracs.service';
import { GeotabService } from './geotab.service';
import { UnifiedHOSAdapter } from './unified-hos.adapter';
import { ELDController } from './eld.controller';

@Module({
  providers: [ELDService, SamsaraService, MotiveService, OmnitracsService, GeotabService, UnifiedHOSAdapter],
  controllers: [ELDController],
  exports: [ELDService, UnifiedHOSAdapter],
})
export class ELDModule {}
