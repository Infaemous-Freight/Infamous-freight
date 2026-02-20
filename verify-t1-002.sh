#!/bin/bash

# T1-002: Loadenv Configuration System Verification Script
# This script verifies that the loadenv configuration system is properly integrated

set -e

echo "🔍 T1-002: Loadenv Configuration System Verification"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Count successes and failures
PASSED=0
FAILED=0

# Function to test
check_test() {
  local description=$1
  local command=$2
  
  echo -n "Testing: $description... "
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED++))
    return 1
  fi
}

# Test 1: Check that loadenv.js file exists
check_test "loadenv.js exists" "test -f apps/api/src/config/loadenv.js"

# Test 2: Check that index.js properly imports config
check_test "index.js imports config" "grep -q 'require.*loadenv' apps/api/src/index.js"

# Test 3: Check that server.js was updated with config import
check_test "server.js imports config" "grep -q 'const config = require.*loadenv' apps/api/src/server.js"

# Test 4: Verify no process.env references remain in server.js (except comments)
check_test "server.js uses config (no process.env)" "! grep -E 'process\.env\.[A-Z_]' apps/api/src/server.js"

# Test 5: Check that index.js initializes server with PORT
check_test "index.js uses config.API_PORT" "grep -q 'config.API_PORT' apps/api/src/index.js"

# Test 6: Verify loadenv.js exports config directly
check_test "loadenv.js exports config" "grep -q 'module.exports = config' apps/api/src/config/loadenv.js"

# Test 7: Check for configuration schema definition
check_test "loadenv.js has configSchema" "grep -q 'const configSchema' apps/api/src/config/loadenv.js"

# Test 8: Verify generateEnvExample function exists
check_test "loadenv.js has generateEnvExample" "grep -q 'function generateEnvExample' apps/api/src/config/loadenv.js"

# Test 9: Verify NODE_ENV, API_PORT in schema
check_test "loadenv schema has NODE_ENV" "grep -q 'NODE_ENV' apps/api/src/config/loadenv.js"
check_test "loadenv schema has API_PORT" "grep -q 'API_PORT' apps/api/src/config/loadenv.js"
check_test "loadenv schema has DATABASE_URL" "grep -q 'DATABASE_URL' apps/api/src/config/loadenv.js"

# Test 10: Check for error handling in loadenv
check_test "loadenv.js has error validation" "grep -q 'Configuration validation failed' apps/api/src/config/loadenv.js"

# Test 11: Verify config generation in development
check_test "loadenv triggers env example generation" "grep -q 'generateEnvExample' apps/api/src/config/loadenv.js"

# Test 12: Check server.js uses config for Datadog
check_test "server.js uses config for DD_TRACE" "grep -q 'config.DD_TRACE_ENABLED' apps/api/src/server.js"

# Test 13: Verify Sentry integration in server.js
check_test "server.js uses config for SENTRY_DSN" "grep -q 'config.SENTRY_DSN' apps/api/src/server.js"

# Test 14: Check marketplace feature flag
check_test "server.js uses config for MARKETPLACE" "grep -q 'config.MARKETPLACE_ENABLED\\|config.FEATURE_GET_TRUCKN' apps/api/src/server.js"

# Test 15: Verify BULLBOARD config
check_test "server.js uses config for BULLBOARD" "grep -q 'config.BULLBOARD' apps/api/src/server.js"

echo ""
echo "=================================================="
echo -e "📊 Summary: ${GREEN}$PASSED Passed${NC}, ${RED}$FAILED Failed${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All T1-002 verification tests passed!${NC}"
  echo ""
  echo "📝 Next Steps:"
  echo "1. Copy .env.example to .env"
  echo "2. Update required environment variables in .env"
  echo "3. Run: pnpm api:dev"
  echo "4. Verify server starts with: 🚀 [development] Infamous Freight API starting..."
  echo "5. Test health endpoint: curl http://localhost:4000/api/health"
  exit 0
else
  echo -e "${RED}❌ Some verification tests failed. Review the failures above.${NC}"
  exit 1
fi
