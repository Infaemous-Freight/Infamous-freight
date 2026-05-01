#!/usr/bin/env bash
set -euo pipefail

source scripts/workspace-pm.sh

PACKAGE_MANAGER="$(detect_package_manager)"

echo "==> Bootstrapping repository/environment prerequisites"

if should_install_workspace_dependencies "$PACKAGE_MANAGER"; then
  echo "Installing dependencies with $PACKAGE_MANAGER..."
  install_workspace_dependencies "$PACKAGE_MANAGER"
fi

echo "==> Ensuring required CLIs (flyctl, supabase, stripe, docker)"
bash scripts/install-required-clis.sh

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed. Install with sudo/root:"
  echo "  sudo INSTALL_DOCKER=true bash scripts/install-docker-cli.sh"
fi

echo "==> Ensuring AI SDK runtime"
bash scripts/check-ai-runtime.sh

echo "Environment bootstrap complete."
