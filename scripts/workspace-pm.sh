#!/usr/bin/env bash
set -euo pipefail

detect_package_manager() {
  if [ -f "pnpm-lock.yaml" ] && command -v pnpm >/dev/null 2>&1; then
    echo "pnpm"
    return
  fi

  echo "npm"
}

install_workspace_dependencies() {
  local package_manager="$1"

  if [ "$package_manager" = "pnpm" ]; then
    pnpm install --frozen-lockfile || pnpm install
    return
  fi

  npm ci || npm install
}

run_workspace_script() {
  local package_manager="$1"
  local script_name="$2"
  shift 2

  if [ "$package_manager" = "pnpm" ]; then
    pnpm run "$script_name" "$@"
    return
  fi

  npm run "$script_name" "$@"
}
