const compression = require('compression');
const { compressionMiddleware } = require('../../src/middleware/performance');

jest.mock('compression', () => {
    return jest.fn(() => {
        return (req, res, next) => {
            // Mock compression middleware
            res.compress = jest.fn();
            next();
        };
    });
});

describe('Performance Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            headers: {},
            method: 'GET',
            url: '/api/test',
        };
        res = {
            compress: jest.fn(),
            writeHead: jest.fn(),
            end: jest.fn(),
            on: jest.fn(),
        };
        next = jest.fn();
    });

    describe('compressionMiddleware', () => {
        it('should be defined', () => {
            expect(compressionMiddleware).toBeDefined();
            expect(typeof compressionMiddleware).toBe('function');
        });

        it('should be a valid Express middleware', () => {
            expect(compressionMiddleware.length).toBeGreaterThanOrEqual(3);
        });

        it('should handle requests with compression', () => {
            compressionMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should be exported as part of the module', () => {
            expect(compressionMiddleware).toBeDefined();
        });

        it('should work with different HTTP methods', () => {
            ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
                req.method = method;
                compressionMiddleware(req, res, next);
                expect(next).toHaveBeenCalled();
            });
        });

        it('should work with various content types', () => {
            const contentTypes = ['application/json', 'text/html', 'application/javascript'];

            contentTypes.forEach(type => {
                req.headers['content-type'] = type;
                compressionMiddleware(req, res, next);
                expect(next).toHaveBeenCalled();
            });
        });
    });

    describe('compression configuration', () => {
        it('should be instance of compression middleware', () => {
            expect(compression).toHaveBeenCalled();
        });

        it('should be callable as middleware function', () => {
            const result = compressionMiddleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});
