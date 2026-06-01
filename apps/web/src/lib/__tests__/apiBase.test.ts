import { describe, expect, it } from 'vitest';
import { normalizeApiBaseUrl } from '@/lib/apiBase';

describe('normalizeApiBaseUrl', () => {
  it('uses the same-origin Netlify API proxy by default', () => {
    expect(normalizeApiBaseUrl()).toBe('/api');
    expect(normalizeApiBaseUrl('')).toBe('/api');
  });

  it('does not duplicate the api path when the configured value already includes it', () => {
    expect(normalizeApiBaseUrl('/api')).toBe('/api');
    expect(normalizeApiBaseUrl('/api/')).toBe('/api');
    expect(normalizeApiBaseUrl('https://api.infamousfreight.com/api')).toBe('https://api.infamousfreight.com/api');
  });

  it('adds the api path to origin-only backend URLs', () => {
    expect(normalizeApiBaseUrl('https://api.infamousfreight.com')).toBe('https://api.infamousfreight.com/api');
    expect(normalizeApiBaseUrl('https://infamous-freight-api.fly.dev/')).toBe('https://infamous-freight-api.fly.dev/api');
  });
});
