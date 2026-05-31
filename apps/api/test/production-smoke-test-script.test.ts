import fs from 'fs';
import path from 'path';

describe('production smoke test script', () => {
  const scriptPath = path.resolve(__dirname, '../../../scripts/production-smoke-test.sh');

  it('uses strict bash mode', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');

    expect(content.startsWith('#!/usr/bin/env bash')).toBe(true);
    expect(content).toContain('set -euo pipefail');
  });

  it('checks API liveness and readiness on /api/health routes', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');

    expect(content).toContain('curl --fail --show-error --silent "${API_URL%/}${INFAMOUS_HEALTH_LIVE_PATH}"');
    expect(content).toContain('curl --fail --show-error --silent "${API_URL%/}${INFAMOUS_HEALTH_READY_PATH}"');
    expect(content).not.toContain('"${API_URL%/}/health/live"');
    expect(content).not.toContain('"${API_URL%/}/health/ready"');
  });

  it('can optionally validate a known safe public tracking response', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');

    expect(content).toContain('PUBLIC_VALID_TRACKING_NUMBER="${PUBLIC_VALID_TRACKING_NUMBER:-}"');
    expect(content).toContain('PUBLIC_VALID_SHIPMENT_URL="${PUBLIC_VALID_SHIPMENT_URL:-}"');
    expect(content).toContain('Checking valid public tracking lookup');
    expect(content).toContain(
      "for (const field of ['trackingNumber', 'status', 'origin', 'destination', 'lastUpdated'])",
    );
    expect(content).toContain('Valid tracking response success flag must be true.');
  });
});
