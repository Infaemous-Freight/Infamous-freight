#!/usr/bin/env bash
set -Eeuo pipefail

PR_NUMBER="${1:-}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required to check PR CI status." >&2
  exit 1
fi

if [ -z "${PR_NUMBER}" ]; then
  PR_NUMBER="$(gh pr view --json number --jq '.number' 2>/dev/null || true)"
fi

if [ -z "${PR_NUMBER}" ]; then
  echo "Unable to determine PR number. Provide it explicitly: <pr_number>" >&2
  exit 1
fi

echo "==> Latest CI run status for PR #${PR_NUMBER}"
gh run list \
  --branch "$(gh pr view "${PR_NUMBER}" --json headRefName --jq '.headRefName')" \
  --limit 1 \
  --json databaseId,workflowName,displayTitle,status,conclusion,url,createdAt \
  --jq '.[] | {workflowName, displayTitle, status, conclusion, url, createdAt}'
