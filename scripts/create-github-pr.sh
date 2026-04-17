#!/usr/bin/env bash
set -Eeuo pipefail

BASE_BRANCH="${1:-main}"
TITLE="${2:-}"
BODY="${3:-}"
REVIEWERS="${4:-}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required to create pull requests from this script." >&2
  exit 1
fi

HEAD_BRANCH="$(git branch --show-current)"
if [ -z "${HEAD_BRANCH}" ]; then
  echo "Unable to determine current branch." >&2
  exit 1
fi

if [ -z "${TITLE}" ] || [ -z "${BODY}" ]; then
  echo "Usage: bash scripts/create-github-pr.sh <base_branch> <title> <body> [reviewers_csv]" >&2
  echo "Example: bash scripts/create-github-pr.sh main \"PR title\" \"PR description\" \"reviewer1,reviewer2\"" >&2
  exit 1
fi

cmd=(gh pr create --base "${BASE_BRANCH}" --head "${HEAD_BRANCH}" --title "${TITLE}" --body "${BODY}")

if [ -n "${REVIEWERS}" ]; then
  cmd+=(--reviewer "${REVIEWERS}")
fi

"${cmd[@]}"
