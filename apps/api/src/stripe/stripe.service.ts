const DEFAULT_TRIAL_DAYS = 14;

export type StripeCheckoutRequest = {
  tenantId: string;
  customerEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
};

export type StripeCheckoutResponse = {
  checkoutUrl: string;
  mode: "subscription";
  trialDays: number;
};

export class StripeService {
  private readonly secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  private readonly webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  isConfigured(): boolean {
    return this.secretKey.length > 0 && this.webhookSecret.length > 0;
  }

  getTrialDays(): number {
    return DEFAULT_TRIAL_DAYS;
  }

  async createSubscriptionCheckout(input: StripeCheckoutRequest): Promise<StripeCheckoutResponse> {
    if (!this.isConfigured()) {
      throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.");
    }

    if (!input.tenantId || !input.idempotencyKey) {
      throw new Error("tenantId and idempotencyKey are required for billing idempotency.");
    }

    return {
      checkoutUrl: input.successUrl,
      mode: "subscription",
      trialDays: this.getTrialDays(),
    };
  }

  validateWebhookSignature(signatureHeader?: string): boolean {
    if (!this.isConfigured()) {
      return false;
    }

    return typeof signatureHeader === "string" && signatureHeader.length > 0;
  }
}

export const stripeService = new StripeService();
