#!/usr/bin/env bash
set -euo pipefail

PASS=0
FAIL=0

pass() {
  echo "  PASS: $1"
  PASS=$((PASS + 1))
}

fail() {
  echo "  FAIL: $1"
  FAIL=$((FAIL + 1))
}

assert_eq() {
  local description="$1"
  local expected="$2"
  local actual="$3"
  if [ "$expected" = "$actual" ]; then
    pass "$description"
  else
    fail "$description (expected='$expected', got='$actual')"
  fi
}

assert_not_empty() {
  local description="$1"
  local value="$2"
  if [ -n "$value" ]; then
    pass "$description"
  else
    fail "$description (value was empty)"
  fi
}

assert_empty() {
  local description="$1"
  local value="$2"
  if [ -z "$value" ]; then
    pass "$description"
  else
    fail "$description (expected empty, got='$value')"
  fi
}

assert_contains() {
  local description="$1"
  local haystack="$2"
  local needle="$3"
  if printf '%s' "$haystack" | grep -qF -- "$needle"; then
    pass "$description"
  else
    fail "$description (expected to contain '$needle')"
  fi
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FILENAME="tests/ci/fly-config.test.sh"
ROOT_FLY_TOML="$ROOT_DIR/fly.toml"
API_FLY_TOML="$ROOT_DIR/apps/api/fly.toml"
API_PACKAGE_JSON="$ROOT_DIR/apps/api/package.json"
FLY_DEPLOY_YML="$ROOT_DIR/.github/workflows/fly-deploy.yml"
FLY_DEPLOY_MAIN_YML="$ROOT_DIR/.github/workflows/fly-deploy-main.yml"

extract_first_match() {
  local pattern="$1"
  local file="$2"
  local result
  result=$(grep -E "$pattern" "$file" 2>/dev/null | head -n 1 | sed -E "s/.*=\s*['\"]?([^'\"]+)['\"]?.*/\1/" || true)
  printf '%s' "$result"
}

extract_literal() {
  local pattern="$1"
  local file="$2"
  local result
  result=$(grep -E "$pattern" "$file" 2>/dev/null | head -n 1 || true)
  printf '%s' "$result"
}

echo "=== Fly config and deployment workflow checks ==="

assert_eq "test script is present" "true" "$([ -f "$ROOT_DIR/$FILENAME" ] && echo true || echo false)"
assert_eq "root fly.toml exists" "true" "$([ -f "$ROOT_FLY_TOML" ] && echo true || echo false)"
assert_eq "apps/api/fly.toml exists" "true" "$([ -f "$API_FLY_TOML" ] && echo true || echo false)"
assert_eq "apps/api/package.json exists" "true" "$([ -f "$API_PACKAGE_JSON" ] && echo true || echo false)"
assert_eq "fly-deploy.yml exists" "true" "$([ -f "$FLY_DEPLOY_YML" ] && echo true || echo false)"

# Root fly.toml assertions aligned with current branch state.
ROOT_APP_NAME=$(extract_first_match '^app\s*=\s*' "$ROOT_FLY_TOML")
assert_not_empty "root fly.toml app name is configured" "$ROOT_APP_NAME"

ROOT_PRIMARY_REGION=$(extract_first_match '^primary_region\s*=\s*' "$ROOT_FLY_TOML")
assert_not_empty "root fly.toml primary_region is configured" "$ROOT_PRIMARY_REGION"

ROOT_INTERNAL_PORT=$(extract_first_match '^\s*internal_port\s*=\s*' "$ROOT_FLY_TOML")
assert_eq "root fly.toml internal_port" "3000" "$ROOT_INTERNAL_PORT"

ROOT_MEMORY_MB=$(extract_first_match '^\s*memory_mb\s*=\s*' "$ROOT_FLY_TOML")
assert_eq "root fly.toml memory_mb" "1024" "$ROOT_MEMORY_MB"

if grep -q '^\[build\]' "$ROOT_FLY_TOML"; then
  pass "root fly.toml contains [build] section"
else
  fail "root fly.toml should contain [build] section"
fi

# Validate app name extraction for the current workflow implementation.
FLY_CONFIG_APP_NAME=$(extract_first_match '^app\s*=\s*' "$API_FLY_TOML")
assert_not_empty "apps/api/fly.toml yields an app name" "$FLY_CONFIG_APP_NAME"

DEPLOY_SCRIPT_HAS_FLY_CONFIG=$(extract_literal 'id:\s*fly-config' "$FLY_DEPLOY_YML")
assert_not_empty "fly-deploy.yml has dedicated fly-config step" "$DEPLOY_SCRIPT_HAS_FLY_CONFIG"

DEPLOY_COMMAND=$(extract_literal 'flyctl deploy' "$FLY_DEPLOY_YML")
assert_contains "fly-deploy.yml deploy command uses config path" "$DEPLOY_COMMAND" '-c apps/api/fly.toml'
assert_contains "fly-deploy.yml deploy command passes app flag" "$DEPLOY_COMMAND" '-a "${{ steps.fly-config.outputs.app_name }}"'
assert_contains "fly-deploy.yml deploy command uses remote-only" "$DEPLOY_COMMAND" '--remote-only'
assert_contains "fly-deploy.yml deploy command uses depot=false" "$DEPLOY_COMMAND" '--depot=false'

# Dependency expectations aligned with current package.json.
API_PG_TYPES_VERSION=$(node -e "const p=require(process.argv[1]); console.log(p.dependencies['@types/pg'] || '')" "$API_PACKAGE_JSON")
assert_eq "@types/pg version" "^8.20.0" "$API_PG_TYPES_VERSION"

EXPRESS_RATE_LIMIT_VERSION=$(node -e "const p=require(process.argv[1]); console.log(p.dependencies['express-rate-limit'] || '')" "$API_PACKAGE_JSON")
assert_eq "express-rate-limit version" "^8.3.2" "$EXPRESS_RATE_LIMIT_VERSION"

ARGON2_VERSION=$(node -e "const p=require(process.argv[1]); console.log(p.dependencies['argon2'] || '')" "$API_PACKAGE_JSON")
assert_eq "argon2 version" "^0.44.0" "$ARGON2_VERSION"

# Make sure the test script itself does not rely on unguarded grep failures.
SCRIPT_SELF_CHECK=$(grep -n 'grep -E' "$ROOT_DIR/$FILENAME" || true)
assert_not_empty "test script uses guarded grep patterns" "$SCRIPT_SELF_CHECK"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "RESULT: FAIL ($FAIL failed, $PASS passed)"
  exit 1
fi

echo ""
echo "RESULT: PASS ($PASS checks passed)"
