import jwt from 'jsonwebtoken';

export const TEST_JWT_SECRET = 'test-jwt-secret-for-unit-tests';

/**
 * Signs a JWT token for use in tests.
 * Sets JWT_SECRET so the app middleware accepts the token.
 */
export function makeToken(tenantId: string, role: 'owner' | 'admin' | 'dispatcher'): string {
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  return jwt.sign({ sub: `user-${tenantId}`, tenantId, role }, TEST_JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Returns an Authorization header object for use with supertest's .set().
 */
export function authHeaders(tenantId: string, role: 'owner' | 'admin' | 'dispatcher'): Record<string, string> {
  return { Authorization: `Bearer ${makeToken(tenantId, role)}` };
}
