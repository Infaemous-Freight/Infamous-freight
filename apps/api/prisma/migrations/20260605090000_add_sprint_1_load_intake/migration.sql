-- Sprint 1 load intake automation: accepted intake records and dispatcher queue.

CREATE TABLE "LoadIntake" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'api',
    "status" TEXT NOT NULL DEFAULT 'accepted',
    "priorityScore" INTEGER NOT NULL,
    "priorityLevel" TEXT NOT NULL,
    "priorityReasons" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadIntake_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DispatcherNotificationQueue" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "intakeId" TEXT,
    "type" TEXT NOT NULL,
    "priorityLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "payload" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatcherNotificationQueue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LoadIntake_loadId_key" ON "LoadIntake"("loadId");
CREATE INDEX "LoadIntake_carrierId_createdAt_idx" ON "LoadIntake"("carrierId", "createdAt");
CREATE INDEX "LoadIntake_carrierId_priorityLevel_status_idx" ON "LoadIntake"("carrierId", "priorityLevel", "status");
CREATE INDEX "LoadIntake_loadId_idx" ON "LoadIntake"("loadId");
CREATE INDEX "DispatcherNotificationQueue_carrierId_status_availableAt_idx" ON "DispatcherNotificationQueue"("carrierId", "status", "availableAt");
CREATE INDEX "DispatcherNotificationQueue_carrierId_priorityLevel_createdAt_idx" ON "DispatcherNotificationQueue"("carrierId", "priorityLevel", "createdAt");
CREATE INDEX "DispatcherNotificationQueue_loadId_idx" ON "DispatcherNotificationQueue"("loadId");
CREATE INDEX "DispatcherNotificationQueue_intakeId_idx" ON "DispatcherNotificationQueue"("intakeId");

ALTER TABLE "LoadIntake" ADD CONSTRAINT "LoadIntake_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadIntake" ADD CONSTRAINT "LoadIntake_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DispatcherNotificationQueue" ADD CONSTRAINT "DispatcherNotificationQueue_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DispatcherNotificationQueue" ADD CONSTRAINT "DispatcherNotificationQueue_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DispatcherNotificationQueue" ADD CONSTRAINT "DispatcherNotificationQueue_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "LoadIntake"("id") ON DELETE SET NULL ON UPDATE CASCADE;
