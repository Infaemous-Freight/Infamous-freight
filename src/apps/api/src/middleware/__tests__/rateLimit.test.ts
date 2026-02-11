import type { NextFunction, Request, Response } from "express";

function createResponse() {
  const headers = new Map<string, string | number>();
  return {
    statusCode: 200,
    body: undefined as unknown,
    setHeader: jest.fn((name: string, value: string | number) => {
      headers.set(name, value);
    }),
    status: jest.fn(function (this: any, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function (this: any, payload: unknown) {
      this.body = payload;
      return this;
    }),
    getHeader: (name: string) => headers.get(name),
  };
}

describe("rateLimit", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("falls back to defaults when env values are non-numeric", async () => {
    process.env.SALES_LEAD_CAPTURE_MAX_REQUESTS = "not-a-number";
    process.env.SALES_LEAD_CAPTURE_WINDOW_MS = "NaN";

    const { rateLimit } = await import("../rateLimit");

    const req = { ip: "1.2.3.4" } as Request;
    const next = jest.fn() as NextFunction;

    for (let i = 0; i < 100; i += 1) {
      const res = createResponse() as unknown as Response;
      rateLimit(req, res, next);
      expect(res.status).not.toHaveBeenCalledWith(429);
    }

    const blockedRes = createResponse() as unknown as Response;
    rateLimit(req, blockedRes, next);
    expect((blockedRes as any).status).toHaveBeenCalledWith(429);
  });

  test("clamps minimum env values to keep limiter active", async () => {
    process.env.SALES_LEAD_CAPTURE_MAX_REQUESTS = "0";
    process.env.SALES_LEAD_CAPTURE_WINDOW_MS = "0";

    const { rateLimit } = await import("../rateLimit");

    const req = { ip: "5.6.7.8" } as Request;
    const next = jest.fn() as NextFunction;

    const firstRes = createResponse() as unknown as Response;
    rateLimit(req, firstRes, next);
    expect((firstRes as any).status).not.toHaveBeenCalledWith(429);

    const secondRes = createResponse() as unknown as Response;
    rateLimit(req, secondRes, next);
    expect((secondRes as any).status).toHaveBeenCalledWith(429);
  });
});
