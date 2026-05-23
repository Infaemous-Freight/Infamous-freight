#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TOOLS_DIR="${REPO_ROOT}/.tools/bin"

cd "${REPO_ROOT}"

bash "${SCRIPT_DIR}/install-required-clis.sh"
export PATH="${TOOLS_DIR}:$PATH"
bash "${SCRIPT_DIR}/verify-required-clis.sh"

if [[ -z "${FLY_API_TOKEN:-}" ]]; then
  echo "⚠️ FLY_API_TOKEN is not set. Skipping Fly runtime env application."
  echo "Set token and rerun: export FLY_API_TOKEN=<token> && bash scripts/production-canonical-env.sh"
  exit 0
fi

bash "${SCRIPT_DIR}/production-canonical-env.sh"

echo "Done: CLI tooling installed and canonical Fly runtime env applied."
