#!/usr/bin/env bash
set -Eeuo pipefail

REPO="${1:-}"
TITLE="${2:-}"
BODY="${3:-}"
LABELS="${4:-}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required to create issues from this script." >&2
  exit 1
fi

if [ -z "${REPO}" ] || [ -z "${TITLE}" ] || [ -z "${BODY}" ]; then
  echo "Usage: bash scripts/create-github-issue.sh <owner/repo> <title> <description> [labels_csv]" >&2
  echo "Example: bash scripts/create-github-issue.sh project/repo \"Bug title\" \"Steps + expected + actual\" \"bug,priority:high\"" >&2
  exit 1
fi

cmd=(gh issue create --repo "${REPO}" --title "${TITLE}" --body "${BODY}")

if [ -n "${LABELS}" ]; then
  cmd+=(--label "${LABELS}")
fi

"${cmd[@]}"
