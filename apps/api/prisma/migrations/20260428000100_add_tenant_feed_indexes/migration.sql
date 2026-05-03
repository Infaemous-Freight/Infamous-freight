-- Improve tenant-scoped list query performance for high-volume tables.
CREATE INDEX IF NOT EXISTS "Driver_carrierId_createdAt_idx" ON "Driver"("carrierId", "createdAt");
CREATE INDEX IF NOT EXISTS "Driver_carrierId_status_idx" ON "Driver"("carrierId", "status");

CREATE INDEX IF NOT EXISTS "Load_carrierId_createdAt_idx" ON "Load"("carrierId", "createdAt");
CREATE INDEX IF NOT EXISTS "Load_carrierId_status_idx" ON "Load"("carrierId", "status");
