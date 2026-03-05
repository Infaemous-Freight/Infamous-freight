// Test environment setup
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-for-jwt-validation-min-32-chars-required";
process.env.CORS_ORIGINS = "http://localhost:3000";
process.env.LOG_LEVEL = "error";
process.env.PERSISTENCE_MODE = "json";
process.env.API_BASE_URL = "http://localhost:4000";
process.env.WEB_BASE_URL = "http://localhost:3000";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Polyfill global for Node.js environment
if (typeof global === "undefined") {
  var global = globalThis;
}

// Mock Sentry to avoid external calls during tests
jest.mock("@sentry/node", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setContext: jest.fn(),
  setUser: jest.fn(),
  Handlers: {
    requestHandler: () => (req, res, next) => next(),
    errorHandler: () => (err, req, res, next) => next(err),
  },
}));

// Mock @infamous-freight/shared first before other mocks
jest.mock("@infamous-freight/shared", () => ({
  ApiResponse: class {
    constructor(config) {
      Object.assign(this, { success: true, ...config });
    }
  },
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
  SHIPMENT_STATUSES: {
    PENDING: "pending",
    IN_TRANSIT: "in_transit",
    DELIVERED: "delivered",
    CANCELED: "canceled",
  },
  validateScope: jest.fn(() => true),
  hasScope: jest.fn(() => true),
  hasAllScopes: jest.fn(() => true),
}));

global.__PRISMA_MOCK__ = global.__PRISMA_MOCK__ || {};
global.__PRISMA_MOCK__.$on = global.__PRISMA_MOCK__.$on || jest.fn();

// Mock external services
jest.mock("../src/services/aiSyntheticClient", () => ({
  processCommand: jest.fn().mockResolvedValue({ result: "mocked response" }),
}));

jest.mock("../src/services/cache", () => ({
  getStats: jest.fn().mockResolvedValue({ type: "memory", hits: 0, misses: 0 }),
  initializeRedis: jest.fn().mockResolvedValue(),
}));

jest.mock("../src/services/websocket", () => ({
  getConnectedClientsCount: jest.fn().mockReturnValue(0),
  emitShipmentUpdate: jest.fn(),
  initializeWebSocket: jest.fn(),
}));

jest.mock("../src/services/export", () => ({
  exportToCSV: jest.fn().mockReturnValue("id,reference\n1,TEST-001"),
  exportToPDF: jest.fn().mockResolvedValue(Buffer.from("PDF")),
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
