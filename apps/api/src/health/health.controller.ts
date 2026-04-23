import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

type ServiceState = 'connected' | 'disconnected' | 'unconfigured';

interface HealthCheck {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceState;
    redis: ServiceState;
    stripe: ServiceState;
  };
}

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check(): Promise<HealthCheck> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);
    const stripe = this.checkStripe();

    const services = { database, redis, stripe };
    const disconnectedCount = Object.values(services).filter((state) => state === 'disconnected').length;
    const status = disconnectedCount === 0
      ? 'ok'
      : disconnectedCount === Object.keys(services).length
        ? 'error'
        : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services,
    };
  }

  @Get('ready')
  async readiness(): Promise<{ ready: boolean; services: HealthCheck['services'] }> {
    const health = await this.check();
    const ready = health.services.database === 'connected' && health.services.redis !== 'disconnected';

    if (!ready) {
      throw new ServiceUnavailableException({ ready, services: health.services });
    }

    return { ready, services: health.services };
  }

  @Get('live')
  liveness(): { alive: boolean } {
    return { alive: true };
  }

  private async checkDatabase(): Promise<ServiceState> {
    if (!process.env.DATABASE_URL) {
      return 'unconfigured';
    }

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }

  private async checkRedis(): Promise<ServiceState> {
    if (!process.env.REDIS_HOST) {
      return 'unconfigured';
    }

    return (await this.redis.ping()) ? 'connected' : 'disconnected';
  }

  private checkStripe(): ServiceState {
    return process.env.STRIPE_SECRET_KEY ? 'connected' : 'unconfigured';
  }
}
