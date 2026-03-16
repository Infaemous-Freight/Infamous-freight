import { describe, it, expect, vi, afterEach } from "vitest";
import { logger, requestLogger, requestIdMiddleware, httpLoggerMiddleware } from "./logger.js";

describe("logger", () => {
  it("exports a pino logger instance", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });
});

describe("requestLogger", () => {
  it("returns a child logger with the given context", () => {
    const childSpy = vi.spyOn(logger, "child");
    const context = { tenantId: "t-1", requestId: "r-1", userId: "u-1", route: "/test" };
    const child = requestLogger(context);
    expect(childSpy).toHaveBeenCalledWith(context);
    expect(child).toBeDefined();
    childSpy.mockRestore();
  });

  it("accepts partial context", () => {
    const child = requestLogger({ tenantId: "t-2" });
    expect(child).toBeDefined();
  });
});

describe("requestIdMiddleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates a new requestId when x-request-id header is absent", () => {
    const req: any = { headers: {} };
    const res: any = { setHeader: vi.fn() };
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    expect(req.headers["x-request-id"]).toBeDefined();
    expect(typeof req.headers["x-request-id"]).toBe("string");
    expect(req.requestId).toBe(req.headers["x-request-id"]);
    expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", req.requestId);
    expect(next).toHaveBeenCalledOnce();
  });

  it("reuses an existing x-request-id header when it is a valid UUID", () => {
    const existingId = "550e8400-e29b-41d4-a716-446655440000";
    const req: any = { headers: { "x-request-id": existingId } };
    const res: any = { setHeader: vi.fn() };
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBe(existingId);
    expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", existingId);
    expect(next).toHaveBeenCalledOnce();
  });

  it("generates a new UUID when x-request-id header is not a valid UUID", () => {
    const req: any = { headers: { "x-request-id": "../../etc/passwd" } };
    const res: any = { setHeader: vi.fn() };
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    expect(req.requestId).not.toBe("../../etc/passwd");
    expect(req.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

describe("httpLoggerMiddleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs HTTP requests with info level on success", () => {
    const infoSpy = vi.spyOn(logger, "info").mockImplementation(() => logger);
    const finishCallbacks: Array<() => void> = [];
    const req: any = {
      requestId: "req-abc",
      method: "GET",
      path: "/api/shipments",
      headers: { "user-agent": "test-agent" },
      ip: "127.0.0.1",
    };
    const res: any = {
      statusCode: 200,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === "finish") finishCallbacks.push(cb);
      }),
    };
    const next = vi.fn();

    httpLoggerMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();

    finishCallbacks[0]();

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "req-abc",
        method: "GET",
        path: "/api/shipments",
        statusCode: 200,
      }),
      "HTTP request",
    );
  });

  it("logs HTTP requests with warn level on 4xx", () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => logger);
    const finishCallbacks: Array<() => void> = [];
    const req: any = {
      method: "GET",
      path: "/api/missing",
      headers: {},
      ip: "127.0.0.1",
    };
    const res: any = {
      statusCode: 404,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === "finish") finishCallbacks.push(cb);
      }),
    };
    const next = vi.fn();

    httpLoggerMiddleware(req, res, next);
    finishCallbacks[0]();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 }),
      "HTTP request",
    );
  });

  it("logs HTTP requests with error level on 5xx", () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => logger);
    const finishCallbacks: Array<() => void> = [];
    const req: any = {
      method: "POST",
      path: "/api/shipments",
      headers: {},
      ip: "127.0.0.1",
    };
    const res: any = {
      statusCode: 500,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === "finish") finishCallbacks.push(cb);
      }),
    };
    const next = vi.fn();

    httpLoggerMiddleware(req, res, next);
    finishCallbacks[0]();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500 }),
      "HTTP request",
    );
  });
});
