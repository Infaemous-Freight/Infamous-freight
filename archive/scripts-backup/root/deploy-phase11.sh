#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT=${1:-development}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deployment_phase11_${TIMESTAMP}.log"
REPORT_FILE="PHASE_11_DEPLOYMENT_REPORT_${TIMESTAMP}.md"

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m"

log() {
  echo -e "${BLUE}[Phase11]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
  echo -e "${YELLOW}[Phase11]${NC} $1" | tee -a "$LOG_FILE"
}

fail() {
  echo -e "${RED}[Phase11]${NC} $1" | tee -a "$LOG_FILE"
  exit 1
}

log "Starting Phase 11 deployment (${ENVIRONMENT})"

for cmd in pnpm node npm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    fail "Missing required command: $cmd"
  fi
done

log "Step 1: Build shared package"
pnpm --filter @infamous-freight/shared build | tee -a "$LOG_FILE"

log "Step 2: Install API dependencies"
cd apps/api
pnpm install | tee -a "../$LOG_FILE"

log "Step 3: Verify Phase 11 service files"
for file in \
  src/services/realTimeAnalytics.js \
  src/services/cohortAnalysis.js \
  src/services/predictiveAnalytics.js \
  src/services/businessIntelligence.js; do
  if [[ ! -f "$file" ]]; then
    fail "Missing Phase 11 service file: $file"
  fi
done

log "Step 4: Verify Phase 11 routes"
if [[ ! -f "src/routes/phase11.analytics.js" ]]; then
  fail "Missing Phase 11 routes file: src/routes/phase11.analytics.js"
fi

log "Step 5: Verify Phase 10 AI/ML services"
for file in \
  src/services/fraudDetectionAI.js \
  src/services/demandForecasting.js \
  src/services/routeOptimizationAI.js \
  src/services/predictiveMaintenance.js; do
  if [[ ! -f "$file" ]]; then
    fail "Missing Phase 10 service file: $file"
  fi
done

log "Step 6: Prisma generate"
pnpm prisma:generate | tee -a "../$LOG_FILE"

log "Step 7: Prisma migration check"
MIGRATION_DIR="prisma/migrations"
if ! ls "$MIGRATION_DIR" | grep -q "phase11_analytics_baseline"; then
  if [[ "$ENVIRONMENT" == "production" || "$ENVIRONMENT" == "staging" ]]; then
    fail "Phase 11 migration not found (phase11_analytics_baseline)."
  else
    warn "Phase 11 migration not found; ensure migrations are created before staging/production."
  fi
fi

log "Step 8: Run Phase 11 test suite"
pnpm test -- phase11.test.js | tee -a "../$LOG_FILE"

log "Step 9: Run Phase 10 regression tests"
pnpm test -- phase10.test.js | tee -a "../$LOG_FILE"

log "Step 10: Lint and typecheck"
pnpm lint | tee -a "../$LOG_FILE"
pnpm typecheck | tee -a "../$LOG_FILE"

log "Step 11: Validate server route registration"
if ! grep -q "phase11.analytics" src/server.js; then
  fail "Phase 11 route not registered in src/server.js"
fi

log "Step 12: Generate deployment report"
cat > "../$REPORT_FILE" <<EOF
# Phase 11 Deployment Report

- Environment: $ENVIRONMENT
- Timestamp: $TIMESTAMP
- Status: SUCCESS
- Services: realTimeAnalytics, cohortAnalysis, predictiveAnalytics, businessIntelligence
- Routes: /api/analytics/phase11/*
- Tests: phase11.test.js, phase10.test.js

## Next Steps
- Verify analytics endpoints in staging
- Monitor logs and dashboards for errors
- Schedule first BI report to validate scheduling
EOF

log "Step 13: Deployment completed"
cd ../
log "Report: $REPORT_FILE"
