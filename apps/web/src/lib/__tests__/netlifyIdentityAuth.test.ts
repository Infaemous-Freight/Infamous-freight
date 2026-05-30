import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User as NetlifyUser } from '@netlify/identity';

const {
  handleAuthCallbackMock,
  hydrateSessionMock,
  getUserMock,
  onAuthChangeMock,
  refreshSessionMock,
} = vi.hoisted(() => ({
  handleAuthCallbackMock: vi.fn(),
  hydrateSessionMock: vi.fn(),
  getUserMock: vi.fn(),
  onAuthChangeMock: vi.fn(),
  refreshSessionMock: vi.fn(),
}));

vi.mock('@netlify/identity', () => ({
  getUser: getUserMock,
  handleAuthCallback: handleAuthCallbackMock,
  hydrateSession: hydrateSessionMock,
  logout: vi.fn(),
  onAuthChange: onAuthChangeMock,
  refreshSession: refreshSessionMock,
}));

import {
  getNetlifyIdentityToken,
  hydrateNetlifyIdentityUser,
  isEmailVerified,
  mapNetlifyUser,
  onAuthChange,
} from '@/lib/netlifyIdentityAuth';

function makeNetlifyUser(overrides: Partial<NetlifyUser> = {}): NetlifyUser {
  return {
    id: 'user_123',
    email: 'driver@example.com',
    appMetadata: {},
    userMetadata: {},
    ...overrides,
  } as NetlifyUser;
}

describe('netlifyIdentityAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handleAuthCallbackMock.mockResolvedValue(null);
    hydrateSessionMock.mockResolvedValue(null);
    getUserMock.mockResolvedValue(null);
    refreshSessionMock.mockResolvedValue(null);
  });

  describe('mapNetlifyUser', () => {
    it('maps metadata values and normalizes role and subscription status', () => {
      const user = makeNetlifyUser({
        name: undefined,
        role: 'invalid-role',
        roles: ['viewer', 'dispatcher'],
        pictureUrl: 'https://cdn.example.com/avatar.png',
        appMetadata: {
          company_name: 'North Yard Logistics',
          subscription_status: 'TRIALING',
        },
        userMetadata: {
          full_name: 'Lane Driver',
        },
      });

      expect(mapNetlifyUser(user)).toEqual({
        id: 'user_123',
        email: 'driver@example.com',
        name: 'Lane Driver',
        role: 'dispatcher',
        carrierId: 'North Yard Logistics',
        avatar: 'https://cdn.example.com/avatar.png',
        subscriptionStatus: 'trialing',
      });
    });

    it('falls back to user id for carrier and email prefix for name', () => {
      const user = makeNetlifyUser({
        email: 'ops@example.com',
        name: undefined,
        appMetadata: {},
        userMetadata: {},
      });

      expect(mapNetlifyUser(user)).toMatchObject({
        name: 'ops',
        carrierId: 'user_123',
      });
    });
  });

  describe('hydrateNetlifyIdentityUser', () => {
    it('returns callback user when processCallback is enabled and callback resolves a user', async () => {
      const callbackUser = makeNetlifyUser({ id: 'callback_user' });
      handleAuthCallbackMock.mockResolvedValue({ user: callbackUser });

      const hydrated = await hydrateNetlifyIdentityUser({ processCallback: true });

      expect(hydrated?.id).toBe('callback_user');
      expect(hydrateSessionMock).not.toHaveBeenCalled();
      expect(getUserMock).not.toHaveBeenCalled();
    });

    it('falls back to hydrateSession then getUser when callback is empty', async () => {
      const fallbackUser = makeNetlifyUser({ id: 'hydrated_user' });
      hydrateSessionMock.mockResolvedValue(null);
      getUserMock.mockResolvedValue(fallbackUser);

      const hydrated = await hydrateNetlifyIdentityUser({ processCallback: true });

      expect(handleAuthCallbackMock).toHaveBeenCalledTimes(1);
      expect(hydrateSessionMock).toHaveBeenCalledTimes(1);
      expect(getUserMock).toHaveBeenCalledTimes(1);
      expect(hydrated?.id).toBe('hydrated_user');
    });
  });

  describe('isEmailVerified', () => {
    it('returns true when confirmedAt exists', () => {
      expect(isEmailVerified(makeNetlifyUser({ confirmedAt: '2026-05-20T12:00:00.000Z' }))).toBe(true);
    });

    it('returns true when app metadata email_verified is true', () => {
      expect(isEmailVerified(makeNetlifyUser({ appMetadata: { email_verified: true } }))).toBe(true);
    });

    it('returns false when user is unverified', () => {
      expect(isEmailVerified(makeNetlifyUser({ appMetadata: { email_verified: false } }))).toBe(false);
    });

    it('returns false when email verification field is missing or null', () => {
      expect(isEmailVerified(makeNetlifyUser({ appMetadata: undefined }))).toBe(false);
      expect(isEmailVerified(makeNetlifyUser({ appMetadata: {} }))).toBe(false);
      expect(isEmailVerified(makeNetlifyUser({ appMetadata: { email_verified: null as unknown as boolean } }))).toBe(false);
    });
  });

  it('re-exports onAuthChange from @netlify/identity', () => {
    expect(onAuthChange).toBe(onAuthChangeMock);
  });

  describe('getNetlifyIdentityToken', () => {
    function clearJwtCookie() {
      document.cookie = 'nf_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }

    beforeEach(() => {
      clearJwtCookie();
    });

    it('returns the refreshed token when a refresh occurs', async () => {
      refreshSessionMock.mockResolvedValue('refreshed.jwt.token');

      await expect(getNetlifyIdentityToken()).resolves.toBe('refreshed.jwt.token');
    });

    it('falls back to the nf_jwt session cookie when no refresh is needed', async () => {
      refreshSessionMock.mockResolvedValue(null);
      document.cookie = `nf_jwt=${encodeURIComponent('cookie.jwt.token')}; path=/`;

      await expect(getNetlifyIdentityToken()).resolves.toBe('cookie.jwt.token');
    });

    it('falls back to the cookie when refresh throws', async () => {
      refreshSessionMock.mockRejectedValue(new Error('revoked refresh token'));
      document.cookie = `nf_jwt=${encodeURIComponent('cookie.jwt.token')}; path=/`;

      await expect(getNetlifyIdentityToken()).resolves.toBe('cookie.jwt.token');
    });

    it('returns null when there is no session', async () => {
      refreshSessionMock.mockResolvedValue(null);

      await expect(getNetlifyIdentityToken()).resolves.toBeNull();
    });
  });
});
