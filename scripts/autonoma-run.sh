#!/usr/bin/env bash
set -euo pipefail

FOLDER_ID="${1:-${AUTONOMA_FOLDER_ID:-${FOLDER_ID:-}}}"
CLIENT_ID="${2:-${AUTONOMA_CLIENT_ID:-${CLIENT_ID:-}}}"
CLIENT_SECRET="${3:-${AUTONOMA_CLIENT_SECRET:-${CLIENT_SECRET:-}}}"

if [[ -z "$FOLDER_ID" || -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]]; then
  echo "Usage: $0 <folder-id> <client-id> <client-secret>" >&2
  echo "Or set AUTONOMA_FOLDER_ID/FOLDER_ID, AUTONOMA_CLIENT_ID/CLIENT_ID, and AUTONOMA_CLIENT_SECRET/CLIENT_SECRET." >&2
  exit 1
fi

curl -X POST \
  --silent \
  --retry 3 \
  --retry-connrefused \
  --location "https://api.prod.autonoma.app/v1/run/folder/${FOLDER_ID}" \
  --header "autonoma-client-id: ${CLIENT_ID}" \
  --header "autonoma-client-secret: ${CLIENT_SECRET}" \
  --header "Content-Type: application/json" || true
