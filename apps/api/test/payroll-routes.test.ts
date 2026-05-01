import request from 'supertest';
import { createApp } from '../src/app';

describe('payroll routes', () => {
  it('requires tenant and role for settlements', async () => {
    const app = createApp();

    const noTenant = await request(app)
      .get('/api/payroll/settlements/driver-1')
      .set('x-user-role', 'dispatcher');

    expect(noTenant.status).toBe(400);
    expect(noTenant.body.error).toBe('tenant_id_required');

    const noRole = await request(app)
      .get('/api/payroll/settlements/driver-1')
      .set('x-tenant-id', 'tenant-1');

    expect(noRole.status).toBe(403);
    expect(noRole.body.error).toBe('forbidden');
  });

  it('isolates payroll settlements by tenant and summarizes earnings', async () => {
    const app = createApp();

    const seedT1 = await request(app)
      .post('/api/payroll/settlements')
      .set('x-tenant-id', 'tenant-1')
      .set('x-user-role', 'dispatcher')
      .send({ driverId: 'driver-1', weekStart: '2026-04-01', weekEnd: '2026-04-07', netPay: 1200 });

    expect(seedT1.status).toBe(201);

    const seedT2 = await request(app)
      .post('/api/payroll/settlements')
      .set('x-tenant-id', 'tenant-2')
      .set('x-user-role', 'dispatcher')
      .send({ driverId: 'driver-1', weekStart: '2026-04-01', weekEnd: '2026-04-07', netPay: 900 });

    expect(seedT2.status).toBe(201);

    const listT1 = await request(app)
      .get('/api/payroll/settlements/driver-1')
      .set('x-tenant-id', 'tenant-1')
      .set('x-user-role', 'dispatcher');

    expect(listT1.status).toBe(200);
    expect(listT1.body).toHaveLength(1);
    expect(listT1.body[0].tenantId).toBe('tenant-1');
    expect(listT1.body[0].netPay).toBe(1200);

    const earningsT1 = await request(app)
      .get('/api/payroll/earnings/driver-1')
      .set('x-tenant-id', 'tenant-1')
      .set('x-user-role', 'dispatcher');

    expect(earningsT1.status).toBe(200);
    expect(earningsT1.body.totalNetPay).toBe(1200);
    expect(earningsT1.body.settlementCount).toBe(1);
  });
});
