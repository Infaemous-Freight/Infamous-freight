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
    state: 'demo',
    message: 'Load board currently uses demo-backed records and does not reflect live broker feed activity.',
  },
  '/dispatch': {
    state: 'demo',
    message: 'Dispatch board workflows are demo-backed and should not be treated as production dispatch execution.',
  },
  '/ops/drivers': {
    state: 'demo',
    message: 'Driver roster and performance widgets are demo-backed while live driver services are being integrated.',
  },
  '/invoices': {
    state: 'demo',
    message: 'Invoice management currently contains demo-backed records and requires live billing integration completion.',
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
  '/dashboard': {
    state: 'demo',
    message: 'Dashboard is available with safe empty states and demo-backed widgets while live integrations are hardened.',
  },
  '/account': {
    state: 'demo',
    message: 'Account settings are available for operators; some integration controls remain demo-backed until production verification is complete.',
  },
  '/messages': {
    state: 'demo',
    message: 'Messaging opens with a safe operator inbox and demo-backed conversations while live communication services are being integrated.',
  },
  '/driver-app': {
    state: 'demo',
    message: 'Driver mobile surfaces open with safe empty states while live dispatch execution is being integrated.',
  },
};

export function resolveRouteReadiness(pathname: string): RouteReadiness | null {
  const matchedPath = Object.keys(AUTHENTICATED_ROUTE_READINESS)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));
  return matchedPath ? AUTHENTICATED_ROUTE_READINESS[matchedPath] : null;
}
