#!/bin/bash
#
# Production Monitoring Setup Script
# Enables Datadog APM, Sentry, and performance monitoring
#

set -e

echo "🚀 Setting up Production Monitoring..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Enable Datadog APM
echo -e "${BLUE}Step 1: Enabling Datadog APM...${NC}"
if [ -z "$DD_TRACE_ENABLED" ]; then
  export DD_TRACE_ENABLED="true"
  echo "✅ DD_TRACE_ENABLED=true"
else
  echo "✅ Datadog APM already enabled"
fi

# Verify Datadog environment variables
echo -e "${BLUE}Checking Datadog Configuration...${NC}"
REQUIRED_VARS=("DD_SERVICE" "DD_ENV" "DD_RUNTIME_METRICS_ENABLED")
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "⚠️  Warning: $var not set. Setting default..."
    case $var in
      DD_SERVICE)
        export DD_SERVICE="infamous-freight-api"
        ;;
      DD_ENV)
        export DD_ENV="production"
        ;;
      DD_RUNTIME_METRICS_ENABLED)
        export DD_RUNTIME_METRICS_ENABLED="true"
        ;;
    esac
  fi
  echo "  $var=${!var}"
done

# 2. Verify Sentry Configuration
echo -e "${BLUE}Step 2: Verifying Sentry Configuration...${NC}"
if [ -z "$SENTRY_DSN" ]; then
  echo "⚠️  SENTRY_DSN not set. Sentry error tracking will be disabled."
  echo "   To enable: export SENTRY_DSN=https://key@sentry.io/projectid"
else
  echo "✅ Sentry configured: $SENTRY_DSN"
fi

# 3. Verify Database Connection for Performance Monitoring
echo -e "${BLUE}Step 3: Verifying Database Connection...${NC}"
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set. Database performance monitoring requires this."
  exit 1
else
  echo "✅ Database URL configured"
fi

# 4. Performance Metrics Configuration
echo -e "${BLUE}Step 4: Setting Performance Monitoring Variables...${NC}"
export PERFORMANCE_MONITORING_ENABLED="${PERFORMANCE_MONITORING_ENABLED:-true}"
export SLOW_QUERY_THRESHOLD="${SLOW_QUERY_THRESHOLD:-1000}" # ms
export SLOW_API_THRESHOLD="${SLOW_API_THRESHOLD:-500}" # ms

echo "  Performance Monitoring: $PERFORMANCE_MONITORING_ENABLED"
echo "  Slow Query Threshold: ${SLOW_QUERY_THRESHOLD}ms"
echo "  Slow API Threshold: ${SLOW_API_THRESHOLD}ms"

# 5. Web Vitals Monitoring
echo -e "${BLUE}Step 5: Configuring Web Vitals Monitoring...${NC}"
if [ -z "$NEXT_PUBLIC_ENV" ]; then
  export NEXT_PUBLIC_ENV="production"
fi
echo "  Environment: $NEXT_PUBLIC_ENV"
echo "  Web Vitals will be reported to:"
echo "    - Vercel Analytics"
echo "    - Datadog RUM"

# 6. Database Indexes
echo -e "${BLUE}Step 6: Creating Performance Indexes...${NC}"
echo "   Run the following SQL commands to optimize database performance:"
echo ""
echo "   CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);"
echo "   CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON shipments(\"driverId\");"
echo "   CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(\"createdAt\" DESC);"
echo "   CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);"
echo "   CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(\"createdAt\" DESC);"
echo ""

# 7. Verify Datadog Agent (if running locally)
echo -e "${BLUE}Step 7: Verifying Datadog Agent...${NC}"
if command -v datadog-agent &> /dev/null; then
  echo "✅ Datadog Agent found"
  if datadog-agent status 2>/dev/null | grep -q "running"; then
    echo "✅ Datadog Agent is running"
  else
    echo "⚠️  Datadog Agent found but not running. Start with: brew services start datadog-agent"
  fi
else
  echo "ℹ️  Datadog Agent not found (expected in production environment)"
fi

echo ""
echo -e "${GREEN}✅ Production Monitoring Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Set any missing environment variables (see above)"
echo "2. Run database indexes for performance: psql \$DATABASE_URL < scripts/db-indexes.sql"
echo "3. Deploy to production: git push"
echo "4. Monitor metrics at:"
echo "   - Datadog: https://app.datadoghq.com"
echo "   - Sentry: https://sentry.io"
echo "   - Vercel Analytics: https://vercel.com"
echo ""
echo "Environment Variables Set:"
env | grep -E "DD_|SENTRY_|DATABASE_|PERFORMANCE_" || echo "(none)"
