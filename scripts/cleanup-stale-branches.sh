#!/usr/bin/env bash
set -euo pipefail

# Delete stale automation-created remote branches while protecting human/product branches.
# Requirements: git, GitHub CLI (`gh`) authenticated with repo contents/write access.

REMOTE="${REMOTE:-origin}"
DRY_RUN="${DRY_RUN:-0}"
STALE_BRANCH_REGEX='^(codex/|copilot/|agent-|claude/|coderabbitai/|github-advanced-security/|conflict_)'

protected_branch() {
  case "$1" in
    main|develop|release/*|feat/*|fix/*|docs/*|chore/*|billing/*|chatgpt/*|update-toolchain|local-infra-smoke|infamous-reliability-agents|vercel/*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI 'gh' is required." >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: GitHub CLI is not authenticated. Run: gh auth login" >&2
  exit 1
fi

git fetch "$REMOTE" '+refs/heads/*:refs/remotes/origin/*' --prune

mapfile -t open_pr_branches < <(
  gh pr list --state open --limit 500 --json headRefName --jq '.[].headRefName'
)

is_open_pr_branch() {
  local branch="$1"
  local open_branch
  for open_branch in "${open_pr_branches[@]:-}"; do
    if [[ "$open_branch" == "$branch" ]]; then
      return 0
    fi
  done
  return 1
}

deleted=0
skipped=0

while IFS= read -r remote_ref; do
  branch="${remote_ref#origin/}"

  if protected_branch "$branch"; then
    echo "skip protected branch: $branch"
    skipped=$((skipped + 1))
    continue
  fi

  if ! [[ "$branch" =~ $STALE_BRANCH_REGEX ]]; then
    echo "skip non-matching branch: $branch"
    skipped=$((skipped + 1))
    continue
  fi

  if is_open_pr_branch "$branch"; then
    echo "skip open PR branch: $branch"
    skipped=$((skipped + 1))
    continue
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "would delete stale branch: $branch"
  else
    echo "delete stale branch: $branch"
    git push "$REMOTE" --delete "$branch"
  fi

  deleted=$((deleted + 1))
done < <(git branch -r | sed 's/^ *//' | grep '^origin/' | grep -v '^origin/HEAD')

echo ""
echo "Deleted/would-delete stale automation branches: $deleted"
echo "Skipped protected/non-matching/open-PR branches: $skipped"
