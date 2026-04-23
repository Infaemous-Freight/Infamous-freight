#!/bin/bash

set -euo pipefail

REPO="${REPO:-Infaemous-Freight/Infamous-freight}"

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "❌ Required command not found: $cmd"
    exit 1
  fi
}

read_secret() {
  local key="$1"
  local prompt="$2"
  local is_sensitive="${3:-false}"
  local current="${!key:-}"

  if [[ -n "$current" ]]; then
    echo "$current"
    return
  fi

  # If running non-interactively, do not prompt
  if [[ ! -t 0 ]]; then
    echo ""
    return
  fi

  if [[ "$is_sensitive" == "true" ]]; then
    read -rsp "$prompt: " value
    echo
  else
    read -rp "$prompt: " value
  fi
  echo "$value"
}

set_secret() {
  local key="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "⚠️  $key missing - skipped"
    return 0
  fi
  gh secret set "$key" --repo "$REPO" --body "$value"
  echo "✅ $key set"
}

require_cmd gh

if ! gh auth status >/dev/null 2>&1; then
  echo "❌ GitHub CLI is not authenticated. Run: gh auth login"
  exit 1
fi

echo "🔐 Setting GitHub Actions secrets for $REPO"

VITE_API_URL="$(read_secret VITE_API_URL 'VITE_API_URL')"
VITE_STRIPE_PUBLIC_KEY="$(read_secret VITE_STRIPE_PUBLIC_KEY 'VITE_STRIPE_PUBLIC_KEY')"
FLY_API_TOKEN="$(read_secret FLY_API_TOKEN 'FLY_API_TOKEN' true)"
VERCEL_TOKEN="$(read_secret VERCEL_TOKEN 'VERCEL_TOKEN' true)"
VERCEL_ORG_ID="$(read_secret VERCEL_ORG_ID 'VERCEL_ORG_ID')"
VERCEL_PROJECT_ID="$(read_secret VERCEL_PROJECT_ID 'VERCEL_PROJECT_ID')"
SENTRY_AUTH_TOKEN="$(read_secret SENTRY_AUTH_TOKEN 'SENTRY_AUTH_TOKEN' true)"
SENTRY_ORG="$(read_secret SENTRY_ORG 'SENTRY_ORG')"
SENTRY_PROJECT="$(read_secret SENTRY_PROJECT 'SENTRY_PROJECT')"

set_secret VITE_API_URL "$VITE_API_URL"
set_secret VITE_STRIPE_PUBLIC_KEY "$VITE_STRIPE_PUBLIC_KEY"
set_secret FLY_API_TOKEN "$FLY_API_TOKEN"
set_secret VERCEL_TOKEN "$VERCEL_TOKEN"
set_secret VERCEL_ORG_ID "$VERCEL_ORG_ID"
set_secret VERCEL_PROJECT_ID "$VERCEL_PROJECT_ID"
set_secret SENTRY_AUTH_TOKEN "$SENTRY_AUTH_TOKEN"
set_secret SENTRY_ORG "$SENTRY_ORG"
set_secret SENTRY_PROJECT "$SENTRY_PROJECT"

echo "✅ Secret setup complete. Verifying..."
gh secret list --repo "$REPO"
