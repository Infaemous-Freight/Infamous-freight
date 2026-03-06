#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

changed="$(git diff --cached --name-only --diff-filter=ACMR || true)"

if [[ -z "$changed" ]]; then
  echo "✅ No staged changes"
  exit 0
fi

if echo "$changed" | grep -q '^compliance/'; then
  echo "❌ New staged changes detected in deprecated root: compliance/"
  echo "Move compliance code into @compliance/ unless the change is migration-only."
  exit 1
fi

if echo "$changed" | grep -q '^load-tests/'; then
  echo "❌ New staged changes detected in transitional root: load-tests/"
  echo "Move performance scenarios into k6/ unless this is an intentional migration."
  exit 1
fi

echo "✅ Deprecated root guard passed"
