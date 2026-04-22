import request from 'supertest';
import { createApp } from '../src/app';

describe('health endpoint', () => {
  it('returns 200 and ok status', async () => {
    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.timestamp).toBe('string');
  });
});
