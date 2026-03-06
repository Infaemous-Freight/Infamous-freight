#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

echo "==> Infamous Freight repository audit"
echo

check_path() {
  local path="$1"
  if [[ -e "$path" ]]; then
    echo "✅ $path"
  else
    echo "❌ $path"
  fi
}

echo "==> Core canonical roots"
check_path "apps"
check_path "packages"
check_path "ai"
check_path "@compliance"
check_path "docker"
check_path "deploy"
check_path "infrastructure"
check_path "k8s"
check_path "terraform"
check_path "tests"
check_path "docs"

echo
echo "==> Ambiguous/overlapping roots"
check_path "compliance"
check_path "apps/ai"
check_path "load-tests"
check_path "k6"
check_path "tools/load-tests"
check_path "monitoring"
check_path "observability"

echo
echo "==> Satellite project roots"
check_path "Infamous-Freight-Firebase-Studio"
check_path "infamous-freight-copilot-orchestrator"
check_path "infamous-freight-gh-app"
check_path "my-neon-app"

echo
echo "==> Recommended docs"
check_path "README.md"
check_path "ARCHITECTURE.md"
check_path "REPO_MAP.md"
check_path "OWNERSHIP.md"
check_path "CONSOLIDATION_PLAN.md"

echo
echo "Audit complete."
