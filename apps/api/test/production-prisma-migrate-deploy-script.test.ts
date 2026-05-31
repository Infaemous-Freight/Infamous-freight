import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

describe('production-prisma-migrate-deploy.sh', () => {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const scriptPath = path.join(repoRoot, 'scripts', 'production-prisma-migrate-deploy.sh');

  it('fails closed without DATABASE_URL and does not print secret-like values', () => {
    const result = spawnSync('/usr/bin/bash', [scriptPath], {
      cwd: os.tmpdir(),
      encoding: 'utf8',
      env: {
        PATH: process.env.PATH,
      },
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('DATABASE_URL is not set');
    expect(result.stdout + result.stderr).not.toContain('postgresql://');
  });

  it('runs from the repo root and allows pending pre-deploy migration status', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'production-prisma-migrate-deploy-'));
    const binDir = path.join(tempDir, 'bin');
    const logPath = path.join(tempDir, 'pnpm.log');
    const countPath = path.join(tempDir, 'status-count');
    fs.mkdirSync(binDir);

    fs.writeFileSync(
      path.join(binDir, 'pnpm'),
      `#!/usr/bin/env bash
set -euo pipefail
printf '%s|%s\\n' "$PWD" "$*" >> "$PNPM_LOG"
case "$*" in
  "run prisma:validate")
    exit 0
    ;;
  "-C apps/api exec prisma migrate status --schema prisma/schema.prisma")
    count="0"
    if [[ -f "$STATUS_COUNT" ]]; then
      count="$(cat "$STATUS_COUNT")"
    fi
    count=$((count + 1))
    printf '%s' "$count" > "$STATUS_COUNT"
    if [[ "$count" == "1" ]]; then
      echo "database schema has pending migrations"
      exit 1
    fi
    echo "database schema is up to date"
    exit 0
    ;;
  "-C apps/api exec prisma migrate deploy --schema prisma/schema.prisma")
    echo "deployed pending migrations"
    exit 0
    ;;
esac
echo "unexpected pnpm args: $*" >&2
exit 2
`,
      { mode: 0o755 },
    );

    const result = spawnSync('/usr/bin/bash', [scriptPath], {
      cwd: os.tmpdir(),
      encoding: 'utf8',
      env: {
        PATH: `${binDir}:${process.env.PATH}`,
        PNPM_LOG: logPath,
        STATUS_COUNT: countPath,
        DATABASE_URL: 'postgresql://postgres:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require',
      },
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toContain('Pre-deploy migration status returned non-zero');
    expect(result.stdout).toContain('Production Prisma migration deploy completed');

    const pnpmCalls = fs.readFileSync(logPath, 'utf8').trim().split('\n');
    expect(pnpmCalls).toEqual([
      `${repoRoot}|run prisma:validate`,
      `${repoRoot}|-C apps/api exec prisma migrate status --schema prisma/schema.prisma`,
      `${repoRoot}|-C apps/api exec prisma migrate deploy --schema prisma/schema.prisma`,
      `${repoRoot}|-C apps/api exec prisma migrate status --schema prisma/schema.prisma`,
    ]);
  });
});
