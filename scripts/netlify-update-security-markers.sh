#!/usr/bin/env bash
set -euo pipefail

cat <<'BANNER'
Infamous Freight Netlify security marker updater

This script updates Netlify environment markers to reflect the current
decision state:
  - secret rotation intentionally skipped
  - no redeploy required specifically for rotation
  - MFA enforcement and preview access review remain required
BANNER

if ! command -v netlify >/dev/null 2>&1; then
  echo "ERROR: netlify CLI is not installed. Install with: npm i -g netlify-cli" >&2
  exit 1
fi

if [[ -z "${NETLIFY_AUTH_TOKEN:-}" ]]; then
  echo "ERROR: NETLIFY_AUTH_TOKEN is not set in this shell." >&2
  exit 1
fi

if [[ -z "${NETLIFY_SITE_ID:-}" ]]; then
  echo "ERROR: NETLIFY_SITE_ID is not set in this shell." >&2
  exit 1
fi

set_marker() {
  local key="$1"
  local value="$2"
  echo "Setting ${key}=${value}"
  netlify env:set "${key}" "${value}" --site "${NETLIFY_SITE_ID}"
}

set_marker "NETLIFY_SECRET_ROTATION_STATUS" "skipped"
set_marker "NETLIFY_SECRET_ROTATION_REQUIRED" "false"
set_marker "NETLIFY_REDEPLOY_REQUIRED_AFTER_SECRET_ROTATION" "false"
set_marker "NETLIFY_TEAM_MFA_ENFORCEMENT_REQUIRED" "true"
set_marker "NETLIFY_PREVIEW_ACCESS_REVIEW_REQUIRED" "true"

echo
echo "Done. Next steps:"
echo "1. Merge safe PRs first (#1654, #1655, #1656)."
echo "2. Run and record production smoke test evidence."
