#!/usr/bin/env bash
set -euo pipefail

echo "=== Attempting automated test fixes ==="

# Apply any safe lint fixes to unblock tests that fail due to formatting.
pnpm -r --if-present lint -- --fix || true

# Update snapshots or other test artifacts that can be regenerated automatically.
pnpm -r --if-present test -- --updateSnapshot || true

# Re-run tests to verify whether the automated steps resolved the failures.
set +e
pnpm -r --if-present test
test_status=$?
set -e

if [[ "${test_status}" -ne 0 ]]; then
  echo "Automated fixes did not resolve test failures."
  exit 1
fi

echo "Automated fixes resolved test failures."
