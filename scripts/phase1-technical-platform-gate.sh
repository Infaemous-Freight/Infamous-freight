#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_files=(
  "scripts/production-monitor.mjs"
  "deploy/production-monitor.service"
  "scripts/audit-header-auth.sh"
  "docs/PRODUCTION_MONITORING.md"
  "docs/INCIDENT_RESPONSE_RUNBOOK.md"
  "scripts/production-smoke-test.sh"
  "scripts/production-preflight.sh"
  "scripts/production-prisma-migrate-deploy.sh"
  "scripts/backup-postgres.sh"
  "scripts/restore-postgres.sh"
)

missing=0
for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Missing Phase 1 artifact: $file" >&2
    missing=1
  else
    echo "✓ $file"
  fi
done

if [ "$missing" -ne 0 ]; then
  echo "Phase 1 gate failed: missing required artifacts." >&2
  exit 1
fi

bash scripts/audit-header-auth.sh
node scripts/production-monitor.mjs --once --dry-run

echo "Phase 1 technical platform repository gate passed."
