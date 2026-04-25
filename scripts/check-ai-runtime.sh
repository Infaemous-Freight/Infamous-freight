#!/usr/bin/env bash
set -euo pipefail

echo "==> Checking AI SDK installation"
node -e "require(require.resolve('openai', { paths: ['apps/api/node_modules', 'node_modules'] })); console.log('openai sdk: installed')"

if [ -n "${OPENAI_API_KEY:-}" ]; then
  echo "==> OPENAI_API_KEY is configured"
else
  echo "==> OPENAI_API_KEY is not set (set it to enable live AI calls)"
fi
