#!/bin/bash
#
# Audit Verification Script
# 
# Verifies security headers, audit chain integrity, and compliance status
# Usage: ./verify.sh [environment] [optional-job-id]
#
# Prerequisites:
#   - curl installed
#   - jq installed (for JSON parsing)
#   - API running and accessible
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
JOB_ID="${2:-}"
API_URL="${API_URL:-https://api.infamous-freight.com}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="audit_verification_${TIMESTAMP}.json"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Audit Verification Report - $ENVIRONMENT              ${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo

# Initialize report
cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "api_url": "$API_URL",
  "checks": {}
}
EOF

# 1. Health check
echo -e "${YELLOW}[1/6] Checking API health...${NC}"
if response=$(curl -s -w "\n%{http_code}" "$API_URL/api/health"); then
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed (HTTP 200)${NC}"
    echo "$body" | jq -r '.uptime' | head -1 || true
    echo "$body" | jq . >> "$REPORT_FILE" 2>/dev/null || true
  else
    echo -e "${RED}✗ Health check failed (HTTP $http_code)${NC}"
  fi
else
  echo -e "${RED}✗ Could not connect to API${NC}"
  exit 1
fi
echo

# 2. Security headers check
echo -e "${YELLOW}[2/6] Verifying security headers...${NC}"
headers=$(curl -s -i "$API_URL/api/health" | grep -E "^(Content-Security-Policy|Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options):" || true)

if echo "$headers" | grep -q "Strict-Transport-Security"; then
  echo -e "${GREEN}✓ HSTS header present${NC}"
else
  echo -e "${RED}✗ HSTS header missing${NC}"
fi

if echo "$headers" | grep -q "Content-Security-Policy"; then
  echo -e "${GREEN}✓ CSP header present${NC}"
else
  echo -e "${RED}✗ CSP header missing${NC}"
fi

if echo "$headers" | grep -q "X-Frame-Options"; then
  echo -e "${GREEN}✓ X-Frame-Options header present${NC}"
else
  echo -e "${RED}✗ X-Frame-Options header missing${NC}"
fi
echo

# 3. Status endpoint check
echo -e "${YELLOW}[3/6] Checking operational status...${NC}"
if status=$(curl -s "$API_URL/api/status"); then
  ok=$(echo "$status" | jq -r '.ok // false')
  if [ "$ok" = "true" ]; then
    echo -e "${GREEN}✓ Status endpoint operational${NC}"
    release=$(echo "$status" | jq -r '.release // "unknown"')
    echo "  Release: $release"
    echo "  Environment: $(echo "$status" | jq -r '.environment')"
    
    # Check queue status
    dispatch_count=$(echo "$status" | jq '.queues.dispatch.active // 0')
    echo "  Dispatch queue: $dispatch_count active jobs"
    
    # Check worker heartbeat
    heartbeat=$(echo "$status" | jq -r '.worker.heartbeat // null')
    if [ "$heartbeat" != "null" ] && [ -n "$heartbeat" ]; then
      echo -e "${GREEN}✓ Worker heartbeat active (last: $heartbeat)${NC}"
    else
      echo -e "${YELLOW}⚠ Worker heartbeat not detected${NC}"
    fi
  else
    echo -e "${RED}✗ Status check failed${NC}"
  fi
else
  echo -e "${RED}✗ Could not reach status endpoint${NC}"
fi
echo

# 4. Audit chain verification (if Job ID provided)
if [ -n "$JOB_ID" ]; then
  echo -e "${YELLOW}[4/6] Verifying audit chain for job $JOB_ID...${NC}"
  
  # Note: This requires authentication and an admin endpoint
  # In production, you'd provide a service token
  
  if command -v curl &> /dev/null; then
    if verify_result=$(curl -s -X POST \
      -H "Authorization: Bearer $SERVICE_TOKEN" \
      -H "Content-Type: application/json" \
      "$API_URL/api/audit/verify" \
      -d "{\"jobId\": \"$JOB_ID\"}" 2>/dev/null); then
      
      ok=$(echo "$verify_result" | jq -r '.ok // false')
      if [ "$ok" = "true" ]; then
        echo -e "${GREEN}✓ Audit chain verified${NC}"
        checked=$(echo "$verify_result" | jq -r '.checked')
        echo "  Events verified: $checked"
      else
        echo -e "${RED}✗ Audit chain verification failed${NC}"
        echo "$verify_result" | jq '.firstError' || true
      fi
    else
      echo -e "${YELLOW}⚠ Could not verify audit chain (authentication required)${NC}"
    fi
  fi
  echo
fi

# 5. Dependency audit check
echo -e "${YELLOW}[5/6] Checking for known vulnerabilities...${NC}"
if command -v pnpm &> /dev/null && [ -f "api/package.json" ]; then
  vuln_count=$(pnpm audit --json 2>/dev/null | jq '.metadata.vulnerabilities.total // 0' || echo "unknown")
  if [ "$vuln_count" = "0" ]; then
    echo -e "${GREEN}✓ No known vulnerabilities${NC}"
  else
    echo -e "${YELLOW}⚠ $vuln_count vulnerabilities found${NC}"
  fi
else
  echo -e "${YELLOW}⚠ pnpm audit not available, skipping${NC}"
fi
echo

# 6. Response time check
echo -e "${YELLOW}[6/6] Measuring API latency...${NC}"
response_times=()
for i in {1..5}; do
  if response=$(curl -s -w "%{time_total}" -o /dev/null "$API_URL/api/health"); then
    response_times+=("$response")
  fi
done

if [ ${#response_times[@]} -gt 0 ]; then
  avg=$(echo "${response_times[@]}" | awk '{for(i=1;i<=NF;i++)s+=$i;print s/NF}')
  echo -e "${GREEN}✓ Average response time: ${avg}s${NC}"
  if (( $(echo "$avg < 0.5" | bc -l) )); then
    echo -e "${GREEN}✓ Response time acceptable (<500ms)${NC}"
  else
    echo -e "${YELLOW}⚠ Response time slow (>500ms)${NC}"
  fi
else
  echo -e "${RED}✗ Could not measure response time${NC}"
fi
echo

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Verification Complete                                 ${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo
echo "Report saved to: $REPORT_FILE"
echo
echo -e "For full audit trail exports, run:"
echo -e "  ${YELLOW}curl -H 'Authorization: Bearer \$TOKEN' $API_URL/api/audit/export${NC}"
echo

exit 0
