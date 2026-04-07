import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma, mockStripeInstance } = vi.hoisted(() => ({
  mockPrisma: {
    payment: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
    loadPayment: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    load: {
      updateMany: vi.fn(),
    },
  },
  mockStripeInstance: {
    paymentIntents: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../db/prisma.js", () => ({ prisma: mockPrisma }));

vi.mock("stripe", () => ({
  // Must use `function` (not arrow) so it can be called with `new`
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  default: function MockStripe() {
    return mockStripeInstance;
  },
}));

// Mock env to ensure STRIPE_SECRET_KEY is set
vi.mock("../config/env.js", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_mock",
    corsOrigin: "http://localhost:3000",
    cookieSecret: "test-secret",
    authCookieEnabled: false,
    avatarStorage: "local",
    avatarUploadDir: "/tmp",
    avatarMaxFileSizeMB: 5,
    avatarAllowedTypes: ["image/jpeg", "image/png"],
    redisUrl: "redis://localhost:6379",
  },
}));

vi.mock("@infamous-freight/shared", () => ({
  PAYMENT_LINKS: {
    BOOKING: "https://checkout.test/booking",
    DISPATCH: "https://checkout.test/dispatch",
    RESERVATION: "https://checkout.test/reservation",
    PREMIUM: "https://checkout.test/premium",
  },
}));

import {
  createGoDaddyRedirectPayment,
  createStripePaymentIntent,
  markPaymentSucceeded,
} from "./payment.service.js";

describe("payment.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createGoDaddyRedirectPayment", () => {
    it("creates a payment record and returns checkoutUrl", async () => {
      mockPrisma.payment.create.mockResolvedValue({ id: "pay-1" });
      mockPrisma.transaction.create.mockResolvedValue({ id: "txn-1" });

      const result = await createGoDaddyRedirectPayment({
        tenantId: "tenant-abc",
        userId: "user-1",
        type: "BOOKING",
        amount: 500,
      });

      expect(mockPrisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: "tenant-abc",
            provider: "godaddy_link",
            status: "PENDING",
            amount: 500,
          }),
        }),
      );
      expect(mockPrisma.transaction.create).toHaveBeenCalledTimes(1);
      expect(result.paymentId).toBe("pay-1");
      expect(result.checkoutUrl).toBeDefined();
    });

    it("creates a LoadPayment record when loadId is provided", async () => {
      mockPrisma.payment.create.mockResolvedValue({ id: "pay-2" });
      mockPrisma.transaction.create.mockResolvedValue({});
      mockPrisma.loadPayment.create.mockResolvedValue({});

      await createGoDaddyRedirectPayment({
        tenantId: "tenant-abc",
        userId: "user-1",
        loadId: "load-99",
        type: "BOOKING",
        amount: 300,
      });

      expect(mockPrisma.loadPayment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            loadId: "load-99",
            paymentId: "pay-2",
            tenantId: "tenant-abc",
          }),
        }),
      );
    });

    it("does not create a LoadPayment record when loadId is absent", async () => {
      mockPrisma.payment.create.mockResolvedValue({ id: "pay-3" });
      mockPrisma.transaction.create.mockResolvedValue({});

      await createGoDaddyRedirectPayment({
        tenantId: "tenant-abc",
        type: "BOOKING",
        amount: 100,
      });

      expect(mockPrisma.loadPayment.create).not.toHaveBeenCalled();
    });
  });

  describe("createStripePaymentIntent", () => {
    it("creates a Stripe intent and saves payment + transaction", async () => {
      mockStripeInstance.paymentIntents.create.mockResolvedValue({
        id: "pi_test_123",
        client_secret: "pi_test_123_secret",
        status: "requires_payment_method",
      });
      mockPrisma.payment.create.mockResolvedValue({ id: "pay-stripe-1" });
      mockPrisma.transaction.create.mockResolvedValue({});

      const result = await createStripePaymentIntent({
        tenantId: "tenant-abc",
        userId: "user-1",
        amount: 150.5,
        currency: "usd",
        idempotencyKey: "idem-1",
      });

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 15050, // 150.5 * 100 rounded
          currency: "usd",
        }),
        { idempotencyKey: "idem-1" },
      );
      expect(mockPrisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: "tenant-abc",
            provider: "stripe",
            externalId: "pi_test_123",
            status: "REQUIRES_PAYMENT_METHOD",
          }),
        }),
      );
      expect(result.intentId).toBe("pi_test_123");
      expect(result.clientSecret).toBe("pi_test_123_secret");
    });

    it("defaults currency to usd", async () => {
      mockStripeInstance.paymentIntents.create.mockResolvedValue({
        id: "pi_def",
        client_secret: "secret",
        status: "requires_payment_method",
      });
      mockPrisma.payment.create.mockResolvedValue({ id: "pay-def" });
      mockPrisma.transaction.create.mockResolvedValue({});

      await createStripePaymentIntent({
        tenantId: "t",
        amount: 50,
        idempotencyKey: "idem-2",
      });

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({ currency: "usd" }),
        { idempotencyKey: "idem-2" },
      );
    });
  });

  describe("markPaymentSucceeded", () => {
    it("updates payment and transaction status to SUCCEEDED", async () => {
      mockPrisma.payment.findMany.mockResolvedValue([{ id: "pay-1", tenantId: "t", loadId: null }]);
      mockPrisma.payment.update.mockResolvedValue({ id: "pay-1", status: "PAID" });
      mockPrisma.transaction.create.mockResolvedValue({});

      const result = await markPaymentSucceeded({
        stripePaymentIntentId: "pi_test_456",
        rawEvent: { type: "payment_intent.succeeded" },
      });

      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "pay-1" },
          data: { status: "PAID" },
        }),
      );
      expect(result?.status).toBe("PAID");
    });

    it("returns null when no matching payment is found", async () => {
      mockPrisma.payment.findMany.mockResolvedValue([]);

      const result = await markPaymentSucceeded({
        stripePaymentIntentId: "pi_not_found",
        rawEvent: {},
      });

      expect(result).toBeNull();
    });

    it("returns null when multiple payments found (ambiguous reconciliation)", async () => {
      mockPrisma.payment.findMany.mockResolvedValue([{ id: "pay-a" }, { id: "pay-b" }]);

      const result = await markPaymentSucceeded({
        stripePaymentIntentId: "pi_ambiguous",
        rawEvent: {},
      });

      expect(result).toBeNull();
      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    });

    it("updates load and loadPayment status when loadId is present", async () => {
      mockPrisma.payment.findMany.mockResolvedValue([
        { id: "pay-1", tenantId: "t", loadId: "load-99" },
      ]);
      mockPrisma.payment.update.mockResolvedValue({ id: "pay-1", status: "PAID" });
      mockPrisma.transaction.create.mockResolvedValue({});
      mockPrisma.load.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.loadPayment.updateMany.mockResolvedValue({ count: 1 });

      await markPaymentSucceeded({
        stripePaymentIntentId: "pi_with_load",
        rawEvent: {},
      });

      expect(mockPrisma.load.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "load-99", tenantId: "t" },
          data: { status: "PAID" },
        }),
      );
      expect(mockPrisma.loadPayment.updateMany).toHaveBeenCalledTimes(1);
    });
  });
});
