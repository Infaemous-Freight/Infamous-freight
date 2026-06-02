#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PATTERNS=(
  "x-tenant-id"
  "x-user-role"
  "subscription-status"
)

ALLOWLIST_REGEX='(docs/|README|CHANGELOG|test/|tests/|__tests__/|audit-header-auth\.sh|LAUNCH_READINESS|PRODUCTION_MONITORING)'
found=0

for pattern in "${PATTERNS[@]}"; do
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    file="${line%%:*}"
    if [[ "$file" =~ $ALLOWLIST_REGEX ]]; then
      continue
    fi
    echo "Forbidden header-auth reference: $line"
    found=1
  done < <(grep -RIn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=coverage "$pattern" . || true)
done

if [ "$found" -ne 0 ]; then
  echo "Header-auth audit failed. Production tenant/auth context must come from verified identity, not spoofable request headers." >&2
  exit 1
fi

echo "Header-auth audit passed."
