#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root (or with sudo)." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
if apt-cache show docker-buildx-plugin >/dev/null 2>&1; then
  apt-get install -y curl jq docker.io docker-buildx-plugin
else
  apt-get install -y curl jq docker.io
fi

FLY_INSTALL_DIR="${FLY_INSTALL_DIR:-/root/.fly}"
ALLOW_FLYCTL_REMOTE_INSTALL="${ALLOW_FLYCTL_REMOTE_INSTALL:-0}"
if [[ ! -x "${FLY_INSTALL_DIR}/bin/flyctl" ]]; then
  if [[ "${ALLOW_FLYCTL_REMOTE_INSTALL}" == "1" || "${ALLOW_FLYCTL_REMOTE_INSTALL}" == "true" ]]; then
    FLYCTL_INSTALL="${FLY_INSTALL_DIR}" curl -fsSL https://fly.io/install.sh | sh
  else
    echo "flyctl is not installed; skipping remote installer by default." >&2
    echo "Set ALLOW_FLYCTL_REMOTE_INSTALL=1 to allow automatic installation," >&2
    echo "or install flyctl manually from https://fly.io/docs/flyctl/install/." >&2
  fi
fi

if [[ -x "${FLY_INSTALL_DIR}/bin/flyctl" ]]; then
  ln -sf "${FLY_INSTALL_DIR}/bin/flyctl" /usr/local/bin/flyctl
fi

if command -v systemctl >/dev/null 2>&1 && [[ -d /run/systemd/system ]]; then
  systemctl enable docker >/dev/null 2>&1 || true
  systemctl start docker >/dev/null 2>&1 || true
fi

bash scripts/start-docker-daemon.sh || true

echo "Installed tool versions:"
docker --version || true
flyctl version || true
jq --version || true

echo "Docker daemon status:"
if docker info >/dev/null 2>&1; then
  echo "docker daemon is available."
else
  echo "docker daemon is unavailable (expected in some CI/containers)." >&2
fi
