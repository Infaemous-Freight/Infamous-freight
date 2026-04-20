import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

@Injectable()
export class RateLimitService {
  private readonly defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyPrefix: 'rl',
  };

  // Stricter limits for auth endpoints
  private readonly authConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'rl:auth',
  };

  // Limits for API endpoints
  private readonly apiConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyPrefix: 'rl:api',
  };

  // Limits for load booking (prevent spam)
  private readonly bookingConfig: RateLimitConfig = {
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'rl:booking',
  };

  constructor(private readonly redis: RedisService) {}

  async isAllowed(clientId: string, config?: RateLimitConfig): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const cfg = config || this.defaultConfig;
    const key = `${cfg.keyPrefix}:${clientId}`;
    const windowSeconds = Math.ceil(cfg.windowMs / 1000);

    const current = await this.redis['incrementCounter'](key, windowSeconds);
    const remaining = Math.max(0, cfg.maxRequests - current);
    const resetAt = Date.now() + cfg.windowMs;

    return {
      allowed: current <= cfg.maxRequests,
      remaining,
      resetAt,
    };
  }

  async checkAuthLimit(identifier: string) {
    return this.isAllowed(identifier, this.authConfig);
  }

  async checkApiLimit(clientId: string) {
    return this.isAllowed(clientId, this.apiConfig);
  }

  async checkBookingLimit(clientId: string) {
    return this.isAllowed(clientId, this.bookingConfig);
  }
}
