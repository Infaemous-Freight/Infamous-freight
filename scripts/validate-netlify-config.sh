#!/usr/bin/env bash
set -euo pipefail

if rg -n "disable\s*=\s*true" netlify.toml >/dev/null 2>&1; then
  echo "Invalid Netlify config: do not use disable=true for @sentry/netlify-build-plugin" >&2
  exit 1
fi

if ! rg -n "SENTRY_DISABLE_UPLOAD\s*=\s*\"true\"" netlify.toml >/dev/null 2>&1; then
  echo "Expected SENTRY_DISABLE_UPLOAD=\"true\" in netlify.toml" >&2
  exit 1
fi

echo "Netlify config validation passed"
