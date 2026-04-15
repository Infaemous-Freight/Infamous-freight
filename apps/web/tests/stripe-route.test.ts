import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";

const createSession = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    checkout: {
      sessions: {
        create: createSession,
      },
    },
  }),
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

describe("Stripe checkout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.JWT_SECRET;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("returns 401 when authorization header is missing", async () => {
    const { POST } = await import("../app/api/stripe/route");
    const req = new Request("http://localhost/api/stripe", {
      method: "POST",
      body: JSON.stringify({ priceId: "price_abc123" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("returns 500 when JWT secret is missing", async () => {
    const { POST } = await import("../app/api/stripe/route");
    const req = new Request("http://localhost/api/stripe", {
      method: "POST",
      body: JSON.stringify({ priceId: "price_abc123" }),
      headers: {
        authorization: "Bearer token",
        "content-type": "application/json",
      },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain("JWT_SECRET");
    expect(createSession).not.toHaveBeenCalled();
  });

  it("returns 400 when priceId is invalid", async () => {
    process.env.JWT_SECRET = "test-secret";
    (jwt.verify as ReturnType<typeof vi.fn>).mockReturnValue({ sub: "user_1" });

    const { POST } = await import("../app/api/stripe/route");
    const req = new Request("http://localhost/api/stripe", {
      method: "POST",
      body: JSON.stringify({ priceId: "invalid" }),
      headers: {
        authorization: "Bearer token",
        "content-type": "application/json",
      },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("creates checkout session when request is valid", async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.NEXT_PUBLIC_APP_URL = "https://www.infamousfreight.com/";
    (jwt.verify as ReturnType<typeof vi.fn>).mockReturnValue({
      sub: "user_123",
      companyId: "company_456",
      email: "ops@infamousfreight.com",
    });
    createSession.mockResolvedValue({ url: "https://checkout.stripe.com/session/test" });

    const { POST } = await import("../app/api/stripe/route");
    const req = new Request("http://localhost/api/stripe", {
      method: "POST",
      body: JSON.stringify({ priceId: "price_abc123" }),
      headers: {
        authorization: "Bearer token",
        "content-type": "application/json",
      },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe("https://checkout.stripe.com/session/test");
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: "https://www.infamousfreight.com/dashboard",
        cancel_url: "https://www.infamousfreight.com/pricing",
        customer_email: "ops@infamousfreight.com",
        metadata: {
          userId: "user_123",
          companyId: "company_456",
        },
      }),
    );
  });
});
