#!/usr/bin/env bash
set -euo pipefail

INSTALL_DOCKER="${INSTALL_DOCKER:-false}"
REQUIRE_DOCKER_DAEMON="${REQUIRE_DOCKER_DAEMON:-false}"

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
  local release_tag buildx_url release_json
  if ! release_json="$(curl -fsSL -H 'Accept: application/vnd.github+json' https://api.github.com/repos/docker/buildx/releases/latest)"; then
    echo "Unable to fetch Docker Buildx release metadata from GitHub API."
    return 0
  fi

  release_tag="$(printf '%s' "$release_json" | node -e "const fs=require('fs');try{const v=JSON.parse(fs.readFileSync(0,'utf8')).tag_name||'';process.stdout.write(v);}catch{process.stdout.write('');}")"
  if [ -z "$release_tag" ]; then
    echo "Unable to determine latest Docker Buildx release tag."
    return 0
  fi

  buildx_url="https://github.com/docker/buildx/releases/download/${release_tag}/buildx-${release_tag}.linux-${arch}"

  if curl -fsSL "$buildx_url" -o "${plugin_dir}/docker-buildx"; then
    chmod +x "${plugin_dir}/docker-buildx"
  else
    echo "Unable to download Docker Buildx plugin from GitHub release asset."
  fi
}

install_compose_plugin() {
  if docker compose version >/dev/null 2>&1; then
    return 0
  fi

  if command -v apt-get >/dev/null 2>&1; then
    apt-get install -y docker-compose-v2 >/dev/null 2>&1 || true
  fi
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
  if [ "$REQUIRE_DOCKER_DAEMON" = "true" ]; then
    return 1
  fi
  return 0
}

if command -v docker >/dev/null 2>&1; then
  echo "Docker client installed:"
  docker --version

  install_buildx_plugin
  install_compose_plugin
  if docker buildx version >/dev/null 2>&1; then
    docker buildx version
  else
    echo "Docker Buildx is not available."
  fi

  ensure_docker_daemon
  exit $?
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
      apt-get install -y docker.io docker-buildx-plugin docker-compose-v2
    else
      apt-get install -y docker.io docker-compose-v2
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
install_compose_plugin
if docker buildx version >/dev/null 2>&1; then
  docker buildx version
else
  echo "Docker Buildx is not available from installed packages."
fi

ensure_docker_daemon
