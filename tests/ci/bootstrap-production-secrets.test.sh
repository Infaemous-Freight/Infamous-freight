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
TMP_DIR_NO_NETLIFY="$(mktemp -d)"
cp "$TMP_DIR/flyctl" "$TMP_DIR_NO_NETLIFY/flyctl"
chmod +x "$TMP_DIR_NO_NETLIFY/flyctl"
missing_netlify_output="$(env \
  PATH="$TMP_DIR_NO_NETLIFY:/usr/bin:/bin" \
  NETLIFY_AUTH_TOKEN=test-netlify-token \
  NETLIFY_SITE_ID=11111111-2222-3333-4444-555555555555 \
  FLY_API_TOKEN=test-fly-token \
  DATABASE_URL=postgresql://postgres:pw@localhost:5432/postgres?schema=public \
  NEXT_PUBLIC_API_URL=https://infamous.fly.dev \
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_test \
  STRIPE_SECRET_KEY=sk_live_test \
  STRIPE_WEBHOOK_SECRET=whsec_test \
  JWT_SECRET=abcdefghijklmnopqrstuvwxyz123456 \
  "$SCRIPT" 2>&1)"
missing_netlify_code=$?
set -e
assert_eq "missing netlify command exits non-zero" "1" "$missing_netlify_code"
assert_contains "missing netlify command has explicit message" "$missing_netlify_output" "Required command not found: netlify"
rm -rf "$TMP_DIR_NO_NETLIFY"

set +e
context_deploy_preview_output="$(env "${BASE_ENV[@]}" NETLIFY_CONTEXT=deploy-preview DRY_RUN=1 "$SCRIPT" 2>&1)"
context_deploy_preview_code=$?
set -e
assert_eq "deploy-preview context exits zero" "0" "$context_deploy_preview_code"
assert_contains "deploy-preview context appears in dry-run output" "$context_deploy_preview_output" "--context deploy-preview"

set +e
context_branch_deploy_output="$(env "${BASE_ENV[@]}" NETLIFY_CONTEXT=branch-deploy DRY_RUN=1 "$SCRIPT" 2>&1)"
context_branch_deploy_code=$?
set -e
assert_eq "branch-deploy context exits zero" "0" "$context_branch_deploy_code"
assert_contains "branch-deploy context appears in dry-run output" "$context_branch_deploy_output" "--context branch-deploy"

set +e
invalid_url_output="$(env "${BASE_ENV[@]}" NEXT_PUBLIC_API_URL=http://insecure.example "$SCRIPT" 2>&1)"
invalid_url_code=$?
set -e
assert_eq "http api url exits non-zero" "1" "$invalid_url_code"
assert_contains "http api url has explicit message" "$invalid_url_output" "NEXT_PUBLIC_API_URL must be https:// in production"

set +e
invalid_db_output="$(env "${BASE_ENV[@]}" DATABASE_URL=mysql://localhost/db "$SCRIPT" 2>&1)"
invalid_db_code=$?
set -e
assert_eq "invalid database url exits non-zero" "1" "$invalid_db_code"
assert_contains "invalid database url has explicit message" "$invalid_db_output" "DATABASE_URL must start with postgres:// or postgresql://"

set +e
invalid_site_id_output="$(env "${BASE_ENV[@]}" NETLIFY_SITE_ID=not-a-uuid "$SCRIPT" 2>&1)"
invalid_site_id_code=$?
set -e
assert_eq "invalid netlify site id exits non-zero" "1" "$invalid_site_id_code"
assert_contains "invalid netlify site id has explicit message" "$invalid_site_id_output" "NETLIFY_SITE_ID must be a UUID"

set +e
invalid_context_output="$(env "${BASE_ENV[@]}" NETLIFY_CONTEXT=staging "$SCRIPT" 2>&1)"
invalid_context_code=$?
set -e
assert_eq "invalid netlify context exits non-zero" "1" "$invalid_context_code"
assert_contains "invalid netlify context has explicit message" "$invalid_context_output" "NETLIFY_CONTEXT must be one of: production, deploy-preview, branch-deploy"

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
mismatched_stripe_modes_output="$(env "${BASE_ENV[@]}" NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_123 STRIPE_SECRET_KEY=sk_test_123 ALLOW_TEST_KEYS=1 "$SCRIPT" 2>&1)"
mismatched_stripe_modes_code=$?
set -e
assert_eq "mismatched stripe key modes exit non-zero" "1" "$mismatched_stripe_modes_code"
assert_contains "mismatched stripe key modes has explicit message" "$mismatched_stripe_modes_output" "Stripe key mode mismatch"

set +e
test_keys_output="$(env "${BASE_ENV[@]}" NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_123 STRIPE_SECRET_KEY=sk_test_123 "$SCRIPT" 2>&1)"
test_keys_code=$?
set -e
assert_eq "stripe test keys rejected by default" "1" "$test_keys_code"
assert_contains "stripe test keys rejection has explicit message" "$test_keys_output" "must be a live key (set ALLOW_TEST_KEYS=1 to bypass)"

set +e
invalid_allow_test_keys_output="$(env "${BASE_ENV[@]}" ALLOW_TEST_KEYS=maybe "$SCRIPT" 2>&1)"
invalid_allow_test_keys_code=$?
set -e
assert_eq "invalid ALLOW_TEST_KEYS exits non-zero" "1" "$invalid_allow_test_keys_code"
assert_contains "invalid ALLOW_TEST_KEYS has explicit message" "$invalid_allow_test_keys_output" "ALLOW_TEST_KEYS must be 0 or 1"

set +e
invalid_verify_only_output="$(env "${BASE_ENV[@]}" VERIFY_ONLY=2 "$SCRIPT" 2>&1)"
invalid_verify_only_code=$?
set -e
assert_eq "invalid VERIFY_ONLY exits non-zero" "1" "$invalid_verify_only_code"
assert_contains "invalid VERIFY_ONLY has explicit message" "$invalid_verify_only_output" "VERIFY_ONLY must be 0 or 1"

set +e
short_jwt_output="$(env "${BASE_ENV[@]}" JWT_SECRET=short_secret "$SCRIPT" 2>&1)"
short_jwt_code=$?
set -e
assert_eq "short jwt exits non-zero" "1" "$short_jwt_code"
assert_contains "short jwt has explicit message" "$short_jwt_output" "JWT_SECRET must be at least 32 characters"

set +e
invalid_ld_id_output="$(env "${BASE_ENV[@]}" LAUNCHDARKLY_CLIENT_SIDE_ID=abc "$SCRIPT" 2>&1)"
invalid_ld_id_code=$?
set -e
assert_eq "invalid launchdarkly client side id exits non-zero" "1" "$invalid_ld_id_code"
assert_contains "invalid launchdarkly client side id has explicit message" "$invalid_ld_id_output" "LAUNCHDARKLY_CLIENT_SIDE_ID looks invalid"

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

set +e
verify_only_output="$(env "${BASE_ENV[@]}" VERIFY_ONLY=1 "$SCRIPT" 2>&1)"
verify_only_code=$?
set -e
assert_eq "verify-only mode exits zero" "0" "$verify_only_code"
assert_contains "verify-only mode prints skip message" "$verify_only_output" "VERIFY_ONLY=1: skipping apply steps"
assert_contains "verify-only mode lists netlify env" "$verify_only_output" "netlify env:list --context production --site 11111111-2222-3333-4444-555555555555"
assert_contains "verify-only mode lists fly secrets" "$verify_only_output" "flyctl secrets list --app infamous-freight-api"

VERIFY_ONLY_ENV=()
for env_var in "${BASE_ENV[@]}"; do
  case "$env_var" in
    DATABASE_URL=*|JWT_SECRET=*|STRIPE_SECRET_KEY=*|STRIPE_WEBHOOK_SECRET=*|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=*)
      ;;
    *)
      VERIFY_ONLY_ENV+=("$env_var")
      ;;
  esac
done

set +e
verify_only_without_secrets_output="$(env "${VERIFY_ONLY_ENV[@]}" VERIFY_ONLY=1 "$SCRIPT" 2>&1)"
verify_only_without_secrets_code=$?
set -e
assert_eq "verify-only mode without apply-time secrets exits zero" "0" "$verify_only_without_secrets_code"
assert_contains "verify-only mode without apply-time secrets prints skip message" "$verify_only_without_secrets_output" "VERIFY_ONLY=1: skipping apply steps"
assert_contains "verify-only mode without apply-time secrets lists netlify env" "$verify_only_without_secrets_output" "netlify env:list --context production --site 11111111-2222-3333-4444-555555555555"
assert_contains "verify-only mode without apply-time secrets lists fly secrets" "$verify_only_without_secrets_output" "flyctl secrets list --app infamous-freight-api"
assert_not_contains "verify-only mode without apply-time secrets does not run netlify apply" "$verify_only_without_secrets_output" "netlify env:set"
assert_not_contains "verify-only mode without apply-time secrets does not run fly apply" "$verify_only_without_secrets_output" "flyctl secrets set"
set +e
verify_only_dry_run_output="$(env "${BASE_ENV[@]}" VERIFY_ONLY=1 DRY_RUN=1 "$SCRIPT" 2>&1)"
verify_only_dry_run_code=$?
set -e
assert_eq "verify-only dry-run exits zero" "0" "$verify_only_dry_run_code"
assert_contains "verify-only dry-run prints netlify list command" "$verify_only_dry_run_output" "netlify env:list --context production --site ***"
assert_contains "verify-only dry-run prints fly list command" "$verify_only_dry_run_output" "flyctl secrets list --app infamous-freight-api"
assert_not_contains "verify-only dry-run does not apply netlify env:set" "$verify_only_dry_run_output" "netlify env:set"
assert_not_contains "verify-only dry-run does not apply fly secrets set" "$verify_only_dry_run_output" "flyctl secrets set"

set +e
ld_apply_output="$(env "${BASE_ENV[@]}" LAUNCHDARKLY_CLIENT_SIDE_ID=client-side-id-123 "$SCRIPT" 2>&1)"
ld_apply_code=$?
set -e
assert_eq "launchdarkly id apply mode exits zero" "0" "$ld_apply_code"
assert_contains "launchdarkly id apply mode sets netlify env var" "$ld_apply_output" "netlify env:set LAUNCHDARKLY_CLIENT_SIDE_ID client-side-id-123 --context production --site 11111111-2222-3333-4444-555555555555"
assert_contains "launchdarkly id apply mode sets fly secret" "$ld_apply_output" "LAUNCHDARKLY_CLIENT_SIDE_ID=client-side-id-123 --app infamous-freight-api"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "RESULT: FAIL ($FAIL failed, $PASS passed)"
  exit 1
fi

echo ""
echo "RESULT: PASS ($PASS checks passed)"
