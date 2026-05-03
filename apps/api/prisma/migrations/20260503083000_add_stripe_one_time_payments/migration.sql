CREATE TABLE "StripeOneTimePayment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amountTotal" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "purchaseType" TEXT NOT NULL,
    "priceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeOneTimePayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StripeOneTimePayment_stripeCheckoutSessionId_key" ON "StripeOneTimePayment"("stripeCheckoutSessionId");
CREATE INDEX "StripeOneTimePayment_carrierId_createdAt_idx" ON "StripeOneTimePayment"("carrierId", "createdAt");
CREATE INDEX "StripeOneTimePayment_purchaseType_idx" ON "StripeOneTimePayment"("purchaseType");
CREATE INDEX "StripeOneTimePayment_status_idx" ON "StripeOneTimePayment"("status");
CREATE INDEX "StripeOneTimePayment_eventId_idx" ON "StripeOneTimePayment"("eventId");

ALTER TABLE "StripeOneTimePayment" ADD CONSTRAINT "StripeOneTimePayment_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
