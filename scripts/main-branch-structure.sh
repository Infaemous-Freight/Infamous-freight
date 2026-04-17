#!/usr/bin/env bash
set -Eeuo pipefail

REMOTE="${1:-origin}"
BRANCH="${2:-main}"
REF="${REMOTE}/${BRANCH}"

echo "==> Fetching ${REF}"
git fetch --depth=1 "${REMOTE}" "${BRANCH}" >/dev/null 2>&1 || true

if ! git rev-parse --verify "${REF}" >/dev/null 2>&1; then
  if [ "${BRANCH}" = "main" ]; then
    default_remote_ref="$(git symbolic-ref --short "refs/remotes/${REMOTE}/HEAD" 2>/dev/null || true)"
    if [ -n "${default_remote_ref}" ] && git rev-parse --verify "${default_remote_ref}" >/dev/null 2>&1; then
      REF="${default_remote_ref}"
      echo "==> ${REMOTE}/main not found, falling back to ${REF}"
    elif git rev-parse --verify "main" >/dev/null 2>&1; then
      REF="main"
      echo "==> ${REMOTE}/main not found, falling back to local ${REF}"
    elif git rev-parse --verify "master" >/dev/null 2>&1; then
      REF="master"
      echo "==> ${REMOTE}/main not found, falling back to local ${REF}"
    elif git rev-parse --verify "HEAD" >/dev/null 2>&1; then
      REF="HEAD"
      echo "==> ${REMOTE}/main not found, falling back to ${REF}"
    else
      echo "Unable to resolve ${REF}. Ensure remote/branch exists." >&2
      exit 1
    fi
  else
    echo "Unable to resolve ${REF}. Ensure remote/branch exists." >&2
    exit 1
  fi
fi

echo "==> Top-level structure for ${REF}"
git ls-tree --name-only "${REF}"

if [ "${TREE_FULL:-false}" = "true" ]; then
  echo ""
  echo "==> Full file tree for ${REF}"
  git ls-tree -r --name-only "${REF}"
fi
