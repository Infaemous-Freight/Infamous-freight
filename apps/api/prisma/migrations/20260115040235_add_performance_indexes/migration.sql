-- CreateIndex: Shipments user + status (common query)
CREATE INDEX "idx_shipments_user_status_new" ON "shipments"("userId", "status");

-- CreateIndex: Recent shipments first
CREATE INDEX "idx_shipments_created_desc" ON "shipments"("createdAt" DESC);

-- CreateIndex: Payments user + status (billing queries)
CREATE INDEX "idx_payments_user_status" ON "payments"("userId", "status");

-- CreateIndex: AI events by user and created
CREATE INDEX "idx_ai_events_user_created" ON "ai_events"("userId", "createdAt" DESC);

-- CreateIndex: Subscriptions by user and created
CREATE INDEX "idx_subscriptions_user_created" ON "subscriptions"("userId", "createdAt" DESC);

-- Analyze: PostgreSQL statistics
ANALYZE;
