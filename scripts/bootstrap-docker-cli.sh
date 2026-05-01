#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TOOLS_DIR="${REPO_ROOT}/.tools/bin"
mkdir -p "${TOOLS_DIR}"

if [[ -x "${TOOLS_DIR}/docker" ]]; then
  "${TOOLS_DIR}/docker" --version
  exit 0
fi

arch="x86_64"
[[ "$(uname -m)" =~ ^(aarch64|arm64)$ ]] && arch="aarch64"

version="${DOCKER_CLI_VERSION:-27.5.1}"
tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT

curl -fsSL "https://download.docker.com/linux/static/stable/${arch}/docker-${version}.tgz" -o "${tmp}/docker.tgz"
tar -xzf "${tmp}/docker.tgz" -C "${tmp}"
install -m 0755 "${tmp}/docker/docker" "${TOOLS_DIR}/docker"

"${TOOLS_DIR}/docker" --version

echo "Docker CLI installed at ${TOOLS_DIR}/docker"
echo "Add to PATH: export PATH=\"${TOOLS_DIR}:\$PATH\""
