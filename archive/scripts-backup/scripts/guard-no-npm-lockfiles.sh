#!/usr/bin/env bash
set -euo pipefail

if git ls-files '**/package-lock.json' | grep -q .; then
  echo "ERROR: package-lock.json is tracked in git. Remove it and use pnpm-lock.yaml only."
  git ls-files '**/package-lock.json'
  exit 1
fi

if find . -name package-lock.json -not -path './node_modules/*' -print | grep -q .; then
  echo "ERROR: package-lock.json exists in the working tree. Remove it."
  find . -name package-lock.json -not -path './node_modules/*' -print
  exit 1
fi

echo "OK: No package-lock.json found."
