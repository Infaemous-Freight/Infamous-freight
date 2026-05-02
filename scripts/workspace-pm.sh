#!/usr/bin/env bash
set -euo pipefail

detect_package_manager() {
  if [ -f "pnpm-lock.yaml" ] && command -v pnpm >/dev/null 2>&1; then
    echo "pnpm"
    return
  fi

  echo "npm"
}

should_install_workspace_dependencies() {
  local package_manager="$1"

  if [ ! -d "node_modules" ]; then
    return 0
  fi

  if [ "$package_manager" = "pnpm" ]; then
    if [ -f "pnpm-lock.yaml" ] && [ ! -f "node_modules/.modules.yaml" ]; then
      return 0
    fi

    if [ -f "pnpm-lock.yaml" ] && [ "pnpm-lock.yaml" -nt "node_modules/.modules.yaml" ]; then
      return 0
    fi

    return 1
  fi

  if [ -f "package-lock.json" ] && [ ! -f "node_modules/.package-lock.json" ]; then
    return 0
  fi

  if [ -f "package-lock.json" ] && [ "package-lock.json" -nt "node_modules/.package-lock.json" ]; then
    return 0
  fi

  return 1
}

install_workspace_dependencies() {
  local package_manager="$1"

  if [ "$package_manager" = "pnpm" ]; then
    pnpm install --frozen-lockfile || pnpm install
    return
  fi

  # Keep npm invocation direct here. Proxy-related npm warnings should be fixed
  # by correcting user/CI npm env configuration rather than mutating runtime env.
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

  # Keep npm invocation direct for parity with local shells and CI behavior.
  npm run "$script_name" "$@"
}
