import { Module } from '@nestjs/common';
import { CSAMonitorService } from './csa-monitor.service';
import { CSAMonitorController } from './csa-monitor.controller';

@Module({
  providers: [CSAMonitorService],
  controllers: [CSAMonitorController],
  exports: [CSAMonitorService],
})
export class CSAMonitorModule {}
