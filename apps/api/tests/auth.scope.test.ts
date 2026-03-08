import { describe, expect, it } from "vitest";
import { requireScope } from "../src/middleware/require-scope.js";

describe("requireScope", () => {
  it("returns 403 when scope missing", () => {
    const mw = requireScope("dispatch.assign");

    let statusCode = 200;
    let payload: unknown;

    const req: any = { auth: { scopes: ["load.read"] } };
    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: unknown) {
        payload = body;
        return this;
      }
    };

    let called = false;
    mw(req, res, () => {
      called = true;
    });

    expect(called).toBe(false);
    expect(statusCode).toBe(403);
    expect(payload).toEqual({
      error: "Forbidden",
      requiredScopes: ["dispatch.assign"]
    });
  });
});
