#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ "${1:-}" != "" ] && [[ "${1}" == *.toml ]]; then
  CONFIG_PATH="$1"
  shift
else
  CONFIG_PATH="$ROOT_DIR/fly.toml"
fi

if [ ! -f "$CONFIG_PATH" ]; then
  echo "ERROR: Fly config not found at $CONFIG_PATH"
  exit 1
fi

if command -v flyctl >/dev/null 2>&1; then
  FLYCTL_BIN="flyctl"
elif [ -x "/home/vscode/.fly/bin/flyctl" ]; then
  FLYCTL_BIN="/home/vscode/.fly/bin/flyctl"
else
  echo "ERROR: flyctl not found."
  exit 1
fi

TARGET_APP="${FLY_APP:-$(awk -F'=' '/^[[:space:]]*app[[:space:]]*=/{gsub(/[[:space:]\047\042]/, "", $2); print $2; exit}' "$CONFIG_PATH")}"

if [ -z "$TARGET_APP" ]; then
  echo "ERROR: Could not resolve app from config ($CONFIG_PATH)."
  exit 1
fi

# Deploy from repository root so Docker context always includes workspace files.
cd "$ROOT_DIR"

exec "$FLYCTL_BIN" deploy \
  --config "$CONFIG_PATH" \
  --app "$TARGET_APP" \
  "$@" \
  .
