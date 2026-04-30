const sentryState = { initialized: false };

jest.mock('@sentry/node', () => ({
  init: jest.fn(() => {
    sentryState.initialized = true;
  }),
  getClient: jest.fn(() => (sentryState.initialized ? { id: 'client' } : undefined)),
  captureException: jest.fn(),
}));

describe('sentry configuration', () => {
  const originalDsn = process.env.SENTRY_DSN;
  const originalSentryEnabled = process.env.SENTRY_ENABLED;
  let warnSpy: jest.SpyInstance;

  const loadCreateApp = () => {
    const { createApp } = require('../src/app') as typeof import('../src/app');
    return createApp;
  };

  const loadSentry = () => require('@sentry/node') as { init: jest.Mock };

  beforeEach(() => {
    jest.resetModules();
    sentryState.initialized = false;
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (originalDsn === undefined) {
      delete process.env.SENTRY_DSN;
    } else {
      process.env.SENTRY_DSN = originalDsn;
    }
    if (originalSentryEnabled === undefined) {
      delete process.env.SENTRY_ENABLED;
    } else {
      process.env.SENTRY_ENABLED = originalSentryEnabled;
    }
    jest.clearAllMocks();
    warnSpy.mockRestore();
  });

  it('initializes Sentry when ingest DSN is valid', () => {
    process.env.SENTRY_DSN = 'https://public-key-example@o123456.ingest.us.sentry.io/1234567';

    const createApp = loadCreateApp();
    createApp();

    expect(loadSentry().init).toHaveBeenCalledTimes(1);
  });

  it('does not initialize Sentry when DSN is invalid', () => {
    process.env.SENTRY_DSN = 'invalid-dsn';

    const createApp = loadCreateApp();
    createApp();

    expect(loadSentry().init).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      'Sentry is disabled because SENTRY_DSN is not a valid ingest DSN URL.',
    );
  });

  it('initializes Sentry only once even when createApp is called multiple times', () => {
    process.env.SENTRY_DSN = 'https://public-key-example@o123456.ingest.us.sentry.io/1234567';

    const createApp = loadCreateApp();
    createApp();
    createApp();

    expect(loadSentry().init).toHaveBeenCalledTimes(1);
  });

  it('does not initialize Sentry when explicitly disabled', () => {
    process.env.SENTRY_ENABLED = 'false';
    process.env.SENTRY_DSN = 'https://public-key-example@o123456.ingest.us.sentry.io/1234567';

    const createApp = loadCreateApp();
    createApp();

    expect(loadSentry().init).not.toHaveBeenCalled();
  });
});
