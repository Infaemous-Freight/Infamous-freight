import { Module } from '@nestjs/common';
import { IFTAService } from './ifta.service';
import { IFTAController } from './ifta.controller';

@Module({
  providers: [IFTAService],
  controllers: [IFTAController],
  exports: [IFTAService],
})
export class IFTAModule {}
