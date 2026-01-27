-- AlterTable: Add userId to Shipment
ALTER TABLE "shipments" ADD COLUMN "userId" TEXT NOT NULL DEFAULT 'unknown';

-- AlterTable: Add foreign key constraint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: For user ownership queries
CREATE INDEX "idx_shipments_user_id" ON "shipments"("userId");

-- CreateIndex: For composite queries (user + status)
CREATE INDEX "idx_shipments_user_status" ON "shipments"("userId", "status");

-- DropIndex: Old driverId index (keep for now)
-- ALTER TABLE "shipments" DROP CONSTRAINT IF EXISTS fk_shipments_driver_id;

-- AddForeignKey: User to AiEvent (if missing)
-- ALTER TABLE "ai_events" ADD CONSTRAINT "ai_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- CreateIndex: For AI event lookups
CREATE INDEX "idx_ai_events_user_id" ON "ai_events"("userId");

-- CreateIndex: For payment lookups
CREATE INDEX "idx_payments_user_id" ON "payments"("userId");

-- CreateIndex: For subscription lookups  
CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions"("userId");
