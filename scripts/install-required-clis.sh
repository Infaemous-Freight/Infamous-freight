#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TOOLS_DIR="${REPO_ROOT}/.tools/bin"
mkdir -p "${TOOLS_DIR}"

install_flyctl() {
  if command -v flyctl >/dev/null 2>&1 || [[ -x "${TOOLS_DIR}/flyctl" ]]; then
    echo "flyctl already installed"
    return
  fi
  curl -fsSL https://fly.io/install.sh | FLYCTL_INSTALL="${REPO_ROOT}/.tools" sh
}

install_supabase() {
  if command -v supabase >/dev/null 2>&1 || [[ -x "${TOOLS_DIR}/supabase" ]]; then
    echo "supabase already installed"
    return
  fi

  local arch tmp url
  arch="amd64"
  [[ "$(uname -m)" =~ ^(aarch64|arm64)$ ]] && arch="arm64"

  url="https://github.com/supabase/cli/releases/latest/download/supabase_linux_${arch}.tar.gz"
  tmp="$(mktemp)"
  curl -fsSL "$url" -o "$tmp"
  tar -xzf "$tmp" -C "${TOOLS_DIR}" supabase
  rm -f "$tmp"
}


install_docker_cli() {
  if command -v docker >/dev/null 2>&1 || [[ -x "${TOOLS_DIR}/docker" ]]; then
    echo "docker already installed"
    return
  fi
  bash "${SCRIPT_DIR}/bootstrap-docker-cli.sh"
}

install_stripe() {
  if command -v stripe >/dev/null 2>&1 || [[ -x "${TOOLS_DIR}/stripe" ]]; then
    echo "stripe already installed"
    return
  fi

  local asset_pattern tmp asset_url
  asset_pattern="linux_x86_64.tar.gz"
  [[ "$(uname -m)" =~ ^(aarch64|arm64)$ ]] && asset_pattern="linux_arm64.tar.gz"

  asset_url="$(curl -fsSL https://api.github.com/repos/stripe/stripe-cli/releases/latest | grep -Eo 'https://[^" ]+' | grep "$asset_pattern" | head -n 1)"
  if [[ -z "$asset_url" ]]; then
    echo "Unable to resolve Stripe CLI download URL for ${asset_pattern}" >&2
    return 1
  fi

  tmp="$(mktemp)"
  curl -fsSL "$asset_url" -o "$tmp"
  tar -xzf "$tmp" -C "${TOOLS_DIR}" stripe
  rm -f "$tmp"
}

install_flyctl
install_supabase
install_stripe
install_docker_cli

echo "Required CLIs are available in ${TOOLS_DIR}."
echo "Add to PATH: export PATH=\"${TOOLS_DIR}:\$PATH\""

bash "${SCRIPT_DIR}/verify-required-clis.sh"
