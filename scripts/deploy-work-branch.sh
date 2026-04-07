#!/bin/bash

set -euo pipefail

ROOT_CANDIDATES=(
  "/home/ubuntu/Infamous-freight"
  "/workspace/Infamous-freight"
)

resolve_root() {
  for candidate in "${ROOT_CANDIDATES[@]}"; do
    if [ -d "$candidate/.git" ]; then
      echo "$candidate"
      return 0
    fi
  done

  echo "ERROR: Could not find Infamous-freight repo root in expected locations." >&2
  return 1
}

resolve_flyctl() {
  if command -v flyctl >/dev/null 2>&1; then
    command -v flyctl
    return 0
  fi

  if [ -x "$HOME/.fly/bin/flyctl" ]; then
    echo "$HOME/.fly/bin/flyctl"
    return 0
  fi

  echo "ERROR: flyctl not found. Install it first: https://fly.io/docs/hands-on/install-flyctl/" >&2
  return 1
}

ROOT_DIR="$(resolve_root)"
FLYCTL_BIN="$(resolve_flyctl)"

cd "$ROOT_DIR"

# Fly CLI primarily reads FLY_ACCESS_TOKEN. Accept FLY_API_TOKEN for compatibility.
if [ -z "${FLY_ACCESS_TOKEN:-}" ] && [ -n "${FLY_API_TOKEN:-}" ]; then
  export FLY_ACCESS_TOKEN="$FLY_API_TOKEN"
fi

echo "Using repo root: $ROOT_DIR"

echo "Checking git remote and branch"
CURRENT_BRANCH="$(git branch --show-current)"
if [ "$CURRENT_BRANCH" != "work" ]; then
  echo "ERROR: Expected to deploy from 'work' branch, found '$CURRENT_BRANCH'." >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "ERROR: Git remote 'origin' is not configured in this checkout." >&2
  exit 1
fi

echo "Pushing branch '$CURRENT_BRANCH' to origin"
git push origin "$CURRENT_BRANCH"

if ! "$FLYCTL_BIN" auth whoami >/dev/null 2>&1; then
  echo "ERROR: flyctl is not authenticated." >&2
  echo "Set FLY_ACCESS_TOKEN (or FLY_API_TOKEN) or run: flyctl auth login" >&2
  exit 1
fi

echo "Deploying backend app: infamous-freight-api"
"$FLYCTL_BIN" deploy --app infamous-freight-api --no-cache --remote-only

echo "Deploying frontend app: infamous-freight-web"
cd "$ROOT_DIR/apps/web"
"$FLYCTL_BIN" deploy --app infamous-freight-web --no-cache --remote-only

echo "Deployment workflow completed"
