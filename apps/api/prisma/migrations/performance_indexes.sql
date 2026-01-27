-- CreateIndex for shipments user_id + status combo
CREATE INDEX "idx_shipments_user_status" ON "shipments"("userId", "status");

-- CreateIndex for recent shipments (descending)
CREATE INDEX "idx_shipments_created_desc" ON "shipments"("createdAt" DESC);

-- CreateIndex for payments user_id + status combo
CREATE INDEX "idx_payments_user_status" ON "payments"("userId", "status");

-- CreateIndex for AI events by user
CREATE INDEX "idx_ai_events_user_created" ON "ai_events"("userId", "createdAt" DESC);

-- CreateIndex for subscriptions by user
CREATE INDEX "idx_subscriptions_user_created" ON "subscriptions"("userId", "createdAt" DESC);

-- Analyze statistics (PostgreSQL)
ANALYZE;
