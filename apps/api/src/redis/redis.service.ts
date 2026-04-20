import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisService.name);
  private readonly DEFAULT_TTL = 300; // 5 minutes

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.redis.on('connect', () => this.logger.log('Redis connected'));
    this.redis.on('error', (err) => this.logger.error('Redis error:', err));
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length) {
      await this.redis.del(...keys);
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  // Cache load data for fast matching
  async cacheLoad(loadId: string, data: any): Promise<void> {
    await this.set(`load:${loadId}`, data, 600);
  }

  async getCachedLoad(loadId: string): Promise<any> {
    return this.get(`load:${loadId}`);
  }

  // Cache driver scores for auto-dispatch
  async cacheDriverScores(loadId: string, scores: any[]): Promise<void> {
    await this.set(`dispatch:scores:${loadId}`, scores, 60);
  }

  async getCachedDriverScores(loadId: string): Promise<any> {
    return this.get(`dispatch:scores:${loadId}`);
  }

  // Rate limiting helpers
  async incrementCounter(key: string, windowSeconds: number): Promise<number> {
    const multi = this.redis.multi();
    multi.incr(key);
    multi.expire(key, windowSeconds);
    const results = await multi.exec();
    return (results?.[0]?.[1] as number) || 0;
  }

  // Market rates cache
  async cacheMarketRate(lane: string, rate: number): Promise<void> {
    await this.set(`market:rate:${lane}`, rate, 3600); // 1 hour
  }

  async getCachedMarketRate(lane: string): Promise<number | null> {
    return this.get(`market:rate:${lane}`);
  }

  // Session blacklisting (logout)
  async blacklistToken(token: string, expSeconds: number): Promise<void> {
    await this.set(`blacklist:${token}`, '1', expSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const val = await this.get(`blacklist:${token}`);
    return val !== null;
  }

  // Leaderboard for gamification
  async addToLeaderboard(driverId: string, score: number): Promise<void> {
    await this.redis.zadd('leaderboard:weekly', score, driverId);
  }

  async getLeaderboard(topN: number = 10): Promise<Array<{ driverId: string; score: number }>> {
    const results = await this.redis.zrevrange('leaderboard:weekly', 0, topN - 1, 'WITHSCORES');
    const leaderboard: Array<{ driverId: string; score: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({ driverId: results[i], score: parseFloat(results[i + 1]) });
    }
    return leaderboard;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
