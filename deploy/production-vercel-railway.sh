#!/usr/bin/env bash

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_MODE="${DEPLOY_MODE:-auto}"          # auto | single | monorepo
WEB_DIR="${WEB_DIR:-apps/web}"              # used for monorepo deploys
API_DIR="${API_DIR:-apps/api}"              # used for migrations
DB_PROVIDER="${DB_PROVIDER:-supabase}"      # supabase | railway | none
RUN_MIGRATIONS="${RUN_MIGRATIONS:-1}"
SKIP_CHECKS="${SKIP_CHECKS:-0}"

required_commands=(git node pnpm)

log() {
  echo -e "${YELLOW}➜ $1${NC}"
}

success() {
  echo -e "${GREEN}✅ $1${NC}"
}

fail() {
  echo -e "${RED}❌ $1${NC}"
  exit 1
}

has_file() {
  [[ -f "$ROOT_DIR/$1" ]]
}

has_dir() {
  [[ -d "$ROOT_DIR/$1" ]]
}

assert_command() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || fail "Missing required command: $cmd"
}

assert_env() {
  local key="$1"
  [[ -n "${!key:-}" ]] || fail "Missing required environment variable: $key"
}

detect_mode() {
  if [[ "$DEPLOY_MODE" != "auto" ]]; then
    echo "$DEPLOY_MODE"
    return
  fi

  if has_dir "$WEB_DIR"; then
    echo "monorepo"
  elif has_file "next.config.js" || has_file "next.config.mjs"; then
    echo "single"
  else
    fail "Could not detect Next.js project layout. Set DEPLOY_MODE=single|monorepo"
  fi
}

run_repo_checks() {
  if [[ "$SKIP_CHECKS" == "1" ]]; then
    log "Skipping local checks because SKIP_CHECKS=1"
    return
  fi

  cd "$ROOT_DIR"
  log "Running production preflight checks"
  pnpm lint
  pnpm typecheck
  pnpm build
  success "Preflight checks completed"
}

run_migrations() {
  [[ "$RUN_MIGRATIONS" == "1" ]] || {
    log "Skipping migrations because RUN_MIGRATIONS=0"
    return
  }

  cd "$ROOT_DIR"

  if has_file "supabase/config.toml" && [[ "$DB_PROVIDER" == "supabase" ]]; then
    assert_command supabase
    log "Applying Supabase migrations"
    supabase db push
    success "Supabase migrations applied"
    return
  fi

  if has_file "$API_DIR/prisma/schema.prisma"; then
    log "Applying Prisma migrations"
    (cd "$ROOT_DIR/$API_DIR" && pnpm prisma migrate deploy)
    success "Prisma migrations applied"
    return
  fi

  if has_file "$API_DIR/drizzle.config.ts" || has_file "$API_DIR/drizzle.config.js"; then
    log "Applying Drizzle migrations"
    (cd "$ROOT_DIR/$API_DIR" && pnpm run db:push)
    success "Drizzle migrations applied"
    return
  fi

  log "No migration framework detected; skipping migration step"
}

deploy_vercel() {
  assert_command vercel

  local mode="$1"
  cd "$ROOT_DIR"

  case "$mode" in
    single)
      log "Deploying single Next.js app to Vercel"
      vercel --prod --yes
      ;;
    monorepo)
      has_dir "$WEB_DIR" || fail "Missing web app directory: $WEB_DIR"
      log "Deploying monorepo web app ($WEB_DIR) to Vercel"
      vercel --cwd "$WEB_DIR" --prod --yes
      ;;
    *)
      fail "Unsupported deploy mode: $mode"
      ;;
  esac

  success "Vercel deployment complete"
}

print_post_deploy_steps() {
  cat <<'POST'

Next production hardening checklist:
  1. Verify Vercel environment variables are set for Production scope.
  2. Confirm DATABASE_URL points to managed Postgres (Railway/Supabase).
  3. Validate auth settings (NEXTAUTH_URL, NEXTAUTH_SECRET/JWT_SECRET/Clerk keys).
  4. Smoke test critical endpoints:
     - /api/health
     - user sign-in flow
     - shipment creation + tracking
  5. Confirm domain + DNS cutover in Vercel project settings.
POST
}

main() {
  for cmd in "${required_commands[@]}"; do
    assert_command "$cmd"
  done

  assert_env DATABASE_URL

  local mode
  mode="$(detect_mode)"

  log "Deployment mode: $mode"
  run_repo_checks
  run_migrations
  deploy_vercel "$mode"
  print_post_deploy_steps
  success "Production deployment workflow finished"
}

main "$@"
