-- CreateIndex for Users table
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex for Drivers table
CREATE INDEX IF NOT EXISTS "drivers_email_idx" ON "drivers"("email");
CREATE INDEX IF NOT EXISTS "drivers_status_idx" ON "drivers"("status");
CREATE INDEX IF NOT EXISTS "drivers_createdAt_idx" ON "drivers"("createdAt");

-- CreateIndex for Shipments table (most critical for queries)
CREATE INDEX IF NOT EXISTS "shipments_trackingId_idx" ON "shipments"("trackingId");
CREATE INDEX IF NOT EXISTS "shipments_status_idx" ON "shipments"("status");
CREATE INDEX IF NOT EXISTS "shipments_driverId_idx" ON "shipments"("driverId");
CREATE INDEX IF NOT EXISTS "shipments_createdAt_idx" ON "shipments"("createdAt");
CREATE INDEX IF NOT EXISTS "shipments_updatedAt_idx" ON "shipments"("updatedAt");

-- Composite index for common shipment queries (status + createdAt)
CREATE INDEX IF NOT EXISTS "shipments_status_createdAt_idx" ON "shipments"("status", "createdAt" DESC);

-- CreateIndex for AiEvents table
CREATE INDEX IF NOT EXISTS "ai_events_userId_idx" ON "ai_events"("userId");
CREATE INDEX IF NOT EXISTS "ai_events_provider_idx" ON "ai_events"("provider");
CREATE INDEX IF NOT EXISTS "ai_events_createdAt_idx" ON "ai_events"("createdAt");

-- CreateIndex for Payments table
CREATE INDEX IF NOT EXISTS "payments_userId_idx" ON "payments"("userId");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "payments_stripePaymentIntentId_idx" ON "payments"("stripePaymentIntentId");
CREATE INDEX IF NOT EXISTS "payments_createdAt_idx" ON "payments"("createdAt");

-- Composite index for revenue calculations
CREATE INDEX IF NOT EXISTS "payments_userId_status_createdAt_idx" ON "payments"("userId", "status", "createdAt" DESC);

-- CreateIndex for Subscriptions table
CREATE INDEX IF NOT EXISTS "subscriptions_userId_idx" ON "subscriptions"("userId");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "subscriptions_stripeSubscriptionId_idx" ON "subscriptions"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "subscriptions_createdAt_idx" ON "subscriptions"("createdAt");

-- CreateIndex for StripeCustomers table
CREATE INDEX IF NOT EXISTS "stripe_customers_userId_idx" ON "stripe_customers"("userId");
CREATE INDEX IF NOT EXISTS "stripe_customers_stripeCustomerId_idx" ON "stripe_customers"("stripeCustomerId");
