#!/usr/bin/env bash
set -euo pipefail

# Wrapper: orchestrates existing repo operations scripts in recommended order.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -x "./scripts/05_run_all_recommended_checks.sh" ]]; then
  ./scripts/05_run_all_recommended_checks.sh "$@"
else
  echo "warning: scripts/05_run_all_recommended_checks.sh not found/executable; skipping."
fi

if [[ -x "./scripts/fly-sync-validate-deploy.sh" ]]; then
  ./scripts/fly-sync-validate-deploy.sh "$@"
else
  echo "warning: scripts/fly-sync-validate-deploy.sh not found/executable; skipping."
fi

if [[ -x "./scripts/production-canonical-env.sh" ]]; then
  ./scripts/production-canonical-env.sh
else
  echo "warning: scripts/production-canonical-env.sh not found/executable; skipping."
fi

cat <<'EOF'

Manual Supabase step required:
  1) Run supabase/sql/001_supabase_security_hardening_safe.sql
  2) Run supabase/sql/002_supabase_audit_queries.sql

EOF
