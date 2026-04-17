#!/usr/bin/env bash
set -Eeuo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm install
  nvm use
fi

seed_env_file() {
  local source_file=$1
  local target_file=$2
  if [ -f "$source_file" ] && [ ! -f "$target_file" ]; then
    echo "==> Creating ${target_file} from ${source_file}"
    cp "$source_file" "$target_file"
  fi
}

echo "==> Enabling pnpm via Corepack"
corepack enable
corepack prepare pnpm@10.33.0 --activate

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "==> Creating .env from .env.example"
  cp .env.example .env
fi
seed_env_file "apps/api/.env.example" "apps/api/.env"
seed_env_file "apps/web/.env.example" "apps/web/.env.local"

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

echo "==> Building workspace"
pnpm build

if [ "${QUICKSTART_SKIP_DEV:-false}" = "true" ]; then
  echo "==> QUICKSTART_SKIP_DEV=true, skipping pnpm dev:api"
  exit 0
fi

echo "==> Starting API"
pnpm dev:api
