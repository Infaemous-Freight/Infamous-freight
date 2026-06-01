import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveRouteReadiness } from '@/lib/routeReadiness';

describe('production recovery route coverage', () => {
  const appSource = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8');
  const layoutSource = readFileSync(join(process.cwd(), 'src/layouts/AppLayout.tsx'), 'utf8');

  it.each([
    '/',
    '/services',
    '/pricing',
    '/request-quote',
    '/track-shipment',
    '/load-board',
    '/resources',
    '/contact',
    '/about',
    '/login',
    '/register',
    '/dashboard',
    '/account',
    '/messages',
  ])('declares a frontend route for %s', (route) => {
    const routePattern = route === '/' ? 'path="/"' : `path="${route}"`;
    expect(appSource).toContain(routePattern);
  });

  it('removes placeholder preparing copy from the route fallback', () => {
    expect(appSource).not.toMatch(/route content is preparing/i);
  });

  it('opens dashboard, account, messages, and driver mobile surfaces instead of hard not-ready gates', () => {
    expect(resolveRouteReadiness('/dashboard')?.state).not.toBe('not_ready');
    expect(resolveRouteReadiness('/account')?.state).not.toBe('not_ready');
    expect(resolveRouteReadiness('/messages')?.state).not.toBe('not_ready');
    expect(resolveRouteReadiness('/driver-app')?.state).not.toBe('not_ready');
  });

  it('uses safe-area aware mobile bottom navigation spacing', () => {
    expect(layoutSource).toContain('env(safe-area-inset-bottom)');
    expect(layoutSource).toContain('min-h-12 flex flex-1');
  });
});
