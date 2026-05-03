// Single source of truth for routes that should bypass the authenticated app layout.
// AppLayout reads PUBLIC_PATH_PREFIXES to skip the auth gate; App.tsx mounts these
// outside of <AppLayout /> so they render with no chrome.
export const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/register',
  '/onboarding',
  '/track',
  '/track-shipment',
  '/home',
  '/request-quote',
  '/customer-portal',
  '/carrier-portal',
  '/freight-assistant',
  '/pricing',
  '/partners',
  '/drive',
] as const;

export const PUBLIC_PATHS: ReadonlySet<string> = new Set([
  '/login',
  '/register',
  '/onboarding',
  '/home',
  '/request-quote',
  '/track-shipment',
  '/customer-portal',
  '/carrier-portal',
  '/freight-assistant',
  '/pricing',
  '/partners',
  '/drive',
]);

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
