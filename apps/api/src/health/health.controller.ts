import { Controller, Get } from '@nestjs/common';

interface HealthCheck {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
    stripe: 'connected' | 'disconnected';
  };
}

@Controller('health')
export class HealthController {
  private startTime = Date.now();

  @Get()
  check(): HealthCheck {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services: {
        database: 'connected',
        redis: 'connected',
        stripe: 'connected',
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
