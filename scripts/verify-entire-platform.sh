#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REPORT_DIR="${REPORT_DIR:-docs/evidence}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_FILE="${REPORT_FILE:-${REPORT_DIR}/platform-verification-${STAMP}.md}"
RUN_PRODUCTION_CHECKS="${RUN_PRODUCTION_CHECKS:-1}"
RUN_BILLING_CHECKS="${RUN_BILLING_CHECKS:-0}"
RUN_BUILD_CHECKS="${RUN_BUILD_CHECKS:-1}"

mkdir -p "$REPORT_DIR"

write() {
  printf '%s\n' "$*" | tee -a "$REPORT_FILE" >/dev/null
}

run_check() {
  local label="$1"
  shift
  write ""
  write "## ${label}"
  write ""
  write '```bash'
  write "$*"
  write '```'
  write ""

  local output_file
  output_file="$(mktemp)"
  if "$@" >"$output_file" 2>&1; then
    write "**Status:** PASS"
    write ""
    write '```text'
    sed -e 's/\r$//' "$output_file" | tail -n 120 | tee -a "$REPORT_FILE" >/dev/null
    write '```'
    rm -f "$output_file"
    return 0
  fi

  write "**Status:** FAIL"
  write ""
  write '```text'
  sed -e 's/\r$//' "$output_file" | tail -n 160 | tee -a "$REPORT_FILE" >/dev/null
  write '```'
  rm -f "$output_file"
  return 1
}

failures=0

write "# Full Platform Verification Evidence"
write ""
write "- Timestamp UTC: ${STAMP}"
write "- Repository: Infaemous-Freight/Infamous-freight"
write "- Host: $(hostname 2>/dev/null || echo unknown)"
write "- Node: $(node --version 2>/dev/null || echo unavailable)"
write "- pnpm: $(pnpm --version 2>/dev/null || echo unavailable)"
write "- Production checks enabled: ${RUN_PRODUCTION_CHECKS}"
write "- Billing checks enabled: ${RUN_BILLING_CHECKS}"
write "- Build checks enabled: ${RUN_BUILD_CHECKS}"
write ""
write "> Do not paste secrets into this file. If a check fails because credentials are missing, record only the secret name, never the value."

run_check "Workspace install verification" pnpm install --frozen-lockfile || failures=$((failures + 1))
run_check "Lint" pnpm run lint || failures=$((failures + 1))
run_check "Typecheck" pnpm run typecheck || failures=$((failures + 1))
run_check "Prisma schema validation" pnpm run prisma:validate || failures=$((failures + 1))
run_check "Tests" pnpm run test || failures=$((failures + 1))

if [[ "$RUN_BUILD_CHECKS" == "1" ]]; then
  run_check "Build" pnpm run build || failures=$((failures + 1))
else
  write ""
  write "## Build"
  write ""
  write "**Status:** SKIPPED — RUN_BUILD_CHECKS=${RUN_BUILD_CHECKS}"
fi

run_check "Strict environment check" pnpm run env:check:strict || failures=$((failures + 1))
run_check "Frontend environment safety" pnpm run env:check:frontend || failures=$((failures + 1))
run_check "Supabase client environment safety" pnpm run env:check:supabase-client || failures=$((failures + 1))
run_check "Production security audit" pnpm run audit:production-security || failures=$((failures + 1))
run_check "Prisma migration status" pnpm run prisma:migrate:status || failures=$((failures + 1))

if [[ "$RUN_PRODUCTION_CHECKS" == "1" ]]; then
  run_check "Production preflight" pnpm run production:preflight || failures=$((failures + 1))
  run_check "Production smoke test" pnpm run production:smoke-test || failures=$((failures + 1))
  run_check "Netlify launch evidence capture" pnpm run production:capture-netlify-evidence || failures=$((failures + 1))
else
  write ""
  write "## Production checks"
  write ""
  write "**Status:** SKIPPED — RUN_PRODUCTION_CHECKS=${RUN_PRODUCTION_CHECKS}"
fi

if [[ "$RUN_BILLING_CHECKS" == "1" ]]; then
  run_check "Stripe live billing verification" pnpm run billing:verify-live || failures=$((failures + 1))
else
  write ""
  write "## Stripe live billing verification"
  write ""
  write "**Status:** SKIPPED — set RUN_BILLING_CHECKS=1 only during an approved live billing verification window."
fi

write ""
write "# Final Result"
write ""
if [[ "$failures" -eq 0 ]]; then
  write "**Overall Status:** PASS"
else
  write "**Overall Status:** FAIL"
  write ""
  write "Failures: ${failures}"
fi
write ""
write "Evidence file: ${REPORT_FILE}"

printf '\nVerification report written to %s\n' "$REPORT_FILE"
exit "$failures"
