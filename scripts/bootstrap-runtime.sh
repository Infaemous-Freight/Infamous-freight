#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  echo "NVM is required but was not found at $NVM_DIR/nvm.sh" >&2
  exit 1
fi

# shellcheck disable=SC1090
. "$NVM_DIR/nvm.sh"

nvm install >/dev/null
nvm use >/dev/null

if ! corepack enable >/dev/null; then
  echo "Failed to enable Corepack. Ensure 'corepack' is installed and accessible." >&2
  exit 1
fi

if ! corepack prepare pnpm@10.15.0 --activate >/dev/null; then
  echo "Failed to prepare pnpm via Corepack. Check Corepack availability, permissions, and network access." >&2
  exit 1
fi
node_version="$(node -v)"
pnpm_version="$(pnpm -v)"

echo "Runtime ready: node ${node_version}, pnpm ${pnpm_version}"
