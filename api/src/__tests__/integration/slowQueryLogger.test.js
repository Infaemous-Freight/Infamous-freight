/**
 * Integration test for slow query logging.
 * Verifies that queries exceeding SLOW_QUERY_THRESHOLD_MS are logged.
 */

const { logger } = require('../../../src/middleware/logger');
const { attachSlowQueryLogger, SLOW_QUERY_THRESHOLD_MS } = require('../../../src/lib/slowQueryLogger');

describe('Slow query logger', () => {
    let mockPrisma;
    let logWarnSpy;

    beforeEach(() => {
        logWarnSpy = jest.spyOn(logger, 'warn').mockImplementation();
        mockPrisma = {
            $on: jest.fn((event, callback) => {
                mockPrisma._queryCallback = callback;
            }),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('logs queries slower than threshold', () => {
        attachSlowQueryLogger(mockPrisma);

        const slowQueryEvent = {
            query: 'SELECT * FROM users WHERE id = 123 AND name LIKE ?',
            duration: SLOW_QUERY_THRESHOLD_MS + 100,
            params: ['%test%'],
        };

        mockPrisma._queryCallback(slowQueryEvent);

        expect(logWarnSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Slow query detected',
                duration: SLOW_QUERY_THRESHOLD_MS + 100,
                threshold: SLOW_QUERY_THRESHOLD_MS,
            }),
            undefined
        );
    });

    test('does not log fast queries', () => {
        attachSlowQueryLogger(mockPrisma);

        const fastQueryEvent = {
            query: 'SELECT id FROM users LIMIT 10',
            duration: SLOW_QUERY_THRESHOLD_MS - 100,
            params: [],
        };

        mockPrisma._queryCallback(fastQueryEvent);

        expect(logWarnSpy).not.toHaveBeenCalled();
    });

    test('truncates long queries to 200 chars', () => {
        attachSlowQueryLogger(mockPrisma);

        const longQuery = 'SELECT * FROM ' + 'users, ' * 100 + 'orders';
        const queryEvent = {
            query: longQuery,
            duration: SLOW_QUERY_THRESHOLD_MS + 1,
            params: [],
        };

        mockPrisma._queryCallback(queryEvent);

        expect(logWarnSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                query: expect.any(String),
            }),
            undefined
        );
        const callArgs = logWarnSpy.mock.calls[0][0];
        expect(callArgs.query.length).toBeLessThanOrEqual(200);
    });

    test('marks queries > 5s as error level', () => {
        attachSlowQueryLogger(mockPrisma);

        const criticalEvent = {
            query: 'SELECT * FROM huge_table',
            duration: 6000,
            params: [],
        };

        mockPrisma._queryCallback(criticalEvent);

        expect(logWarnSpy).toHaveBeenCalled();
    });
});
