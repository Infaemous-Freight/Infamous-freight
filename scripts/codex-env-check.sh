#!/usr/bin/env bash
set -euo pipefail

# Codex environment diagnostics for Infamous Freight.
# This script checks whether required environment variables are present without printing secret values.

printf '\n== Codex Environment Check ==\n\n'

required_vars=(
  NODE_ENV
  DATABASE_URL
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_PUBLISHABLE_KEY
  VITE_STRIPE_PUBLIC_KEY
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  SUPABASE_ANON_KEY
  VITE_SUPABASE_URL
  VITE_SUPABASE_PUBLISHABLE_KEY
)

optional_vars=(
  PORT
  REDIS_HOST
  REDIS_PORT
  REDIS_PASSWORD
  REDIS_DB
  JWT_SECRET
  API_RATE_LIMIT_ENABLED
  SENTRY_DSN
  VITE_API_URL
  VITE_SOCKET_URL
  VITE_SENTRY_DSN
  VITE_SENTRY_ENABLED
  SENTRY_ORG
  SENTRY_PROJECT
  SENTRY_AUTH_TOKEN
  DAT_API_KEY
  TRUCKSTOP_API_KEY
  LOADBOARD_API_KEY
  SAMSARA_API_TOKEN
  MOTIVE_CLIENT_ID
  MOTIVE_CLIENT_SECRET
  QBO_CLIENT_ID
  QBO_CLIENT_SECRET
  XERO_CLIENT_ID
  XERO_CLIENT_SECRET
  SENDGRID_API_KEY
  FROM_EMAIL
  RTS_API_KEY
  OTR_API_KEY
  APEX_API_KEY
)

check_var() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    echo "✅ ${name} is set"
  else
    echo "❌ ${name} is NOT set"
  fi
}

echo "Required / core variables:"
for var in "${required_vars[@]}"; do
  check_var "$var"
done

printf '\nOptional integration variables:\n'
for var in "${optional_vars[@]}"; do
  check_var "$var"
done

printf '\nSafe environment inventory — names only, no values:\n'
printenv | cut -d= -f1 | sort

printf '\nDone. No secret values were printed.\n'
