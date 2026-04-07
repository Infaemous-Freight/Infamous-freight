#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_PATH="${1:-$ROOT_DIR/fly.api.toml}"

if [ ! -f "$CONFIG_PATH" ]; then
  echo "ERROR: Fly config not found at $CONFIG_PATH"
  exit 1
fi

if command -v flyctl >/dev/null 2>&1; then
  FLYCTL_BIN="flyctl"
elif [ -n "${FLYCTL_INSTALL:-}" ] && [ -x "$FLYCTL_INSTALL/bin/flyctl" ]; then
  FLYCTL_BIN="$FLYCTL_INSTALL/bin/flyctl"
elif [ -x "${HOME:-}/.fly/bin/flyctl" ]; then
  FLYCTL_BIN="${HOME:-}/.fly/bin/flyctl"
elif [ -x "/home/vscode/.fly/bin/flyctl" ]; then
  FLYCTL_BIN="/home/vscode/.fly/bin/flyctl"
else
  echo "ERROR: flyctl not found. Install it first: https://fly.io/docs/hands-on/install-flyctl/"
  exit 1
fi

config_app="$(awk -F'=' '/^[[:space:]]*app[[:space:]]*=/{gsub(/[[:space:]\047\042]/, "", $2); print $2; exit}' "$CONFIG_PATH")"
config_dockerfile="$(awk -F'=' '/^[[:space:]]*dockerfile[[:space:]]*=/{gsub(/[[:space:]\047\042]/, "", $2); print $2; exit}' "$CONFIG_PATH")"

if [ -z "$config_app" ]; then
  echo "ERROR: Could not resolve app from config ($CONFIG_PATH)."
  exit 1
fi

TARGET_APP="${FLY_APP:-$config_app}"
TARGET_ORG="${FLY_ORG:-}"

echo "Running Fly preflight checks"
echo "Config: $CONFIG_PATH"
echo "Target app: $TARGET_APP"

# Fly CLI expects FLY_ACCESS_TOKEN. Normalize from legacy/new env var naming.
if [ -z "${FLY_ACCESS_TOKEN:-}" ] && [ -n "${FLY_API_TOKEN:-}" ]; then
  export FLY_ACCESS_TOKEN="$FLY_API_TOKEN"
fi

if [ -z "${FLY_API_TOKEN:-}" ] && [ -z "${FLY_ACCESS_TOKEN:-}" ]; then
  echo "INFO: No Fly token env var set. Relying on existing flyctl auth session."
fi

if ! "$FLYCTL_BIN" auth whoami >/dev/null 2>&1; then
  echo "ERROR: flyctl is not authenticated."
  echo "Set FLY_ACCESS_TOKEN (or FLY_API_TOKEN) or run: flyctl auth login"
  exit 1
fi

if [ -n "$config_dockerfile" ] && [ ! -f "$ROOT_DIR/$config_dockerfile" ]; then
  echo "ERROR: Dockerfile from config does not exist: $config_dockerfile"
  exit 1
fi

if [ -n "$TARGET_ORG" ]; then
  APPS_OUTPUT="$("$FLYCTL_BIN" apps list --org "$TARGET_ORG" 2>/dev/null || true)"
else
  APPS_OUTPUT="$("$FLYCTL_BIN" apps list 2>/dev/null || true)"
fi

if [ -z "$APPS_OUTPUT" ]; then
  echo "ERROR: Could not list Fly apps for this account/token."
  exit 1
fi

if ! echo "$APPS_OUTPUT" | awk 'NR>1 {print $1}' | grep -Fxq "$TARGET_APP"; then
  echo "ERROR: Target app '$TARGET_APP' is not visible to this Fly auth context."
  echo "Set FLY_APP to an accessible app name or grant access to '$TARGET_APP'."
  exit 1
fi

echo "Validating Fly config"
if ! "$FLYCTL_BIN" config validate -c "$CONFIG_PATH" >/dev/null; then
  echo "ERROR: Fly config validation failed for $CONFIG_PATH"
  exit 1
fi

echo "Preflight passed"
