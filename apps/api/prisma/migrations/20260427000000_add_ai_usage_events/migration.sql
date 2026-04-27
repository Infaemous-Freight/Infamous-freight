-- CreateTable
CREATE TABLE "AiUsageEvent" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "actionCount" INTEGER NOT NULL DEFAULT 1,
    "documentScans" INTEGER NOT NULL DEFAULT 0,
    "voiceMinutes" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageEvent_carrierId_idempotencyKey_key" ON "AiUsageEvent"("carrierId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "AiUsageEvent_carrierId_createdAt_idx" ON "AiUsageEvent"("carrierId", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageEvent_feature_idx" ON "AiUsageEvent"("feature");

-- AddForeignKey
ALTER TABLE "AiUsageEvent" ADD CONSTRAINT "AiUsageEvent_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
