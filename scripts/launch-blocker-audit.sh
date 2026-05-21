#!/usr/bin/env bash
set -euo pipefail

site_url="${LAUNCH_AUDIT_SITE_URL:-${URL:-https://www.infamousfreight.com}}"
api_base="${LAUNCH_AUDIT_API_BASE:-${site_url}}"
netlify_bin="${NETLIFY_BIN:-/opt/buildhome/node-deps/node_modules/.bin/netlify}"

missing=0
failed=0

say() {
  printf '%s\n' "$*"
}

pass() {
  say "PASS $*"
}

warn() {
  say "WARN $*"
}

fail() {
  failed=$((failed + 1))
  say "FAIL $*"
}

require_env() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    pass "${name} is set"
  else
    missing=$((missing + 1))
    fail "${name} is missing"
  fi
}

check_url() {
  local label="$1"
  local url="$2"
  local expected="${3:-200}"
  local status

  status="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 15 "$url" 2>/dev/null || true)"
  if [[ "$status" == "$expected" ]]; then
    pass "${label} returned ${status}"
  else
    fail "${label} returned ${status:-no response}; expected ${expected}"
  fi
}

say "== Infamous Freight Launch Blocker Audit =="
say "Values are never printed; only variable presence and HTTP status are reported."
say ""

say "Core credential presence"
for name in \
  NETLIFY_SITE_ID \
  URL \
  DATABASE_URL \
  STRIPE_SECRET_KEY \
  STRIPE_WEBHOOK_SECRET \
  VITE_STRIPE_PUBLIC_KEY \
  SUPABASE_URL \
  SUPABASE_SERVICE_ROLE_KEY \
  VITE_SUPABASE_URL \
  VITE_SUPABASE_ANON_KEY \
  SENTRY_DSN \
  VITE_SENTRY_DSN
do
  require_env "$name"
done

if [[ -n "${STRIPE_SECRET_KEY:-}" && "${STRIPE_SECRET_KEY}" == sk_test_* ]]; then
  fail "STRIPE_SECRET_KEY appears to be a test key"
fi
if [[ -n "${VITE_STRIPE_PUBLIC_KEY:-}" && "${VITE_STRIPE_PUBLIC_KEY}" == pk_test_* ]]; then
  fail "VITE_STRIPE_PUBLIC_KEY appears to be a test key"
fi

say ""
say "Client-side env exposure"
bash scripts/check-client-env-safety.sh >/dev/null && pass "frontend env safety check passed"

say ""
say "Database migration state"
if [[ -x "$netlify_bin" ]]; then
  "$netlify_bin" db status >/tmp/infamous-freight-netlify-db-status.txt 2>&1 || fail "netlify db status failed"
  if grep -q "Missing on disk" /tmp/infamous-freight-netlify-db-status.txt; then
    fail "Netlify Database reports migrations missing on disk"
  fi
  if grep -q "Pending migrations" /tmp/infamous-freight-netlify-db-status.txt; then
    warn "Netlify Database has pending migrations; deploy must apply them before go-live"
  else
    pass "Netlify Database has no pending migrations"
  fi
else
  warn "Netlify CLI was not available at ${netlify_bin}"
fi

say ""
say "Public production route probes"
check_url "home" "${site_url}/"
check_url "quote page" "${site_url}/request-quote"
check_url "tracking page" "${site_url}/tracking"
check_url "carrier page" "${site_url}/carrier-portal"
check_url "maintenance page" "${site_url}/maintenance.html"

say ""
say "API probes"
check_url "production health" "${api_base}/api/production-health"
check_url "quote estimate API" "${api_base}/api/quotes/estimate?equipment=Dry%20van&miles=750&weight=42000"
check_url "tracking invalid lookup validation" "${api_base}/api/public/shipments/not-a-tracking-number" "400"

say ""
say "Browser audits"
if command -v lighthouse >/dev/null 2>&1; then
  pass "Lighthouse CLI is available"
else
  warn "Lighthouse CLI is not available in this runner"
fi
if command -v npx >/dev/null 2>&1; then
  pass "npx is available for external accessibility or broken-link tooling in CI"
else
  warn "npx is not available"
fi

say ""
say "Summary"
say "Missing required env vars: ${missing}"
say "Failed checks: ${failed}"

if (( missing > 0 || failed > 0 )); then
  exit 1
fi
