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
  "NETLIFY_SITE_ID=test-site-id"
  "FLY_API_TOKEN=test-fly-token"
  "DATABASE_URL=postgresql://postgres:pw@localhost:5432/postgres?schema=public"
  "NEXT_PUBLIC_API_URL=https://infamous.fly.dev"
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_test"
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
dry_run_output="$(env "${BASE_ENV[@]}" DRY_RUN=1 "$SCRIPT" 2>&1)"
dry_run_code=$?
set -e
assert_eq "dry run exits zero" "0" "$dry_run_code"
assert_contains "dry run prints netlify key/value/context command" "$dry_run_output" 'netlify env:set NEXT_PUBLIC_API_URL "$NEXT_PUBLIC_API_URL" --context production'
assert_contains "dry run prints fly command" "$dry_run_output" "flyctl secrets set DATABASE_URL="
assert_not_contains "dry run redacts database url value" "$dry_run_output" "postgresql://postgres:pw@localhost:5432/postgres?schema=public"
assert_not_contains "dry run redacts database password segment" "$dry_run_output" "postgres:pw@"
assert_not_contains "dry run redacts jwt secret value" "$dry_run_output" "abcdefghijklmnopqrstuvwxyz123456"
assert_not_contains "dry run redacts fly token value" "$dry_run_output" "test-fly-token"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "RESULT: FAIL ($FAIL failed, $PASS passed)"
  exit 1
fi

echo ""
echo "RESULT: PASS ($PASS checks passed)"
