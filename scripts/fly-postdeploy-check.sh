#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${1:-}"
HEALTH_URL="${2:-}"

if [ -z "$APP_NAME" ] || [ -z "$HEALTH_URL" ]; then
  echo "Usage: $0 <app-name> <health-url>" >&2
  exit 1
fi

STATUS_RETRIES="${FLY_STATUS_RETRIES:-18}"
STATUS_DELAY="${FLY_STATUS_DELAY_SECONDS:-10}"
HEALTH_RETRIES="${FLY_HEALTH_RETRIES:-18}"
HEALTH_DELAY="${FLY_HEALTH_DELAY_SECONDS:-10}"
LOCAL_PATH="$(printf '%s' "$HEALTH_URL" | sed -E 's#^[A-Za-z]+://[^/]+##')"

echo "Waiting for Fly app $APP_NAME to report a started machine"

status_attempt=1
while [ "$status_attempt" -le "$STATUS_RETRIES" ]; do
  status_json="$(flyctl status -a "$APP_NAME" --json)"
  machines_json="$(flyctl machines list -a "$APP_NAME" --json)"
  app_status="$(printf '%s' "$status_json" | jq -r '.Status // "unknown"')"
  started_count="$(printf '%s' "$machines_json" | jq '[.[]? | select(.state == "started")] | length')"

  if [ "$started_count" -gt 0 ] && [ "$app_status" != "suspended" ]; then
    echo "Fly app is ready for health probing (status=$app_status, started=$started_count)"
    break
  fi

  if [ "$status_attempt" -eq "$STATUS_RETRIES" ]; then
    echo "Fly app did not reach a started state (status=$app_status, started=$started_count)" >&2
    exit 1
  fi

  echo "Attempt $status_attempt/$STATUS_RETRIES: status=$app_status started=$started_count"
  sleep "$STATUS_DELAY"
  status_attempt=$((status_attempt + 1))
done

echo "Checking health endpoint $HEALTH_URL"

health_attempt=1
while [ "$health_attempt" -le "$HEALTH_RETRIES" ]; do
  http_code="$(curl -sS --connect-timeout 5 --max-time 20 -o /tmp/fly-health.json -w '%{http_code}' "$HEALTH_URL" || true)"

  if [ "$http_code" = "200" ]; then
    echo "Health check passed with HTTP 200"
    cat /tmp/fly-health.json
    exit 0
  fi

  if [ "$health_attempt" -eq "$HEALTH_RETRIES" ]; then
    if [ -n "$LOCAL_PATH" ]; then
      echo "Public health check failed; trying in-machine fallback via Fly SSH"
      if flyctl ssh console -a "$APP_NAME" -C "wget -qO- http://127.0.0.1:4000$LOCAL_PATH"; then
        echo "In-machine health check passed"
        exit 0
      fi
    fi

    echo "Health check failed after $HEALTH_RETRIES attempts (last HTTP $http_code)" >&2
    exit 1
  fi

  echo "Attempt $health_attempt/$HEALTH_RETRIES: HTTP $http_code"
  sleep "$HEALTH_DELAY"
  health_attempt=$((health_attempt + 1))
done
