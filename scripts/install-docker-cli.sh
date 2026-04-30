#!/usr/bin/env bash
set -euo pipefail

INSTALL_DOCKER="${INSTALL_DOCKER:-false}"

install_via_static_binary() {
  local arch tmp
  arch="x86_64"
  [[ "$(uname -m)" =~ ^(aarch64|arm64)$ ]] && arch="aarch64"

  tmp="$(mktemp -d)"
  curl -fsSL "https://download.docker.com/linux/static/stable/${arch}/docker-27.5.1.tgz" -o "${tmp}/docker.tgz"
  tar -xzf "${tmp}/docker.tgz" -C "$tmp"
  install -m 0755 "${tmp}/docker/docker" /usr/local/bin/docker
  rm -rf "$tmp"

  docker --version
}


install_buildx_plugin() {
  if docker buildx version >/dev/null 2>&1; then
    return 0
  fi

  local arch plugin_dir
  arch="amd64"
  [[ "$(uname -m)" =~ ^(aarch64|arm64)$ ]] && arch="arm64"

  plugin_dir="${HOME}/.docker/cli-plugins"
  mkdir -p "$plugin_dir"

  local latest_tag
  latest_tag="$(curl -fsSL https://api.github.com/repos/docker/buildx/releases/latest | sed -n 's/.*"tag_name": "\([^"]*\)".*/\1/p' | head -n1 || true)"

  local candidate_urls=(
    "https://github.com/docker/buildx/releases/latest/download/buildx-latest.linux-${arch}"
  )

  if [ -n "$latest_tag" ]; then
    candidate_urls+=("https://github.com/docker/buildx/releases/download/${latest_tag}/buildx-${latest_tag}.linux-${arch}")
  fi

  local url
  for url in "${candidate_urls[@]}"; do
    if curl -fsSL "$url" -o "${plugin_dir}/docker-buildx"; then
      chmod +x "${plugin_dir}/docker-buildx"
      return 0
    fi
  done

  echo "Unable to download Docker Buildx plugin binary for linux-${arch}; continuing without buildx plugin." >&2
}

ensure_docker_daemon() {
  if docker info >/dev/null 2>&1; then
    echo "Docker daemon is reachable."
    return 0
  fi

  echo "Docker daemon not reachable. Attempting to start daemon..."

  if command -v service >/dev/null 2>&1 && service docker start >/dev/null 2>&1; then
    sleep 2
  elif command -v dockerd >/dev/null 2>&1; then
    nohup dockerd >/tmp/dockerd.log 2>&1 &
    sleep 3
  fi

  if docker info >/dev/null 2>&1; then
    echo "Docker daemon is reachable."
    return 0
  fi

  echo "Docker daemon is still not reachable."
  echo "If this is a restricted container, daemon access may be unavailable." 
  return 1
}

if command -v docker >/dev/null 2>&1; then
  echo "Docker client installed:"
  docker --version

  install_buildx_plugin
  if docker buildx version >/dev/null 2>&1; then
    docker buildx version
  else
    echo "Docker Buildx is not available."
  fi

  if ! ensure_docker_daemon; then
    echo "Continuing without daemon access; Docker CLI and Buildx checks completed." >&2
  fi
  exit 0
fi

if [ "$INSTALL_DOCKER" != "true" ]; then
  echo "Docker CLI is not installed."
  echo "This script will not mutate the host by default."
  echo "To install on Debian/Ubuntu, run:"
  echo "  INSTALL_DOCKER=true bash scripts/install-docker-cli.sh"
  exit 1
fi

if command -v apt-get >/dev/null 2>&1; then
  echo "Installing Docker CLI packages..."
  if apt-get update && {
    if apt-cache show docker-buildx-plugin >/dev/null 2>&1; then
      apt-get install -y docker.io docker-buildx-plugin
    else
      apt-get install -y docker.io
    fi
  }; then
    :
  else
    echo "APT install failed, falling back to static Docker CLI binary install..."
    install_via_static_binary
  fi
else
  echo "apt-get not available, falling back to static Docker CLI binary install..."
  install_via_static_binary
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker CLI is still unavailable after install."
  exit 1
fi

docker --version

install_buildx_plugin
if docker buildx version >/dev/null 2>&1; then
  docker buildx version
else
  echo "Docker Buildx is not available from installed packages."
fi

if ! ensure_docker_daemon; then
  echo "Continuing without daemon access; Docker CLI and Buildx checks completed." >&2
fi
