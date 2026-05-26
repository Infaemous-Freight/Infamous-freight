#!/usr/bin/env bash
set -euo pipefail

FLY_APP="${FLY_APP:-infamous-freight-api}"

required_secrets=(
  DATABASE_URL
  SUPABASE_URL
  SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_JWT_SECRET
  JWT_SECRET
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  REDIS_URL
  CORS_ORIGINS
  WEB_APP_URL
  NODE_ENV
  PORT
)

need_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "ERROR: Required CLI missing: ${cmd}" >&2
    exit 1
  fi
}

need_cmd flyctl

echo "Auditing Fly production secret names for app: ${FLY_APP}"
echo "This script prints names/status only. It never prints secret values."

if ! flyctl auth whoami >/dev/null 2>&1; then
  echo "ERROR: flyctl is not authenticated. Run: flyctl auth login" >&2
  exit 1
fi

secret_names="$({ flyctl secrets list -a "${FLY_APP}" 2>/dev/null || true; } | awk 'NR > 1 {print $1}')"

if [[ -z "${secret_names}" ]]; then
  echo "ERROR: No Fly secrets returned for ${FLY_APP}. Check app name and Fly permissions." >&2
  exit 1
fi

missing=()
for name in "${required_secrets[@]}"; do
  if grep -qx "${name}" <<<"${secret_names}"; then
    echo "OK: ${name}"
  else
    echo "MISSING: ${name}"
    missing+=("${name}")
  fi
done

if [[ "${#missing[@]}" -gt 0 ]]; then
  echo
  echo "Missing required Fly secret names: ${missing[*]}" >&2
  echo "Set them with flyctl secrets set NAME=value -a ${FLY_APP}. Do not print values in logs." >&2
  exit 1
fi

echo
flyctl config validate --config fly.toml
flyctl checks list -a "${FLY_APP}"

echo
curl -fsS "https://${FLY_APP}.fly.dev/api/health/live" >/dev/null

echo "Fly production secret audit and liveness check passed."
