#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${1:-}"
REGION="${2:-dfw}"

if [[ -z "$APP_NAME" ]]; then
  echo "Usage: $0 <app-name> [region]"
  exit 1
fi

if ! command -v flyctl >/dev/null 2>&1; then
  echo "flyctl is required. Install: https://fly.io/docs/hands-on/install-flyctl/"
  exit 1
fi

if [[ -z "${FLY_API_TOKEN:-}" ]]; then
  echo "FLY_API_TOKEN must be set in the environment."
  exit 1
fi

echo "Launching Fly app '$APP_NAME' in region '$REGION' from this repo..."
flyctl launch \
  --name "$APP_NAME" \
  --region "$REGION" \
  --copy-config \
  --remote-only \
  --now

echo "Done. Validate health endpoints:"
echo "  https://${APP_NAME}.fly.dev/health"
echo "  https://${APP_NAME}.fly.dev/api/health"
