import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('health endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.API_RATE_LIMIT_ENABLED = 'false';
    process.env.REDIS_HOST = '';
    delete process.env.STRIPE_SECRET_KEY;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns structured health status', async () => {
    const response = await request(app.getHttpServer()).get('/api/health');

    expect(response.status).toBe(200);
    expect(['ok', 'degraded', 'error']).toContain(response.body.status);
    expect(typeof response.body.timestamp).toBe('string');
    expect(response.body.services).toBeDefined();
    expect(response.body.services.redis).toBe('unconfigured');
    expect(response.body.services.stripe).toBe('unconfigured');
  });

  it('returns liveness status', async () => {
    const response = await request(app.getHttpServer()).get('/api/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ alive: true });
  });
});
