export type RouteReadinessState = 'live' | 'demo' | 'not_ready';

export type RouteReadiness = {
  state: RouteReadinessState;
  message: string;
};

export const AUTHENTICATED_ROUTE_READINESS: Record<string, RouteReadiness> = {
  '/ops': {
    state: 'not_ready',
    message: 'Operations dashboard is not production-ready until live operational data is verified.',
  },
  '/loads': {
    state: 'live',
    message: 'Load board is backed by tenant-scoped API load records. External broker/load-board feeds are not yet connected.',
  },
  '/dispatch': {
    state: 'not_ready',
    message: 'Production dispatch execution is not enabled until assignment, status, exception, audit, and realtime controls are verified.',
  },
  '/ops/drivers': {
    state: 'live',
    message: 'Driver roster is backed by tenant-scoped API driver records. HOS remains non-authoritative until an ELD integration is connected.',
  },
  '/invoices': {
    state: 'live',
    message: 'Invoice records are tenant-scoped API data. Stripe collection and revenue reconciliation require production verification.',
  },
  '/analytics': {
    state: 'not_ready',
    message: 'Production analytics are not enabled until metrics are sourced from verified live operational and financial records.',
  },
  '/compliance': {
    state: 'not_ready',
    message: 'Production compliance controls are not enabled until carrier authority, insurance, document expiry, and source-system verification are complete.',
  },
  '/settings': {
    state: 'not_ready',
    message: 'Settings contains mixed readiness surfaces and is not approved as a production control plane.',
  },
  '/settings/billing': {
    state: 'not_ready',
    message: 'Billing UI is implemented; production payment and subscription verification remains a launch gate.',
  },
  '/billing': {
    state: 'not_ready',
    message: 'Billing UI is implemented; production payment and subscription verification remains a launch gate.',
  },
  '/carriers': {
    state: 'not_ready',
    message: 'Carrier onboarding is not production-ready until authority, insurance, documentation, approval, expiration, and audit controls are verified.',
  },
  '/accounting': {
    state: 'not_ready',
    message: 'Production accounting is not enabled until ledger, payment reconciliation, refunds, disputes, and settlement controls are verified.',
  },
  '/quotes': {
    state: 'not_ready',
    message: 'Internal quote commitments are not production-enabled until pricing, approval, load creation, and audit flows are verified.',
  },
  '/messages': {
    state: 'not_ready',
    message: 'Production messaging is not enabled until persistent carrier/driver communication and audit controls are verified.',
  },
  '/driver-app': {
    state: 'not_ready',
    message: 'Driver app is not production-ready and remains unavailable for live dispatch execution.',
  },
};

export function resolveRouteReadiness(pathname: string): RouteReadiness | null {
  const matchedPath = Object.keys(AUTHENTICATED_ROUTE_READINESS)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));
  return matchedPath ? AUTHENTICATED_ROUTE_READINESS[matchedPath] : null;
}
