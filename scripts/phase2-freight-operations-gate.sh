#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_files=(
  "docs/PHASE2_FREIGHT_OPERATIONS_COMPLETION.md"
  "scripts/audit-direct-stripe-schema-access.sh"
  "apps/api/src/dispatch-automation.ts"
  "apps/api/test/dispatch-automation.test.ts"
  "netlify.toml"
)

missing=0
for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Missing Phase 2 artifact: $file" >&2
    missing=1
  else
    echo "✓ $file"
  fi
done

if [ "$missing" -ne 0 ]; then
  echo "Phase 2 gate failed: missing required freight-operations artifacts." >&2
  exit 1
fi

bash scripts/audit-direct-stripe-schema-access.sh

if [ -f apps/api/test/dispatch-automation.test.ts ]; then
  pnpm -C apps/api run test -- --runInBand dispatch-automation.test.ts
fi

echo "Phase 2 freight operations repository gate passed."
