-- Add atomic claim metadata to loads
ALTER TABLE "Load"
  ADD COLUMN IF NOT EXISTS "claimedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3);
