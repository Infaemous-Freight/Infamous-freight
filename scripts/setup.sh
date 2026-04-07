#!/usr/bin/env bash
set -euo pipefail

sanitize_npm_proxy_env() {
  # npm warns on legacy env key translation for "http-proxy".
  # Preserve proxy behavior by remapping the value to the modern "proxy" key.
  if [ -n "${npm_config_http_proxy:-}" ] && [ -z "${npm_config_proxy:-}" ]; then
    export npm_config_proxy="${npm_config_http_proxy}"
  fi
  if [ -n "${NPM_CONFIG_HTTP_PROXY:-}" ] && [ -z "${NPM_CONFIG_PROXY:-}" ]; then
    export NPM_CONFIG_PROXY="${NPM_CONFIG_HTTP_PROXY}"
  fi

  unset npm_config_http_proxy || true
  unset NPM_CONFIG_HTTP_PROXY || true
}

sanitize_npm_proxy_env

echo "==> Enabling pnpm via Corepack"
corepack enable
corepack prepare pnpm@10.33.0 --activate

if [ -f ".env.example" ] && [ ! -f ".env" ]; then
  echo "==> Creating .env from .env.example"
  cp .env.example .env
fi

echo "==> Installing dependencies"
pnpm install

echo "==> Building shared package and workspaces"
pnpm build

echo ""
echo "Bootstrap complete."
echo "Run one of:"
echo "  pnpm dev"
echo "  pnpm dev:web"
echo "  pnpm dev:mobile"
