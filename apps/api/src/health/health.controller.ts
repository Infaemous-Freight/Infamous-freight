import { Controller, Get } from '@nestjs/common';

interface HealthCheck {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected' | 'unknown';
    redis: 'connected' | 'disconnected' | 'unknown';
    stripe: 'connected' | 'disconnected' | 'unknown';
  };
}

@Controller('health')
export class HealthController {
  private startTime = Date.now();

  @Get()
  check(): HealthCheck {
    // This NestJS controller is not wired into the production Express
    // runtime (see apps/api/src/app.ts for the live /api/health handler,
    // which performs a real database probe). Until per-dependency probes
    // are implemented here, report 'unknown' instead of falsely claiming
    // each dependency is connected.
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services: {
        database: 'unknown',
        redis: 'unknown',
        stripe: 'unknown',
      },
    };
  }

  @Get('ready')
  readiness(): { ready: boolean } {
    return { ready: true };
  }

  @Get('live')
  liveness(): { alive: boolean } {
    return { alive: true };
  }
}
