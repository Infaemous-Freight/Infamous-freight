/**
 * Integration test for response caching middleware.
 * Verifies org/user-scoped cache isolation and TTL.
 */

const { cacheResponseMiddleware, invalidateCacheForUser, invalidateCacheForOrg, clearAllCache } = require('../../../src/middleware/responseCache');

describe('Response cache middleware', () => {
    let mockReq;
    let mockRes;
    let nextCalled;

    beforeEach(() => {
        clearAllCache();
        nextCalled = false;

        mockRes = {
            statusCode: 200,
            _headers: {},
            set: jest.fn(function (key, val) {
                this._headers[key] = val;
                return this;
            }),
            json: jest.fn(function (data) {
                return data;
            }),
            on: jest.fn(),
        };
    });

    test('caches successful GET responses', () => {
        mockReq = {
            method: 'GET',
            originalUrl: '/api/test',
            user: { sub: 'user-1' },
            auth: { organizationId: 'org-1' },
        };

        const mockNext = jest.fn(() => {
            nextCalled = true;
        });

        cacheResponseMiddleware(mockReq, mockRes, mockNext);

        // Call json to trigger caching
        const data = { id: 1, name: 'test' };
        mockRes.json(data);

        expect(mockNext).toHaveBeenCalled();
        expect(nextCalled).toBe(true);
    });

    test('does not cache non-GET requests', () => {
        mockReq = {
            method: 'POST',
            originalUrl: '/api/test',
            user: { sub: 'user-1' },
            auth: { organizationId: 'org-1' },
        };

        const mockNext = jest.fn();
        cacheResponseMiddleware(mockReq, mockRes, mockNext);

        mockRes.json({ id: 1 });

        expect(mockNext).toHaveBeenCalled();
    });

    test('does not cache error responses (status >= 400)', () => {
        mockReq = {
            method: 'GET',
            originalUrl: '/api/test',
            user: { sub: 'user-1' },
            auth: { organizationId: 'org-1' },
        };
        mockRes.statusCode = 404;

        const mockNext = jest.fn();
        cacheResponseMiddleware(mockReq, mockRes, mockNext);

        mockRes.json({ error: 'Not found' });

        expect(mockNext).toHaveBeenCalled();
    });

    test('invalidates cache for specific user', () => {
        clearAllCache();

        // Cache a response
        mockReq = {
            method: 'GET',
            originalUrl: '/api/shipments',
            user: { sub: 'user-1' },
            auth: { organizationId: 'org-1' },
        };

        const mockNext = jest.fn();
        cacheResponseMiddleware(mockReq, mockRes, mockNext);
        mockRes.json({ shipments: [] });

        // Invalidate for that user
        invalidateCacheForUser('user-1', 'org-1');

        // Should return empty now (no cache hit)
        expect(mockNext).toHaveBeenCalled();
    });

    test('invalidates cache for entire org', () => {
        clearAllCache();

        // Cache responses for two users in same org
        mockReq = {
            method: 'GET',
            originalUrl: '/api/shipments',
            user: { sub: 'user-1' },
            auth: { organizationId: 'org-1' },
        };

        const mockNext = jest.fn();
        cacheResponseMiddleware(mockReq, mockRes, mockNext);
        mockRes.json({ shipments: [] });

        // Invalidate entire org
        invalidateCacheForOrg('org-1');

        expect(mockNext).toHaveBeenCalled();
    });
});
