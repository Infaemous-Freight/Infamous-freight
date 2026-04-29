#!/usr/bin/env bash
set -euo pipefail

source scripts/workspace-pm.sh

PACKAGE_MANAGER="$(detect_package_manager)"

echo "==> Bootstrapping repository/environment prerequisites"

if should_install_workspace_dependencies "$PACKAGE_MANAGER"; then
  echo "Installing dependencies with $PACKAGE_MANAGER..."
  install_workspace_dependencies "$PACKAGE_MANAGER"
fi

echo "==> Ensuring deployment CLIs (Docker, flyctl, jq)"
if [[ "${EUID}" -eq 0 ]]; then
  bash scripts/install-dev-clis.sh
else
  bash scripts/install-docker-cli.sh || true
  if ! command -v flyctl >/dev/null 2>&1; then
    echo "flyctl is not installed. Run with sudo/root:"
    echo "  sudo bash scripts/install-dev-clis.sh"
  fi
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is not installed. Run with sudo/root:"
    echo "  sudo bash scripts/install-dev-clis.sh"
  fi
fi

echo "==> Ensuring AI SDK runtime"
bash scripts/check-ai-runtime.sh

echo "Environment bootstrap complete."
