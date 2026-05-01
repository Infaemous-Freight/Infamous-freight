#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TOOLS_DIR="${REPO_ROOT}/.tools/bin"
missing=0

check_cli() {
  local cli="$1"
  if command -v "$cli" >/dev/null 2>&1 || [[ -x "${TOOLS_DIR}/${cli}" ]]; then
    echo "✅ ${cli} found"
  else
    echo "❌ ${cli} missing (run: pnpm run setup:clis)" >&2
    missing=1
  fi
}

check_cli flyctl
check_cli supabase
check_cli stripe

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

echo "All required Infamous Freight tools are installed."
