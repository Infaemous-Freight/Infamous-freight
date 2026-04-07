#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_PATH="${1:-$ROOT_DIR/fly.api.toml}"

resolve_flyctl() {
  if command -v flyctl >/dev/null 2>&1; then
    command -v flyctl
    return 0
  fi

  local home_flyctl=""
  if [ -n "${HOME:-}" ]; then
    home_flyctl="${HOME}/.fly/bin/flyctl"
  fi

  if [ -n "$home_flyctl" ] && [ -x "$home_flyctl" ]; then
    echo "$home_flyctl"
    return 0
  fi

  if [ -x "/home/vscode/.fly/bin/flyctl" ]; then
    echo "/home/vscode/.fly/bin/flyctl"
    return 0
  fi

  echo "ERROR: flyctl not found."
  return 1
}

if ! FLYCTL_BIN="$(resolve_flyctl)"; then
  echo "ERROR: flyctl not found." >&2
  exit 1
fi

TARGET_APP="${FLY_APP:-$(awk -F'=' '/^[[:space:]]*app[[:space:]]*=/{gsub(/[[:space:]\047\042]/, "", $2); print $2; exit}' "$CONFIG_PATH")}"

bash "$ROOT_DIR/scripts/fly-preflight.sh" "$CONFIG_PATH"

echo "Deploying API app '$TARGET_APP' using $CONFIG_PATH"
exec "$FLYCTL_BIN" deploy -c "$CONFIG_PATH" --app "$TARGET_APP"
