#!/usr/bin/env bash
set -euo pipefail

matches_pattern() {
  local pattern="$1"
  local file="$2"

  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" "$file" >/dev/null 2>&1
  else
    grep -En "$pattern" "$file" >/dev/null 2>&1
  fi
}

if matches_pattern "disable\s*=\s*true" netlify.toml; then
  echo "Invalid Netlify config: do not use disable=true for @sentry/netlify-build-plugin" >&2
  exit 1
fi

if ! matches_pattern "SENTRY_DISABLE_UPLOAD\s*=\s*\"true\"" netlify.toml; then
  echo "Expected SENTRY_DISABLE_UPLOAD=\"true\" in netlify.toml" >&2
  exit 1
fi

echo "Netlify config validation passed"
