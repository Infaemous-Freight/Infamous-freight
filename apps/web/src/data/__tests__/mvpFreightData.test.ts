import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadDemoData() {
  vi.resetModules();
  return import('@/data/mvpFreightData');
}

describe('mvpFreightData', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps demo records out of production unless explicitly enabled', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_ENABLE_DEMO_DATA', undefined);

    const data = await loadDemoData();

    expect(data.demoShipments).toHaveLength(0);
    expect(data.demoQuotes).toHaveLength(0);
    expect(data.demoCarrierLoads).toHaveLength(0);
    expect(data.demoLoadBoardLoads).toHaveLength(0);
  });

  it('allows demo records in production only when the flag is true', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_ENABLE_DEMO_DATA', 'true');

    const data = await loadDemoData();

    expect(data.demoShipments.length).toBeGreaterThan(0);
    expect(data.demoQuotes.length).toBeGreaterThan(0);
    expect(data.demoCarrierLoads.length).toBeGreaterThan(0);
    expect(data.demoLoadBoardLoads.length).toBeGreaterThan(0);
  });

  it('keeps non-production demos available unless explicitly disabled', async () => {
    vi.stubEnv('PROD', false);
    vi.stubEnv('VITE_ENABLE_DEMO_DATA', undefined);

    const data = await loadDemoData();

    expect(data.demoShipments.length).toBeGreaterThan(0);
  });
});
