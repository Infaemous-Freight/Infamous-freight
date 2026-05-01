#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-infamous-freight}"
PRIMARY_REGION="${PRIMARY_REGION:-dfw}"
POSTGRES_APP_NAME="${POSTGRES_APP_NAME:-}"
CORS_ORIGINS="${CORS_ORIGINS:-https://www.infamousfreight.com,https://infamousfreight.com}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' is not installed." >&2
    exit 1
  fi
}

require_cmd flyctl
require_cmd curl

echo "==> Checking Fly authentication"
flyctl auth whoami >/dev/null

echo "==> Current Fly app status"
flyctl status -a "$APP_NAME" || true

echo "==> Current Fly secrets"
flyctl secrets list -a "$APP_NAME" || true

if [[ -n "$POSTGRES_APP_NAME" ]]; then
  echo "==> Attaching Postgres app '$POSTGRES_APP_NAME' to '$APP_NAME'"
  flyctl postgres attach "$POSTGRES_APP_NAME" -a "$APP_NAME"
else
  echo "==> POSTGRES_APP_NAME not set; skipping postgres attach."
  echo "    To attach Postgres, run: POSTGRES_APP_NAME=<postgres-app> bash scripts/fly-runtime-repair.sh"
fi

echo "==> Setting non-sensitive runtime CORS secret"
flyctl secrets set "CORS_ORIGINS=$CORS_ORIGINS" -a "$APP_NAME"

echo "==> Deploying secrets"
flyctl secrets deploy -a "$APP_NAME" || true

echo "==> Ensuring one warm machine in $PRIMARY_REGION"
flyctl scale count 1 --region "$PRIMARY_REGION" -a "$APP_NAME"

echo "==> Restarting app machines"
flyctl machine restart -a "$APP_NAME" || true

echo "==> Waiting for API health"
for attempt in {1..20}; do
  if curl --fail --silent --show-error "https://$APP_NAME.fly.dev/api/health" >/tmp/fly-health.json; then
    echo "Health check passed:"
    cat /tmp/fly-health.json
    echo
    break
  fi

  if [[ "$attempt" == "20" ]]; then
    echo "Health check did not pass after $attempt attempts." >&2
    echo "==> Current checks"
    flyctl checks list -a "$APP_NAME" || true
    echo "==> Recent logs"
    flyctl logs -a "$APP_NAME" --no-tail || true
    exit 1
  fi

  echo "Health not ready yet; retrying ($attempt/20)..."
  sleep 10
done

echo "==> Final checks"
flyctl status -a "$APP_NAME" || true
flyctl checks list -a "$APP_NAME" || true
