// Test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-validation';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.LOG_LEVEL = 'error';

// Polyfill global for Node.js environment
if (typeof global === 'undefined') {
    var global = globalThis;
}

// Mock Sentry to avoid external calls during tests
jest.mock('@sentry/node', () => ({
    init: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    setContext: jest.fn(),
    setUser: jest.fn(),
    Handlers: {
        requestHandler: () => (req, res, next) => next(),
        errorHandler: () => (err, req, res, next) => next(err),
    },
}));

// Mock external services
jest.mock('../src/services/aiSyntheticClient', () => ({
    processCommand: jest.fn().mockResolvedValue({ result: 'mocked response' }),
}));

jest.mock('../src/services/cache', () => ({
    getStats: jest.fn().mockResolvedValue({ type: 'memory', hits: 0, misses: 0 }),
    initializeRedis: jest.fn().mockResolvedValue(),
}));

jest.mock('../src/services/websocket', () => ({
    getConnectedClientsCount: jest.fn().mockReturnValue(0),
    emitShipmentUpdate: jest.fn(),
    initializeWebSocket: jest.fn(),
}));

jest.mock('../src/services/export', () => ({
    exportToCSV: jest.fn().mockReturnValue('id,reference\n1,TEST-001'),
    exportToPDF: jest.fn().mockResolvedValue(Buffer.from('PDF')),
    exportToJSON: jest.fn().mockReturnValue('{"data":[]}'),
}));

// Suppress console logs during tests
global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
