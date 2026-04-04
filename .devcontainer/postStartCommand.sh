#!/usr/bin/env bash
set -euo pipefail

echo "==> Running post-start checks"

cd "/workspaces/${LOCAL_WORKSPACE_FOLDER_BASENAME:-$(basename "$(pwd)")}" 2>/dev/null || cd "$(pwd)"

if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@10.15.0 --activate
fi

if command -v psql >/dev/null 2>&1; then
  echo "==> PostgreSQL client available"
fi

if command -v redis-cli >/dev/null 2>&1; then
  echo "==> Redis client available"
fi

if command -v npm >/dev/null 2>&1; then
  if ! command -v codex >/dev/null 2>&1; then
    echo "==> Installing Codex CLI (fail-open)"
    npm install -g @openai/codex >/dev/null 2>&1 || true
  fi

  codex --version >/dev/null 2>&1 && echo "==> Codex CLI ready" || true
fi

echo "✅ Post-start complete"
