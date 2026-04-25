#!/usr/bin/env bash
set -euo pipefail

INSTALL_DOCKER="${INSTALL_DOCKER:-false}"

if command -v docker >/dev/null 2>&1; then
  echo "Docker client installed:"
  docker --version

  if docker buildx version >/dev/null 2>&1; then
    docker buildx version
  else
    echo "Docker Buildx is not available."
  fi

  if docker info >/dev/null 2>&1; then
    echo "Docker daemon is reachable."
    exit 0
  fi

  echo "Docker daemon is not reachable."
  echo "Start Docker Desktop or Docker Engine, then retry."
  exit 1
fi

if [ "$INSTALL_DOCKER" != "true" ]; then
  echo "Docker CLI is not installed."
  echo "This script will not mutate the host by default."
  echo "To install on Debian/Ubuntu, run:"
  echo "  INSTALL_DOCKER=true bash scripts/install-docker-cli.sh"
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "Automatic Docker CLI install currently supports Debian/Ubuntu only."
  exit 1
fi

echo "Installing Docker CLI packages..."
apt-get update

if apt-cache show docker-buildx-plugin >/dev/null 2>&1; then
  apt-get install -y docker.io docker-buildx-plugin
else
  apt-get install -y docker.io
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker CLI is still unavailable after install."
  exit 1
fi

docker --version

if docker buildx version >/dev/null 2>&1; then
  docker buildx version
else
  echo "Docker Buildx is not available from installed packages."
fi

if docker info >/dev/null 2>&1; then
  echo "Docker daemon is reachable."
else
  echo "Docker CLI installed, but daemon is not reachable."
  echo "Start Docker service/Desktop and rerun validation."
  exit 1
fi
