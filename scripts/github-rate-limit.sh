#!/usr/bin/env bash
set -Eeuo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required to check API rate limits." >&2
  exit 1
fi

echo "==> GitHub API rate limit (core)"
gh api rate_limit --jq '{
  limit: .resources.core.limit,
  remaining: .resources.core.remaining,
  used: .resources.core.used,
  reset_epoch: .resources.core.reset
}'
