import { describe, expect, it } from 'vitest';
import {
  AUTHENTICATED_ROUTE_READINESS,
  resolveRouteReadiness,
  type RouteReadinessState,
} from '@/lib/routeReadiness';
import { isPublicPath } from '@/lib/routes';

describe('routeReadiness', () => {
  it('covers audited authenticated routes with explicit readiness states', () => {
    const expected: Record<string, RouteReadinessState> = {
      '/ops': 'demo',
      '/loads': 'demo',
      '/dispatch': 'demo',
      '/drivers': 'demo',
      '/invoices': 'demo',
      '/analytics': 'demo',
      '/compliance': 'demo',
      '/settings': 'demo',
      '/billing': 'live',
      '/carriers': 'demo',
      '/accounting': 'demo',
      '/quotes': 'demo',
      '/messages': 'not_ready',
      '/driver-app': 'not_ready',
    };

    expect(AUTHENTICATED_ROUTE_READINESS).toMatchObject(
      Object.fromEntries(
        Object.entries(expected).map(([path, state]) => [path, { state }])
      )
    );
  });

  it('matches direct and nested route paths', () => {
    expect(resolveRouteReadiness('/messages')?.state).toBe('not_ready');
    expect(resolveRouteReadiness('/quotes/123')?.state).toBe('demo');
    expect(resolveRouteReadiness('/billing/portal')?.state).toBe('live');
  });

  it('returns null for paths outside the readiness map', () => {
    expect(resolveRouteReadiness('/')).toBeNull();
    expect(resolveRouteReadiness('/request-quote')).toBeNull();
  });

  it('treats all public marketing and form routes as auth-free', () => {
    [
      '/',
      '/about',
      '/contact',
      '/services',
      '/services/flatbed',
      '/request-quote',
      '/track-shipment',
      '/carrier-portal',
      '/customer-portal',
      '/load-board',
      '/partners',
      '/drive',
      '/faq',
      '/resources',
      '/resources/freight-tracking-explained',
      '/terms',
      '/privacy',
      '/thank-you',
    ].forEach((path) => expect(isPublicPath(path)).toBe(true));

    expect(isPublicPath('/ops')).toBe(false);
    expect(isPublicPath('/quotes')).toBe(false);
  });
});
