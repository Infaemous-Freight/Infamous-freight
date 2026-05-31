#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required_files=(
  "docs/LAUNCH_EVIDENCE_LOG.md"
  "docs/BACKUP_RESTORE_VERIFICATION.md"
  "docs/STRIPE_LIVE_BILLING_VERIFICATION.md"
  "docs/FLY-RUNTIME-OPERATIONS.md"
  "docs/PRODUCTION_SMOKE_TESTING.md"
  "docs/OBSERVABILITY.md"
  "docs/ROLLBACK_PLAN.md"
  "docs/production-operations/LAUNCH_CHECKLIST.md"
)

required_scripts=(
  "scripts/production-smoke-test.sh"
  "scripts/capture-netlify-launch-evidence.sh"
  "scripts/verify-stripe-live-billing.mjs"
  "scripts/production-prisma-migrate-deploy.sh"
  "scripts/backup-postgres.sh"
  "scripts/restore-postgres.sh"
)

echo "Infamous Freight production approval gates"
echo
echo "This command checks that the repo contains the non-secret launch gate runbooks and scripts."
echo "It does not contact Stripe, Fly.io, Netlify, Supabase, or the production database."
echo

missing=0

echo "Required runbooks:"
for path in "${required_files[@]}"; do
  if [[ -f "${repo_root}/${path}" ]]; then
    echo "  OK   ${path}"
  else
    echo "  MISS ${path}"
    missing=1
  fi
done

echo
echo "Required helper scripts:"
for path in "${required_scripts[@]}"; do
  if [[ -f "${repo_root}/${path}" ]]; then
    echo "  OK   ${path}"
  else
    echo "  MISS ${path}"
    missing=1
  fi
done

echo
cat <<'EOF'
Launch approval remains blocked until an authenticated operator records evidence for every gate:

1. Production database migration status, reachability, and backup/restore verification.
2. Stripe live-mode account, catalog, checkout, webhook, portal, and app-state verification.
3. Fly.io authenticated diagnostics, runtime secret-name review, checks, logs, and process health.
4. Full end-to-end smoke test: register, login, create load, assign driver, track shipment, generate invoice, pay invoice, customer portal, logout.
5. Observability proof: error monitoring, log retention, alerting, and incident response path.
6. Owner sign-off that accepts residual risk and approves rollback procedure.

Record non-secret evidence in docs/LAUNCH_EVIDENCE_LOG.md or a dated file under docs/launch-evidence/.
Never paste secret values, customer PII, full Checkout URLs, JWTs, tokens, or private database output.
EOF

if [[ "${missing}" != "0" ]]; then
  echo
  echo "One or more launch gate files are missing." >&2
  exit 1
fi
