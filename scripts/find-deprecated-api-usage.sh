#!/usr/bin/env bash
set -Eeuo pipefail

PATTERN="${1:-deprecatedApiFunction}"

echo "==> Searching repository for deprecated API usage pattern: ${PATTERN}"

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required." >&2
  exit 1
fi

matches="$(rg -n --glob '!node_modules/**' --glob '!.next/**' --glob '!dist/**' "${PATTERN}" . || true)"

if [ -z "${matches}" ]; then
  echo "No matches found for pattern: ${PATTERN}"
  exit 0
fi

echo "${matches}"
