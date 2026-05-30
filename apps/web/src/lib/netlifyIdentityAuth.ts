import type { User as NetlifyUser } from '@netlify/identity';
import { getUser, handleAuthCallback, hydrateSession, logout as netlifyLogout, onAuthChange, refreshSession } from '@netlify/identity';
import type { SubscriptionStatus } from '@/lib/paywall';
import { normalizeSubscriptionStatus } from '@/lib/paywall';

type AppUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  carrierId: string;
  avatar?: string;
  subscriptionStatus?: SubscriptionStatus;
};

const ROLE_ORDER = ['driver', 'dispatcher', 'admin', 'owner'];

function metadataString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function metadataBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function normalizeRole(user: NetlifyUser): string {
  const metadataRole = metadataString(user.appMetadata?.role) ?? metadataString(user.userMetadata?.role);
  const role = user.roles?.find((candidate) => ROLE_ORDER.includes(candidate)) ?? metadataRole ?? user.role ?? 'driver';
  return ROLE_ORDER.includes(role) ? role : 'driver';
}

export function mapNetlifyUser(user: NetlifyUser): AppUser {
  const email = user.email ?? '';
  const companyName =
    metadataString(user.appMetadata?.companyName) ??
    metadataString(user.appMetadata?.company_name) ??
    metadataString(user.userMetadata?.companyName) ??
    metadataString(user.userMetadata?.company_name);

  const carrierId =
    metadataString(user.appMetadata?.carrierId) ??
    metadataString(user.appMetadata?.carrier_id) ??
    metadataString(user.userMetadata?.carrierId) ??
    metadataString(user.userMetadata?.carrier_id) ??
    companyName ??
    user.id;

  return {
    id: user.id,
    email,
    name: user.name ?? metadataString(user.userMetadata?.full_name) ?? email.split('@')[0] ?? 'User',
    role: normalizeRole(user),
    carrierId,
    avatar: user.pictureUrl,
    subscriptionStatus: normalizeSubscriptionStatus(
      user.appMetadata?.subscription_status ??
        user.userMetadata?.subscriptionStatus ??
        user.userMetadata?.subscription_status ??
        user.userMetadata?.billingStatus ??
        user.userMetadata?.billing_status ??
        'active'
    ),
  };
}

export async function processNetlifyIdentityCallback(): Promise<AppUser | null> {
  const callbackResult = await handleAuthCallback();
  return callbackResult?.user ? mapNetlifyUser(callbackResult.user) : null;
}

export async function hydrateNetlifyIdentityUser(options: { processCallback?: boolean } = {}): Promise<AppUser | null> {
  if (options.processCallback) {
    const callbackUser = await processNetlifyIdentityCallback();
    if (callbackUser) return callbackUser;
  }

  const hydratedUser = await hydrateSession();
  const user = hydratedUser ?? (await getUser());
  return user ? mapNetlifyUser(user) : null;
}

export function isEmailVerified(user: NetlifyUser): boolean {
  return Boolean(user.confirmedAt ?? metadataBoolean(user.appMetadata?.email_verified));
}

export async function logoutNetlifyIdentity(): Promise<void> {
  await netlifyLogout();
}

const NF_JWT_COOKIE = 'nf_jwt';

function readSessionJwtCookie(): string | null {
  if (typeof document === 'undefined' || !document.cookie) {
    return null;
  }

  const escaped = NF_JWT_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`(?:^|; )${escaped}=([^;]*)`).exec(document.cookie);

  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Returns the current Netlify Identity access token (JWT) for the signed-in
 * user, or null when no session is present. Triggers an immediate refresh when
 * the token is near expiry, otherwise falls back to the stored `nf_jwt` session
 * cookie. The token is meant to be forwarded to the data API as a Bearer
 * credential so the API can verify the caller instead of trusting client
 * headers.
 */
export async function getNetlifyIdentityToken(): Promise<string | null> {
  try {
    const refreshed = await refreshSession();
    if (refreshed) {
      return refreshed;
    }
  } catch {
    // Refresh failures (e.g. revoked refresh token) are non-fatal here; fall
    // back to the session cookie below and let the API reject if invalid.
  }

  return readSessionJwtCookie();
}

export { onAuthChange };
