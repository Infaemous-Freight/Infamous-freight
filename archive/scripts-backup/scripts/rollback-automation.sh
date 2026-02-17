#!/usr/bin/env bash
# Rollback automation helper (dry run by default)

set -euo pipefail

TARGET="all"
FLY_APP="${FLY_APP:-infamous-freight-api}"
FLY_RELEASE=""
ALLOW_GIT=0
GIT_COMMIT=""
CONFIRM=0

usage() {
  cat << 'EOF'
Usage: scripts/rollback-automation.sh [options]

Options:
  --target <all|fly|vercel|git>   Rollback target (default: all)
  --fly-app <name>                Fly.io app name (default: infamous-freight-api)
  --fly-release <version>         Fly release version to rollback to
  --git-commit <hash>             Git commit to revert (single commit)
  --allow-git                     Allow git revert actions
  --confirm                       Execute rollback (default: dry run)
  -h, --help                      Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="$2"
      shift 2
      ;;
    --fly-app)
      FLY_APP="$2"
      shift 2
      ;;
    --fly-release)
      FLY_RELEASE="$2"
      shift 2
      ;;
    --git-commit)
      GIT_COMMIT="$2"
      shift 2
      ;;
    --allow-git)
      ALLOW_GIT=1
      shift
      ;;
    --confirm)
      CONFIRM=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done
done

log_action() {
  echo "- $1"
}

run_or_plan() {
  local cmd="$1"
  if [ "$CONFIRM" -eq 1 ]; then
    eval "$cmd"
  else
    log_action "DRY RUN: $cmd"
  fi
}

rollback_fly() {
  if ! command -v flyctl >/dev/null 2>&1; then
    echo "flyctl not found. Install from https://fly.io/docs/hands-on/install-flyctl/"
    return 1
  fi

  if [ -n "$FLY_RELEASE" ]; then
    run_or_plan "flyctl releases rollback $FLY_RELEASE -a $FLY_APP"
  else
    run_or_plan "flyctl releases rollback -a $FLY_APP"
  fi
}

rollback_vercel() {
  echo "Vercel rollback must be done in the dashboard."
  echo "Visit: https://vercel.com/dashboard"
}

rollback_git() {
  if [ "$ALLOW_GIT" -ne 1 ]; then
    echo "Git rollback disabled. Re-run with --allow-git to enable."
    return 1
  fi

  if [ -z "$GIT_COMMIT" ]; then
    echo "Missing --git-commit <hash> for git rollback."
    return 1
  fi

  run_or_plan "git revert $GIT_COMMIT"
  run_or_plan "git status"
}

case "$TARGET" in
  fly)
    rollback_fly
    ;;
  vercel)
    rollback_vercel
    ;;
  git)
    rollback_git
    ;;
  all)
    rollback_fly || true
    rollback_vercel
    rollback_git || true
    ;;
  *)
    echo "Unknown target: $TARGET"
    usage
    exit 1
    ;;
esac

if [ "$CONFIRM" -eq 0 ]; then
  echo "Dry run complete. Re-run with --confirm to execute."
fi
