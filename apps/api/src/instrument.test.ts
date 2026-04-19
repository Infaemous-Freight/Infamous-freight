import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const captureExceptionMock = vi.fn();
const initMock = vi.fn();
const processSessionIntegrationMock = vi.fn(() => ({ name: "processSessionIntegration" }));
const getClientMock = vi.fn<() => unknown>(() => null);

vi.mock("@sentry/node", () => ({
  captureException: captureExceptionMock,
  getClient: getClientMock,
  init: initMock,
  processSessionIntegration: processSessionIntegrationMock,
}));

describe("runWithSentryCapture", () => {
  let processOnSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  const originalDsn = process.env.SENTRY_DSN;

  beforeEach(() => {
    vi.resetModules();
    captureExceptionMock.mockReset();
    initMock.mockReset();
    processSessionIntegrationMock.mockReset();
    getClientMock.mockReset();
    getClientMock.mockReturnValue(null);
    initMock.mockImplementation(() => {
      getClientMock.mockReturnValue({});
    });
    processSessionIntegrationMock.mockReturnValue({ name: "processSessionIntegration" });
    process.env.SENTRY_DSN = "https://placeholder@example.invalid/0";
    processOnSpy = vi.spyOn(process, "on").mockImplementation(() => process);
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    processOnSpy.mockRestore();
    consoleWarnSpy.mockRestore();

    if (originalDsn === undefined) {
      delete process.env.SENTRY_DSN;
      return;
    }

    process.env.SENTRY_DSN = originalDsn;
  });

  it("captures and rethrows sync errors", async () => {
    const { runWithSentryCapture } = await import("./instrument.js");
    const error = new Error("sync boom");

    expect(() =>
      runWithSentryCapture(() => {
        throw error;
      }),
    ).toThrow(error);

    expect(captureExceptionMock).toHaveBeenCalledWith(error);
    expect(initMock).toHaveBeenCalledTimes(1);
    expect(processSessionIntegrationMock).toHaveBeenCalledTimes(1);
  });

  it("captures and rethrows async errors", async () => {
    const { runWithSentryCapture } = await import("./instrument.js");
    const error = new Error("async boom");

    await expect(
      runWithSentryCapture(async () => {
        throw error;
      }),
    ).rejects.toThrow(error);

    expect(captureExceptionMock).toHaveBeenCalledWith(error);
  });

  it("does not capture errors when SENTRY_DSN is invalid", async () => {
    process.env.SENTRY_DSN = "sntryu_invalid-token";
    const { runWithSentryCapture } = await import("./instrument.js");
    const error = new Error("invalid dsn should disable sentry");

    expect(() =>
      runWithSentryCapture(() => {
        throw error;
      }),
    ).toThrow(error);

    expect(captureExceptionMock).not.toHaveBeenCalled();
    expect(initMock).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "SENTRY_DSN appears to be a Sentry auth token, not a DSN; error reporting is disabled.",
    );
  });

  it("warns about invalid DSN in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.SENTRY_DSN = "not-a-dsn";
    initMock.mockImplementation(() => {
      throw new Error("invalid dsn");
    });
    await import("./instrument.js");

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Sentry initialization failed; error reporting is disabled.",
    );
  });

  it("does not initialize Sentry when no DSN is configured", async () => {
    delete process.env.SENTRY_DSN;
    await import("./instrument.js");

    expect(initMock).not.toHaveBeenCalled();
  });

  it("does not initialize Sentry when DSN is whitespace", async () => {
    process.env.SENTRY_DSN = "   ";
    await import("./instrument.js");

    expect(initMock).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it("does not initialize Sentry when a client already exists", async () => {
    getClientMock.mockReturnValue({ existing: true });
    await import("./instrument.js");

    expect(initMock).not.toHaveBeenCalled();
  });
});
