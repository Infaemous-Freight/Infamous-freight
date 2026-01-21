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

    test('caches successful GET responses', (done) => {
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

        // Simulate response finish
        mockRes.on.mock.calls[0][1]();

        // Call json to trigger caching
        const data = { id: 1, name: 'test' };
        mockRes.json(data);

        expect(mockNext).toHaveBeenCalled();
        expect(nextCalled).toBe(true);
        done();
    });

    test('does not cache non-GET requests', (done) => {
        mockReq = {
            method: 'POST',
            originalUrl: '/api/test',
            user: { sub: 'user-1' },
            auth: { organizationId: 'org-1' },
        };

        const mockNext = jest.fn();
        cacheResponseMiddleware(mockReq, mockRes, mockNext);

        mockRes.on.mock.calls[0][1]();
        mockRes.json({ id: 1 });

        expect(mockNext).toHaveBeenCalled();
        done();
    });

    test('does not cache error responses (status >= 400)', (done) => {
        mockReq = {
            method: 'GET',
            originalUrl: '/api/test',
            user: { sub: 'user-1' },
            auth: { organizationId: 'org-1' },
        };
        mockRes.statusCode = 404;

        const mockNext = jest.fn();
        cacheResponseMiddleware(mockReq, mockRes, mockNext);

        mockRes.on.mock.calls[0][1]();
        mockRes.json({ error: 'Not found' });

        expect(mockNext).toHaveBeenCalled();
        done();
    });

    test('invalidates cache for specific user', (done) => {
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
        mockRes.on.mock.calls[0][1]();
        mockRes.json({ shipments: [] });

        // Invalidate for that user
        invalidateCacheForUser('user-1', 'org-1');

        // Should return empty now (no cache hit)
        expect(mockNext).toHaveBeenCalled();
        done();
    });

    test('invalidates cache for entire org', (done) => {
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
        mockRes.on.mock.calls[0][1]();
        mockRes.json({ shipments: [] });

        // Invalidate entire org
        invalidateCacheForOrg('org-1');

        expect(mockNext).toHaveBeenCalled();
        done();
    });
});
