import { beforeEach, describe, expect, it, vi } from "vitest";

const constructEvent = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    webhooks: {
      constructEvent,
    },
  }),
}));

describe("Stripe webhook route", () => {
  beforeEach(() => {
    constructEvent.mockReset();
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("returns 400 when stripe signature header is missing", async () => {
    const { POST } = await import("../app/api/webhooks/route");
    const req = new Request("http://localhost/api/webhooks", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Missing stripe signature");
  });

  it("returns 503 when webhook secret is not configured", async () => {
    const { POST } = await import("../app/api/webhooks/route");
    const req = new Request("http://localhost/api/webhooks", {
      method: "POST",
      body: "{}",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=1,v1=test",
      },
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await res.text()).toContain("Webhook not configured");
    expect(constructEvent).not.toHaveBeenCalled();
  });

  it("returns 401 for Stripe signature verification failures", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    constructEvent.mockImplementation(() => {
      const err = new Error("bad signature");
      (err as Error & { type?: string }).type = "StripeSignatureVerificationError";
      throw err;
    });

    const { POST } = await import("../app/api/webhooks/route");
    const req = new Request("http://localhost/api/webhooks", {
      method: "POST",
      body: "{}",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=1,v1=test",
      },
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});
