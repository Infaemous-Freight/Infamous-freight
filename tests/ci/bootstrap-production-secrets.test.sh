#!/usr/bin/env bash
set -euo pipefail

PASS=0
FAIL=0

pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }

assert_contains() {
  local description="$1"
  local haystack="$2"
  local needle="$3"
  if printf '%s' "$haystack" | grep -qF -- "$needle"; then
    pass "$description"
  else
    fail "$description (expected '$needle')"
  fi
}

assert_not_contains() {
  local description="$1"
  local haystack="$2"
  local needle="$3"
  if printf '%s' "$haystack" | grep -qF -- "$needle"; then
    fail "$description (did not expect '$needle')"
  else
    pass "$description"
  fi
}

assert_eq() {
  local description="$1"
  local expected="$2"
  local actual="$3"
  if [ "$expected" = "$actual" ]; then
    pass "$description"
  else
    fail "$description (expected='$expected' got='$actual')"
  fi
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="$ROOT_DIR/scripts/bootstrap-production-secrets.sh"

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

cat > "$TMP_DIR/netlify" <<'NETLIFY'
#!/usr/bin/env bash
echo "netlify $*"
NETLIFY

cat > "$TMP_DIR/flyctl" <<'FLY'
#!/usr/bin/env bash
echo "flyctl $*"
FLY

chmod +x "$TMP_DIR/netlify" "$TMP_DIR/flyctl"

BASE_ENV=(
  "PATH=$TMP_DIR:$PATH"
  "NETLIFY_AUTH_TOKEN=test-netlify-token"
  "NETLIFY_SITE_ID=11111111-2222-3333-4444-555555555555"
  "FLY_API_TOKEN=test-fly-token"
  "DATABASE_URL=postgresql://postgres:pw@localhost:5432/postgres?schema=public"
  "NEXT_PUBLIC_API_URL=https://infamous.fly.dev"
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_test"
  "STRIPE_SECRET_KEY=sk_live_test"
  "STRIPE_WEBHOOK_SECRET=whsec_test"
  "JWT_SECRET=abcdefghijklmnopqrstuvwxyz123456"
)

echo "=== bootstrap-production-secrets script checks ==="

help_output="$(env "${BASE_ENV[@]}" "$SCRIPT" --help)"
assert_contains "help output includes title" "$help_output" "Bootstrap production secrets for Netlify + Fly.io"

set +e
missing_output="$(env PATH="$TMP_DIR:$PATH" "$SCRIPT" 2>&1)"
missing_code=$?
set -e
assert_eq "missing vars exits non-zero" "1" "$missing_code"
assert_contains "missing vars prints specific var" "$missing_output" "Missing required env var"

set +e
invalid_url_output="$(env "${BASE_ENV[@]}" NEXT_PUBLIC_API_URL=http://insecure.example "$SCRIPT" 2>&1)"
invalid_url_code=$?
set -e
assert_eq "http api url exits non-zero" "1" "$invalid_url_code"
assert_contains "http api url has explicit message" "$invalid_url_output" "NEXT_PUBLIC_API_URL must be https:// in production"

set +e
invalid_site_id_output="$(env "${BASE_ENV[@]}" NETLIFY_SITE_ID=not-a-uuid "$SCRIPT" 2>&1)"
invalid_site_id_code=$?
set -e
assert_eq "invalid netlify site id exits non-zero" "1" "$invalid_site_id_code"
assert_contains "invalid netlify site id has explicit message" "$invalid_site_id_output" "NETLIFY_SITE_ID must be a UUID"

set +e
invalid_stripe_secret_output="$(env "${BASE_ENV[@]}" STRIPE_SECRET_KEY=pk_live_wrong "$SCRIPT" 2>&1)"
invalid_stripe_secret_code=$?
set -e
assert_eq "invalid stripe secret exits non-zero" "1" "$invalid_stripe_secret_code"
assert_contains "invalid stripe secret has explicit message" "$invalid_stripe_secret_output" "STRIPE_SECRET_KEY must be a Stripe secret key"

set +e
invalid_webhook_secret_output="$(env "${BASE_ENV[@]}" STRIPE_WEBHOOK_SECRET=secret_wrong "$SCRIPT" 2>&1)"
invalid_webhook_secret_code=$?
set -e
assert_eq "invalid webhook secret exits non-zero" "1" "$invalid_webhook_secret_code"
assert_contains "invalid webhook secret has explicit message" "$invalid_webhook_secret_output" "STRIPE_WEBHOOK_SECRET must be a Stripe webhook signing secret"

set +e
test_keys_output="$(env "${BASE_ENV[@]}" NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_123 STRIPE_SECRET_KEY=sk_test_123 "$SCRIPT" 2>&1)"
test_keys_code=$?
set -e
assert_eq "stripe test keys rejected by default" "1" "$test_keys_code"
assert_contains "stripe test keys rejection has explicit message" "$test_keys_output" "must be a live key (set ALLOW_TEST_KEYS=1 to bypass)"

set +e
allow_test_keys_output="$(env "${BASE_ENV[@]}" NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_123 STRIPE_SECRET_KEY=sk_test_123 ALLOW_TEST_KEYS=1 DRY_RUN=1 "$SCRIPT" 2>&1)"
allow_test_keys_code=$?
set -e
assert_eq "allow test keys override exits zero" "0" "$allow_test_keys_code"
assert_contains "allow test keys override still prints dry-run command" "$allow_test_keys_output" "netlify env:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"

set +e
dry_run_output="$(env "${BASE_ENV[@]}" DRY_RUN=1 "$SCRIPT" 2>&1)"
dry_run_code=$?
set -e
assert_eq "dry run exits zero" "0" "$dry_run_code"
assert_contains "dry run prints netlify key/value/context command" "$dry_run_output" 'netlify env:set NEXT_PUBLIC_API_URL "$NEXT_PUBLIC_API_URL" --context production --site ***'
assert_contains "dry run prints fly command" "$dry_run_output" "flyctl secrets set DATABASE_URL="
assert_contains "dry run includes stripe server key placeholder" "$dry_run_output" 'STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"'
assert_contains "dry run includes stripe webhook placeholder" "$dry_run_output" 'STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"'
assert_not_contains "dry run redacts database url value" "$dry_run_output" "postgresql://postgres:pw@localhost:5432/postgres?schema=public"
assert_not_contains "dry run redacts database password segment" "$dry_run_output" "postgres:pw@"
assert_not_contains "dry run redacts jwt secret value" "$dry_run_output" "abcdefghijklmnopqrstuvwxyz123456"
assert_not_contains "dry run redacts fly token value" "$dry_run_output" "test-fly-token"
assert_not_contains "dry run redacts netlify token value" "$dry_run_output" "test-netlify-token"
assert_not_contains "dry run redacts netlify site id value" "$dry_run_output" "11111111-2222-3333-4444-555555555555"
assert_not_contains "dry run redacts stripe secret key value" "$dry_run_output" "sk_live_test"
assert_not_contains "dry run redacts stripe webhook secret value" "$dry_run_output" "whsec_test"

set +e
apply_output="$(env "${BASE_ENV[@]}" "$SCRIPT" 2>&1)"
apply_code=$?
set -e
assert_eq "apply mode exits zero" "0" "$apply_code"
assert_contains "apply mode netlify command includes explicit site flag" "$apply_output" "netlify env:set NEXT_PUBLIC_API_URL https://infamous.fly.dev --context production --site 11111111-2222-3333-4444-555555555555"
assert_contains "apply mode netlify includes stripe webhook secret key name" "$apply_output" "netlify env:set STRIPE_WEBHOOK_SECRET"
assert_contains "apply mode fly command includes stripe server secret key name" "$apply_output" "flyctl secrets set DATABASE_URL=postgresql://postgres:pw@localhost:5432/postgres?schema=public JWT_SECRET=abcdefghijklmnopqrstuvwxyz123456 STRIPE_SECRET_KEY=sk_live_test STRIPE_WEBHOOK_SECRET=whsec_test --app infamous-freight-api"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "RESULT: FAIL ($FAIL failed, $PASS passed)"
  exit 1
fi

echo ""
echo "RESULT: PASS ($PASS checks passed)"
