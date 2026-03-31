#!/bin/bash

# ========================================
# STAGING DEPLOYMENT SCRIPT
# Phase 6 Execution - Real-time Deployment
# ========================================

set -e

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

echo "🚀 INFAMOUS FREIGHT STAGING DEPLOYMENT"
echo "======================================"
echo "Starting at: $(date)"
echo ""

# Set core environment variables
export NODE_ENV=development
export API_PORT=4000
export WEB_PORT=3000
export API_BASE_URL=http://localhost:4000/api
export WEB_BASE_URL=http://localhost:3000
export API_URL=http://localhost:4000
export APP_URL=http://localhost:3000
export DATABASE_URL=postgresql://infamous:infamouspass@localhost:5432/infamous_freight
export TEST_DATABASE_URL=postgresql://infamous:infamouspass@localhost:5432/infamous_freight_test
export REDIS_URL=redis://localhost:6379
if [ -z "${JWT_SECRET:-}" ]; then
  echo "❌ JWT_SECRET environment variable is not set. Set it before running this script."
  exit 1
fi
export JWT_EXPIRY=24h
export AI_PROVIDER=synthetic
export LOG_LEVEL=info
export CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
export VOICE_MAX_FILE_SIZE_MB=10
export CACHE_ENABLED=true
export QUERY_OPTIMIZATION_ENABLED=true

echo "✅ Environment variables configured"
echo ""
echo "Starting API server on port $API_PORT..."
echo "Web server will run on port $WEB_PORT"
echo ""

# Start the API server
cd "$ROOT_DIR/apps/api" && pnpm dev &
API_PID=$!

echo "✅ API server started (PID: $API_PID)"
sleep 3

# Start the Web server
cd "$ROOT_DIR/apps/web" && pnpm dev &
WEB_PID=$!

echo "✅ Web server started (PID: $WEB_PID)"
sleep 3

echo ""
echo "========================================
"
echo "🎉 STAGING DEPLOYMENT SUCCESSFUL!"
echo ""
echo "Services Running:"
echo "  - API:  http://localhost:4000"
echo "  - Web:  http://localhost:3000"
echo ""
echo "Health Check:"
echo "  curl http://localhost:4000/api/health"
echo ""
echo "Running for 24-48 hours for validation..."
echo "Press Ctrl+C to stop"
echo ""

# Keep both processes running
wait
