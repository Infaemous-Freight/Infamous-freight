#!/usr/bin/env bash
# Final go-live verification script
# Runs critical checks for production readiness

set -euo pipefail

API_URL="${API_URL:-}"
WEB_URL="${WEB_URL:-}"
RETRIES="${RETRIES:-5}"
RETRY_DELAY="${RETRY_DELAY:-5}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
  echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_ok() {
  echo -e "${GREEN}OK${NC}  $1"
}

print_warn() {
  echo -e "${YELLOW}WARN${NC} $1"
}

print_fail() {
  echo -e "${RED}FAIL${NC} $1"
}

usage() {
  cat << 'EOF'
Usage: scripts/final-go-live-verification.sh [options]

Options:
  --api-url URL        API base URL (e.g., https://api.example.com)
  --web-url URL        Web base URL (e.g., https://app.example.com)
  --retries N          Number of retries (default: 5)
  --retry-delay SEC    Delay between retries (default: 5)
  --skip-env           Skip environment variable checks
  --skip-files         Skip required file checks
  --skip-endpoints     Skip endpoint checks
  -h, --help           Show this help text
EOF
}

SKIP_ENV=0
SKIP_FILES=0
SKIP_ENDPOINTS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-url)
      API_URL="$2"
      shift 2
      ;;
    --web-url)
      WEB_URL="$2"
      shift 2
      ;;
    --retries)
      RETRIES="$2"
      shift 2
      ;;
    --retry-delay)
      RETRY_DELAY="$2"
      shift 2
      ;;
    --skip-env)
      SKIP_ENV=1
      shift
      ;;
    --skip-files)
      SKIP_FILES=1
      shift
      ;;
    --skip-endpoints)
      SKIP_ENDPOINTS=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done
done

if [ -z "$API_URL" ]; then
  API_URL="http://localhost:4000"
fi

if [ -z "$WEB_URL" ]; then
  WEB_URL="http://localhost:3000"
fi

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARN=0

check_command() {
  local cmd="$1"
  if command -v "$cmd" >/dev/null 2>&1; then
    print_ok "Command available: $cmd"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    print_warn "Command not found: $cmd"
    CHECKS_WARN=$((CHECKS_WARN + 1))
  fi
}

check_env_var() {
  local name="$1"
  if [ -n "${!name:-}" ]; then
    print_ok "Env var set: $name"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    print_fail "Env var missing: $name"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
}

check_file() {
  local path="$1"
  if [ -f "$path" ]; then
    print_ok "File present: $path"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    print_fail "File missing: $path"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
}

check_http() {
  local name="$1"
  local url="$2"
  local expected_codes="$3"
  local attempt=1

  while [ $attempt -le "$RETRIES" ]; do
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if echo "$expected_codes" | grep -q "$http_code"; then
      print_ok "$name responded with HTTP $http_code"
      CHECKS_PASSED=$((CHECKS_PASSED + 1))
      return 0
    fi

    attempt=$((attempt + 1))
    sleep "$RETRY_DELAY"
  done

  print_fail "$name failed (last HTTP $http_code)"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
  return 1
}

print_header "Prerequisites"
check_command "curl"
check_command "jq"

if [ "$SKIP_ENV" -eq 0 ]; then
  print_header "Environment Variables"
  check_env_var "AI_PROVIDER"
  check_env_var "DATABASE_URL"
  check_env_var "JWT_SECRET"
  check_env_var "NODE_ENV"
else
  print_warn "Skipping environment variable checks"
fi

if [ "$SKIP_FILES" -eq 0 ]; then
  print_header "Required Files"
  check_file ".env"
  check_file "apps/api/.env"
  check_file "apps/web/.env.local"
else
  print_warn "Skipping required file checks"
fi

if [ "$SKIP_ENDPOINTS" -eq 0 ]; then
  print_header "Endpoint Checks"
  check_http "Web root" "${WEB_URL}/" "200|301|302|304"
  check_http "API health" "${API_URL}/api/health" "200"
  check_http "API readiness" "${API_URL}/api/health/ready" "200|404"
  check_http "API liveness" "${API_URL}/api/health/live" "200|404"
else
  print_warn "Skipping endpoint checks"
fi

print_header "Summary"
TOTAL=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARN))
if [ $TOTAL -eq 0 ]; then
  TOTAL=1
fi
SUCCESS_RATE=$((CHECKS_PASSED * 100 / TOTAL))

echo "Passed: $CHECKS_PASSED"
echo "Warnings: $CHECKS_WARN"
echo "Failed: $CHECKS_FAILED"
echo "Success rate: ${SUCCESS_RATE}%"

if [ $CHECKS_FAILED -gt 0 ]; then
  print_fail "Go-live verification failed"
  exit 1
fi

print_ok "Go-live verification complete"
exit 0
