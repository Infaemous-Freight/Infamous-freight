import { Module, Global } from '@nestjs/common';
import { RBACService } from './rbac.service';
import { RBACGuard } from './rbac.guard';
import { APP_GUARD } from '@nestjs/core';

@Global()
@Module({
  providers: [
    RBACService,
    {
      provide: APP_GUARD,
      useClass: RBACGuard,
    },
  ],
  exports: [RBACService],
})
export class RBACModule {}
