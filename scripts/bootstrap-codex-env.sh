#!/usr/bin/env bash
set -euo pipefail

# Safe helper for local/Codex shells. It only maps already-present values and
# never prints secret values. Source this file, then rerun scripts/codex-env-check.sh:
#
#   source scripts/bootstrap-codex-env.sh
#   bash scripts/codex-env-check.sh

set_default() {
  local name="$1"
  local value="$2"
  if [ -z "${!name:-}" ] && [ -n "$value" ]; then
    export "$name=$value"
    echo "set $name from available alias"
  fi
}

set_default NODE_ENV "production"
set_default DATABASE_URL "${SUPABASE_DATABASE_URL:-}"
set_default SUPABASE_URL "${NEXT_PUBLIC_SUPABASE_URL:-}"
set_default VITE_SUPABASE_URL "${NEXT_PUBLIC_SUPABASE_URL:-}"
set_default WEB_APP_URL "https://www.infamousfreight.com"
set_default SITE_URL "https://www.infamousfreight.com"
set_default PUBLIC_SITE_URL "https://www.infamousfreight.com"
set_default FRONTEND_URL "https://www.infamousfreight.com"
set_default API_PUBLIC_URL "https://api.infamousfreight.com"
set_default VITE_API_URL "https://api.infamousfreight.com"
set_default VITE_SOCKET_URL "https://api.infamousfreight.com"
set_default CORS_ORIGINS "https://www.infamousfreight.com,https://infamousfreight.com"
set_default STRIPE_CHECKOUT_SUCCESS_URL "https://www.infamousfreight.com/billing/success"
set_default STRIPE_CHECKOUT_CANCEL_URL "https://www.infamousfreight.com/billing/cancel"
set_default STRIPE_PORTAL_RETURN_URL "https://www.infamousfreight.com/settings/billing"

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "missing STRIPE_SECRET_KEY: set this in the private Codex/shell secret store"
fi

if [ -z "${STRIPE_WEBHOOK_SECRET:-}" ]; then
  echo "missing STRIPE_WEBHOOK_SECRET: set this in the private Codex/shell secret store"
fi

if [ -z "${STRIPE_PUBLISHABLE_KEY:-}" ] && [ -z "${VITE_STRIPE_PUBLIC_KEY:-}" ]; then
  echo "missing Stripe publishable key: set STRIPE_PUBLISHABLE_KEY or VITE_STRIPE_PUBLIC_KEY privately"
fi

echo "Codex env bootstrap complete. No secret values were printed."
