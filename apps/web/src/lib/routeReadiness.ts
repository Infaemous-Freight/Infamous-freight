export type RouteReadinessState = 'live' | 'demo' | 'not_ready';

export type RouteReadiness = {
  state: RouteReadinessState;
  message: string;
};

export const AUTHENTICATED_ROUTE_READINESS: Record<string, RouteReadiness> = {
  '/ops': {
    state: 'demo',
    message: 'Operations dashboard currently uses sample operational data while live integrations are being wired in.',
  },
  '/loads': {
    state: 'live',
    message: 'Load board is backed by tenant-scoped API load records. External broker/load-board feeds are not yet connected.',
  },
  '/dispatch': {
    state: 'demo',
    message: 'Dispatch board workflows are demo-backed and should not be treated as production dispatch execution.',
  },
  '/ops/drivers': {
    state: 'live',
    message: 'Driver roster is backed by tenant-scoped API driver records. HOS remains non-authoritative until an ELD integration is connected.',
  },
  '/invoices': {
    state: 'live',
    message: 'Invoice records are tenant-scoped API data. Stripe collection and revenue reconciliation still require production verification.',
  },
  '/analytics': {
    state: 'demo',
    message: 'Analytics metrics are demo-backed and should be treated as non-final until production data verification is complete.',
  },
  '/compliance': {
    state: 'demo',
    message: 'Compliance views currently use sample records and must be cross-checked with source systems for live operations.',
  },
  '/settings': {
    state: 'demo',
    message: 'Settings contains mixed readiness surfaces; treat profile, security, and integrations controls as demo-backed unless documented otherwise.',
  },
  '/settings/billing': {
    state: 'live',
    message: 'Billing activation and paywall access controls are production-enabled.',
  },
  '/billing': {
    state: 'live',
    message: 'Billing activation and paywall access controls are production-enabled.',
  },
  '/carriers': {
    state: 'demo',
    message: 'Carrier onboarding and approval views are demo-backed and are not yet the source of truth for production onboarding.',
  },
  '/accounting': {
    state: 'demo',
    message: 'Accounting workflows currently use demo-backed finance records while production systems are hardened.',
  },
  '/quotes': {
    state: 'demo',
    message: 'Internal quote workflow is demo-backed; use public intake and documented dispatch review for live commitments.',
  },
  '/messages': {
    state: 'demo',
    message: 'Messaging is demo-backed until live carrier and driver communication integrations are completed.',
  },
  '/driver-app': {
    state: 'not_ready',
    message: 'Driver app is not production-ready yet and remains unavailable for live dispatch execution.',
  },
};

export function resolveRouteReadiness(pathname: string): RouteReadiness | null {
  const matchedPath = Object.keys(AUTHENTICATED_ROUTE_READINESS)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));
  return matchedPath ? AUTHENTICATED_ROUTE_READINESS[matchedPath] : null;
}
