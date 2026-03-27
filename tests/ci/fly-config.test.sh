#!/usr/bin/env bash
# Tests for fly.toml configuration and fly-deploy.yml shell script logic
# Covers the changes introduced in the PR:
# - Root fly.toml updated (app name, region, env vars, machine settings)
# - fly-deploy.yml grep/sed pattern moved inline into "Get app URLs" and "Deployment summary" steps
# - apps/api/package.json dependency version downgrades

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ROOT_FLY_TOML="$REPO_ROOT/fly.toml"
API_FLY_TOML="$REPO_ROOT/apps/api/fly.toml"
API_PACKAGE_JSON="$REPO_ROOT/apps/api/package.json"

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
  # Use -- to end option processing so needles starting with -- are not treated as flags
  if echo "$haystack" | grep -qF -- "$needle"; then
    pass "$description"
  else
    fail "$description (expected to contain '$needle')"
  fi
}

# ---------------------------------------------------------------------------
# Helper: extract_app_name <toml_content>
# Replicates the grep/sed pattern from fly-deploy.yml:
#   APP_NAME=$(grep -E '^app\s*=\s*' apps/api/fly.toml | head -1 | sed -E 's/.*=\s*"?([^" ]+)"?/\1/')
# ---------------------------------------------------------------------------
extract_app_name_from_content() {
  local content="$1"
  # grep returns exit code 1 when no lines match; suppress that so set -e doesn't abort the script
  echo "$content" | grep -E '^app\s*=\s*' | head -1 | sed -E 's/.*=\s*"?([^" ]+)"?/\1/' || true
}

# ---------------------------------------------------------------------------
# Section 1: Root fly.toml configuration values
# ---------------------------------------------------------------------------
echo ""
echo "=== Root fly.toml Configuration Tests ==="

assert_eq "root fly.toml exists" "true" "$([ -f "$ROOT_FLY_TOML" ] && echo true || echo false)"

ROOT_APP_NAME=$(grep -E '^app\s*=' "$ROOT_FLY_TOML" | head -1 | sed -E 's/.*=\s*"?([^" ]+)"?/\1/' || true)
assert_eq "root fly.toml app name is 'infamous-freight'" "infamous-freight" "$ROOT_APP_NAME"

ROOT_REGION=$(grep -E '^primary_region\s*=' "$ROOT_FLY_TOML" | head -1 | sed -E 's/.*=\s*"?([^" ]+)"?/\1/')
assert_eq "root fly.toml primary_region is 'dfw'" "dfw" "$ROOT_REGION"

ROOT_NODE_ENV=$(grep -E 'NODE_ENV\s*=' "$ROOT_FLY_TOML" | head -1 | sed -E 's/.*=\s*"?([^" ]+)"?/\1/')
assert_eq "root fly.toml NODE_ENV is 'production'" "production" "$ROOT_NODE_ENV"

ROOT_PORT=$(grep -E 'PORT\s*=' "$ROOT_FLY_TOML" | head -1 | sed -E 's/.*=\s*"?([^" ]+)"?/\1/')
assert_eq "root fly.toml PORT is '3000'" "3000" "$ROOT_PORT"

ROOT_INTERNAL_PORT=$(grep -E 'internal_port\s*=' "$ROOT_FLY_TOML" | head -1 | sed -E 's/.*=\s*([0-9]+).*/\1/')
assert_eq "root fly.toml internal_port is 3000" "3000" "$ROOT_INTERNAL_PORT"

ROOT_AUTO_STOP=$(grep -E 'auto_stop_machines\s*=' "$ROOT_FLY_TOML" | head -1 | sed -E 's/.*=\s*(.*)/\1/' | tr -d ' ')
assert_eq "root fly.toml auto_stop_machines is 'false'" "false" "$ROOT_AUTO_STOP"

ROOT_MIN_MACHINES=$(grep -E 'min_machines_running\s*=' "$ROOT_FLY_TOML" | head -1 | sed -E 's/.*=\s*([0-9]+).*/\1/')
assert_eq "root fly.toml min_machines_running is 1" "1" "$ROOT_MIN_MACHINES"

ROOT_AUTO_START=$(grep -E 'auto_start_machines\s*=' "$ROOT_FLY_TOML" | head -1 | sed -E 's/.*=\s*(.*)/\1/' | tr -d ' ')
assert_eq "root fly.toml auto_start_machines is 'true'" "true" "$ROOT_AUTO_START"

ROOT_FORCE_HTTPS=$(grep -E 'force_https\s*=' "$ROOT_FLY_TOML" | head -1 | sed -E 's/.*=\s*(.*)/\1/' | tr -d ' ')
assert_eq "root fly.toml force_https is 'true'" "true" "$ROOT_FORCE_HTTPS"

# Verify memory_mb is NOT present (was removed in this PR)
if grep -q 'memory_mb' "$ROOT_FLY_TOML"; then
  fail "root fly.toml should NOT contain memory_mb (was removed in PR)"
else
  pass "root fly.toml does not contain memory_mb (correctly removed)"
fi

# Verify [env] section is present
if grep -q '^\[env\]' "$ROOT_FLY_TOML"; then
  pass "root fly.toml contains [env] section"
else
  fail "root fly.toml should contain [env] section"
fi

# Verify [build] section is present
if grep -q '^\[build\]' "$ROOT_FLY_TOML"; then
  pass "root fly.toml contains [build] section"
else
  fail "root fly.toml should contain [build] section"
fi

# ---------------------------------------------------------------------------
# Section 2: grep/sed app-name extraction pattern (from fly-deploy.yml)
# This replicates the logic from the "Get app URLs" and "Deployment summary"
# steps that was changed in this PR.
# ---------------------------------------------------------------------------
echo ""
echo "=== fly-deploy.yml Shell Script: App Name Extraction Pattern ==="

# Test: double-quoted value (standard TOML format used after PR)
APP=$(extract_app_name_from_content 'app = "infamous-freight"')
assert_eq "extracts app name from double-quoted value" "infamous-freight" "$APP"

# Test: single-quoted value (old format used before PR in fly-deploy-main.yml)
# The sed pattern 's/.*=\s*"?([^" ]+)"?/\1/' is designed for double-quoted TOML values.
# Single-quoted TOML values retain their surrounding single quotes in the output because
# the regex only strips double quotes. The current fly.toml files use double quotes.
APP=$(extract_app_name_from_content "app = 'infamous-freight-db'")
assert_eq "single-quoted value retains single quotes (sed only strips double quotes)" "'infamous-freight-db'" "$APP"

# Test: unquoted value
APP=$(extract_app_name_from_content 'app = my-app-name')
assert_eq "extracts app name from unquoted value" "my-app-name" "$APP"

# Test: value with extra whitespace around equals sign
APP=$(extract_app_name_from_content 'app  =  "spaced-app"')
assert_eq "extracts app name with extra whitespace around =" "spaced-app" "$APP"

# Test: value with no whitespace around equals sign
APP=$(extract_app_name_from_content 'app="no-space-app"')
assert_eq "extracts app name with no whitespace around =" "no-space-app" "$APP"

# Test: pattern only matches lines starting with 'app' (not partial matches like 'app_name')
APP=$(extract_app_name_from_content $'app_name = "should-not-match"\napp = "correct-app"')
assert_eq "pattern does not match keys that start with 'app_' (not '^app =')" "correct-app" "$APP"

# Test: only first 'app =' line is used when multiple exist (head -1)
APP=$(extract_app_name_from_content $'app = "first-app"\napp = "second-app"')
assert_eq "head -1 ensures only first app line is used" "first-app" "$APP"

# Test: empty input yields empty result
APP=$(extract_app_name_from_content '')
assert_empty "empty fly.toml content returns empty app name" "$APP"

# Test: missing app key returns empty string
APP=$(extract_app_name_from_content $'primary_region = "dfw"\nother_key = "value"')
assert_empty "missing app key returns empty string (triggers exit 1 in workflow)" "$APP"

# Test: apps/api/fly.toml has an extractable app name (file used in workflow)
assert_eq "apps/api/fly.toml file exists" "true" "$([ -f "$API_FLY_TOML" ] && echo true || echo false)"

API_APP_NAME=$(grep -E '^app\s*=\s*' "$API_FLY_TOML" | head -1 | sed -E 's/.*=\s*"?([^" ]+)"?/\1/')
assert_not_empty "apps/api/fly.toml yields a non-empty app name" "$API_APP_NAME"

# Test: the pattern produces a URL-safe app name (no spaces, no quotes in output)
assert_eq "extracted app name from apps/api/fly.toml contains no quotes" \
  "$API_APP_NAME" "$(echo "$API_APP_NAME" | tr -d '"'"'")"

# Test: error handling - when APP_NAME is empty the workflow should exit 1
# Simulate the workflow's empty-check logic
simulate_workflow_empty_check() {
  local app_name="$1"
  if [ -z "$app_name" ]; then
    echo "error: empty"
  else
    echo "ok: $app_name"
  fi
}

RESULT=$(simulate_workflow_empty_check "")
assert_eq "empty app name triggers error branch in workflow" "error: empty" "$RESULT"

RESULT=$(simulate_workflow_empty_check "infamous-freight")
assert_eq "non-empty app name passes workflow check" "ok: infamous-freight" "$RESULT"

# ---------------------------------------------------------------------------
# Section 3: fly-deploy.yml no longer passes -c / -a flags to flyctl
# Verify the workflow file uses the simplified deploy command
# ---------------------------------------------------------------------------
echo ""
echo "=== fly-deploy.yml Deploy Command Tests ==="

FLY_DEPLOY_YML="$REPO_ROOT/.github/workflows/fly-deploy.yml"
assert_eq "fly-deploy.yml exists" "true" "$([ -f "$FLY_DEPLOY_YML" ] && echo true || echo false)"

# Verify simplified deploy command (no -c or -a flags)
DEPLOY_LINE=$(grep 'flyctl deploy' "$FLY_DEPLOY_YML" | head -1)
assert_contains "fly-deploy.yml deploy step uses --remote-only flag" "$DEPLOY_LINE" "--remote-only"
assert_contains "fly-deploy.yml deploy step uses --depot=false flag" "$DEPLOY_LINE" "--depot=false"

# Verify the old -c and -a flags are NOT used in the deploy step
DEPLOY_STEP_WITH_FLAGS=$(grep 'flyctl deploy' "$FLY_DEPLOY_YML" | grep ' -c ' || true)
assert_empty "deploy step does NOT use -c flag (config path removed)" "$DEPLOY_STEP_WITH_FLAGS"

DEPLOY_STEP_WITH_APP_FLAG=$(grep 'flyctl deploy' "$FLY_DEPLOY_YML" | grep ' -a ' || true)
assert_empty "deploy step does NOT use -a flag (app name flag removed)" "$DEPLOY_STEP_WITH_APP_FLAG"

# Verify fly-deploy-main.yml was removed
FLY_DEPLOY_MAIN_YML="$REPO_ROOT/.github/workflows/fly-deploy-main.yml"
if [ ! -f "$FLY_DEPLOY_MAIN_YML" ]; then
  pass "fly-deploy-main.yml was removed (no duplicate deploy workflow)"
else
  fail "fly-deploy-main.yml still exists but should have been deleted"
fi

# Verify the inline grep/sed command pattern is present at least once in fly-deploy.yml
if grep -q "grep -E" "$FLY_DEPLOY_YML"; then
  pass "fly-deploy.yml contains inline grep for app name extraction"
else
  fail "fly-deploy.yml should contain inline grep command for app name extraction"
fi

# Verify there is no longer a dedicated 'fly-config' step id
if grep -q 'id: fly-config' "$FLY_DEPLOY_YML"; then
  fail "fly-deploy.yml should NOT have a dedicated fly-config step (was removed in PR)"
else
  pass "fly-deploy.yml does not have a dedicated fly-config step (correctly removed)"
fi

# ---------------------------------------------------------------------------
# Section 4: apps/api/package.json dependency version constraints
# ---------------------------------------------------------------------------
echo ""
echo "=== apps/api/package.json Dependency Version Tests ==="

assert_eq "apps/api/package.json exists" "true" "$([ -f "$API_PACKAGE_JSON" ] && echo true || echo false)"

# Check @types/pg version is ^8.11.10 (was ^8.20.0 before PR)
TYPES_PG_VERSION=$(node -e "const p=require('$API_PACKAGE_JSON'); console.log(p.dependencies['@types/pg'] || '')" 2>/dev/null || \
                   grep -o '"@types/pg"[^,]*' "$API_PACKAGE_JSON" | sed 's/.*"@types\/pg": *"\([^"]*\)".*/\1/')
assert_eq "@types/pg version is '^8.11.10'" "^8.11.10" "$TYPES_PG_VERSION"

# Check express-rate-limit version is ^7.5.0 (was ^8.3.1 before PR)
RATE_LIMIT_VERSION=$(node -e "const p=require('$API_PACKAGE_JSON'); console.log(p.dependencies['express-rate-limit'] || '')" 2>/dev/null || \
                     grep -o '"express-rate-limit"[^,]*' "$API_PACKAGE_JSON" | sed 's/.*"express-rate-limit": *"\([^"]*\)".*/\1/')
assert_eq "express-rate-limit version is '^7.5.0'" "^7.5.0" "$RATE_LIMIT_VERSION"

# Verify argon2 is at ^0.44.0 (bumped in PR)
ARGON2_VERSION=$(node -e "const p=require('$API_PACKAGE_JSON'); console.log(p.dependencies['argon2'] || '')" 2>/dev/null || \
                 grep -o '"argon2"[^,]*' "$API_PACKAGE_JSON" | sed 's/.*"argon2": *"\([^"]*\)".*/\1/')
assert_eq "argon2 version is '^0.44.0'" "^0.44.0" "$ARGON2_VERSION"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=== Test Summary ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "RESULT: FAIL ($FAIL test(s) failed)"
  exit 1
else
  echo "RESULT: PASS (all $PASS tests passed)"
  exit 0
fi