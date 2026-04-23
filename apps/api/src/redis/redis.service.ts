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
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.redis.on('connect', () => this.logger.log('Redis connected'));
    this.redis.on('error', (err) => this.logger.error('Redis error:', err));
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.redis.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
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
    const keys = await this.keys(pattern);
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

  async cacheLoad(loadId: string, data: any): Promise<void> {
    await this.set(`load:${loadId}`, data, 600);
  }

  async getCachedLoad(loadId: string): Promise<any> {
    return this.get(`load:${loadId}`);
  }

  async cacheDriverScores(loadId: string, scores: any[]): Promise<void> {
    await this.set(`dispatch:scores:${loadId}`, scores, 60);
  }

  async getCachedDriverScores(loadId: string): Promise<any> {
    return this.get(`dispatch:scores:${loadId}`);
  }

  async incrementCounter(key: string, windowSeconds: number): Promise<number> {
    const multi = this.redis.multi();
    multi.incr(key);
    multi.expire(key, windowSeconds);
    const results = await multi.exec();
    return (results?.[0]?.[1] as number) || 0;
  }

  async cacheMarketRate(lane: string, rate: number): Promise<void> {
    await this.set(`market:rate:${lane}`, rate, 3600);
  }

  async getCachedMarketRate(lane: string): Promise<number | null> {
    return this.get(`market:rate:${lane}`);
  }

  async blacklistToken(token: string, expSeconds: number): Promise<void> {
    await this.set(`blacklist:${token}`, '1', expSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const val = await this.get(`blacklist:${token}`);
    return val !== null;
  }

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

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
