#!/usr/bin/env bash
set -euo pipefail

REQUIRE_OPENAI_SDK="${REQUIRE_OPENAI_SDK:-false}"

echo "==> Checking AI SDK configuration"

if node -e "require.resolve('openai')" >/dev/null 2>&1; then
  echo "openai sdk: installed"
else
  echo "openai sdk: not installed"
  echo "Install it intentionally and commit package-lock.json before enabling live AI runtime checks."

  if [ "$REQUIRE_OPENAI_SDK" = "true" ]; then
    echo "REQUIRE_OPENAI_SDK=true, failing because openai is not installed."
    exit 1
  fi
fi

if [ -n "${OPENAI_API_KEY:-}" ]; then
  echo "OPENAI_API_KEY is configured"
else
  echo "OPENAI_API_KEY is not set"
fi
