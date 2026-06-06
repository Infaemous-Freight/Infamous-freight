import path from 'path';
import { readFileSync } from 'fs';

describe('load intake operations foundation migrations', () => {
  const prismaMigration = readFileSync(
    path.resolve(
      __dirname,
      '../prisma/migrations/20260605000000_add_load_intake_operations_foundation/migration.sql',
    ),
    'utf8',
  );
  const supabaseMigration = readFileSync(
    path.resolve(
      __dirname,
      '../../../supabase/migrations/20260605001000_load_intake_queue_rls.sql',
    ),
    'utf8',
  );

  it('adds durable Genesis scoring metadata to tenant-scoped quote requests', () => {
    expect(prismaMigration).toContain('ALTER TABLE "QuoteRequest"');
    expect(prismaMigration).toContain('"contactEmail" TEXT');
    expect(prismaMigration).toContain('"genesisScore" INTEGER');
    expect(prismaMigration).toContain('"genesisPriority" TEXT');
    expect(prismaMigration).toContain('"genesisReasons" JSONB');
    expect(prismaMigration).toContain('"QuoteRequest_carrierId_status_createdAt_idx"');
  });

  it('creates indexed notification and retry queues scoped by carrier tenant', () => {
    expect(prismaMigration).toContain('CREATE TABLE IF NOT EXISTS "LoadIntakeNotificationQueue"');
    expect(prismaMigration).toContain('CREATE TABLE IF NOT EXISTS "LoadIntakeRetryQueue"');
    expect(prismaMigration).toContain('"LoadIntakeNotificationQueue_carrierId_status_availableAt_idx"');
    expect(prismaMigration).toContain('"LoadIntakeRetryQueue_carrierId_status_availableAt_idx"');
    expect(prismaMigration).toContain('"LoadIntakeNotificationQueue_dedupeKey_key"');
    expect(prismaMigration).toContain('FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id")');
  });

  it('adds Supabase RLS policies based on app metadata carrier claims only', () => {
    expect(supabaseMigration).toContain('ENABLE ROW LEVEL SECURITY');
    expect(supabaseMigration).toContain('load_intake_notification_select_carrier');
    expect(supabaseMigration).toContain('load_intake_retry_select_carrier');
    expect(supabaseMigration).toContain("auth.jwt() -> 'app_metadata' ->> 'carrier_id'");
    expect(supabaseMigration).not.toContain('user_metadata');
  });
});
