import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const captureExceptionMock = vi.fn();

vi.mock("@sentry/node", () => ({
  captureException: captureExceptionMock,
  getClient: vi.fn(() => null),
  init: vi.fn(),
}));

describe("runWithSentryCapture", () => {
  let processOnSpy: ReturnType<typeof vi.spyOn>;
  const originalDsn = process.env.SENTRY_DSN;

  beforeEach(() => {
    vi.resetModules();
    captureExceptionMock.mockReset();
    process.env.SENTRY_DSN = "https://placeholder@example.invalid/0";
    processOnSpy = vi.spyOn(process, "on").mockImplementation(() => process);
  });

  afterEach(() => {
    processOnSpy.mockRestore();

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
});
