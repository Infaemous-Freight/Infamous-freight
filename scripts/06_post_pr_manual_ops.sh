#!/usr/bin/env bash
set -euo pipefail

# Purpose: run post-merge verification checks that do not require secrets.
# NOTE: GitHub PR creation/merge, Netlify env management, PagerDuty key generation,
# and Supabase dashboard security toggles must be completed in authenticated sessions.

BASE_WEB_URL="https://www.infamousfreight.com"
ALT_WEB_URL="https://infamousfreight.com"
FLY_API_URL="https://infamous-freight-api.fly.dev"

echo "[1/4] Verifying production web domain headers"
curl -I "$BASE_WEB_URL"
curl -I "$ALT_WEB_URL"

echo "[2/4] Verifying production API endpoints via www domain"
curl "$BASE_WEB_URL/api/health"
curl "$BASE_WEB_URL/api/metrics"
curl "$BASE_WEB_URL/api/health/performance"
curl "$BASE_WEB_URL/api/health/database"

echo "[3/4] Verifying Fly liveness endpoint"
curl -i "$FLY_API_URL/api/health/live"

echo "[4/4] Verifying local deploy config"
flyctl config validate --config fly.toml
flyctl checks list -a infamous-freight-api

echo "Post-PR verification commands completed."
