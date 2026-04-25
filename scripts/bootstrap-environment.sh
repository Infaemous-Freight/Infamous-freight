#!/usr/bin/env bash
set -euo pipefail

source scripts/workspace-pm.sh

PACKAGE_MANAGER="$(detect_package_manager)"

echo "==> Bootstrapping repository/environment prerequisites"

if should_install_workspace_dependencies "$PACKAGE_MANAGER"; then
  echo "Installing dependencies with $PACKAGE_MANAGER..."
  install_workspace_dependencies "$PACKAGE_MANAGER"
fi

echo "==> Ensuring Docker CLI/Buildx"
bash scripts/install-docker-cli.sh || true

echo "==> Ensuring flyctl"
if ! command -v flyctl >/dev/null 2>&1; then
  curl -L https://fly.io/install.sh | sh
fi

echo "==> Ensuring AI SDK runtime"
bash scripts/check-ai-runtime.sh

echo "Environment bootstrap complete."
