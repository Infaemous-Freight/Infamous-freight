#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_PATH="${1:-$ROOT_DIR/fly.api.toml}"

if [ ! -f "$CONFIG_PATH" ]; then
  echo "ERROR: Fly config not found at $CONFIG_PATH"
  exit 1
fi

resolve_flyctl() {
  if command -v flyctl >/dev/null 2>&1; then
    command -v flyctl
    return 0
  fi

  if [ -x "$HOME/.fly/bin/flyctl" ]; then
    echo "$HOME/.fly/bin/flyctl"
    return 0
  fi

  if [ -x "/home/vscode/.fly/bin/flyctl" ]; then
    echo "/home/vscode/.fly/bin/flyctl"
    return 0
  fi

  echo "ERROR: flyctl not found. Install it first: https://fly.io/docs/hands-on/install-flyctl/"
  return 1
}

FLYCTL_BIN="$(resolve_flyctl)"

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

if [ -z "${FLY_API_TOKEN:-}" ] && [ -z "${FLY_ACCESS_TOKEN:-}" ]; then
  echo "INFO: No Fly token env var set. Relying on existing flyctl auth session."
fi

if ! "$FLYCTL_BIN" auth whoami >/dev/null 2>&1; then
  echo "ERROR: flyctl is not authenticated."
  echo "Run one of the following before deploying:"
  echo "  1) flyctl auth login"
  echo "  2) export FLY_API_TOKEN=<token>"
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
