#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="/mnt/okcomputer/output/infamous-complete"
DRY_RUN=false

if [[ ${1:-} == "--dry-run" ]]; then
  DRY_RUN=true
  shift
fi

if [[ -n ${1:-} ]]; then
  SOURCE_DIR="$1"
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
  printf "[setup-complete] %s\n" "$*"
}

run_cmd() {
  if [[ "$DRY_RUN" == true ]]; then
    log "DRY RUN: $*"
    return 0
  fi

  "$@"
}

require_source() {
  if [[ ! -d "$SOURCE_DIR" ]]; then
    log "Source directory not found: $SOURCE_DIR"
    log "Usage: ./setup-complete.sh [--dry-run] [artifact_path]"
    exit 1
  fi
}

copy_file() {
  local from="$1"
  local to="$2"

  if [[ ! -f "$from" ]]; then
    log "Skipped missing file: $from"
    return 0
  fi

  run_cmd mkdir -p "$(dirname "$to")"
  run_cmd cp "$from" "$to"
  log "Copied file: $from -> $to"
}

copy_tree_contents() {
  local from="$1"
  local to="$2"

  if [[ ! -d "$from" ]]; then
    log "Skipped missing directory: $from"
    return 0
  fi

  run_cmd mkdir -p "$to"
  run_cmd cp -R "$from/." "$to"
  log "Merged directory contents: $from -> $to"
}

write_secrets_template() {
  local env_file="$REPO_ROOT/.env.deploy.template"

  if [[ "$DRY_RUN" == true ]]; then
    log "DRY RUN: write $env_file"
    return 0
  fi

  cat > "$env_file" <<'TEMPLATE'
# Deployment environment variables template
# Fill in values in your secret manager / CI provider.

FLY_API_TOKEN=
NETLIFY_AUTH_TOKEN=
NETLIFY_SITE_ID=
DATABASE_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TEMPLATE

  log "Wrote $env_file"
}

main() {
  require_source

  log "Importing artifacts from $SOURCE_DIR"

  copy_tree_contents "$SOURCE_DIR/.github" "$REPO_ROOT/.github"
  copy_file "$SOURCE_DIR/fly.api.toml" "$REPO_ROOT/fly.api.toml"
  copy_file "$SOURCE_DIR/netlify.toml" "$REPO_ROOT/netlify.toml"
  copy_file "$SOURCE_DIR/Dockerfile.api" "$REPO_ROOT/Dockerfile.api"
  copy_tree_contents "$SOURCE_DIR/apps" "$REPO_ROOT/apps"

  write_secrets_template

  log "Done. Review changes with: git status && git diff"
}

main "$@"
