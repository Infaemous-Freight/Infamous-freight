import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Netlify API proxy configuration', () => {
  const netlifyConfig = readFileSync(join(process.cwd(), '../../netlify.toml'), 'utf8');

  it('forwards /api/* to Fly without creating a double /api/api prefix', () => {
    expect(netlifyConfig).toContain('from = "/api/*"');
    expect(netlifyConfig).toContain('to = "https://infamous-freight-api.fly.dev/api/:splat"');
    expect(netlifyConfig).not.toContain('infamous-freight-api.fly.dev/api/api');
  });
});
