#!/usr/bin/env bash
set -euo pipefail

if ! command -v dockerd >/dev/null 2>&1; then
  echo "dockerd is not installed. Run: sudo bash scripts/install-dev-clis.sh" >&2
  exit 1
fi

if docker info >/dev/null 2>&1; then
  echo "Docker daemon already running."
  exit 0
fi

LOG_FILE="${DOCKERD_LOG_FILE:-/tmp/dockerd.log}"
PID_FILE="/var/run/docker.pid"
RESTRICTED_PID_FILE="${DOCKERD_RESTRICTED_PID_FILE:-/tmp/dockerd-restricted.pid}"
RESTRICTED_SOCK="${DOCKERD_RESTRICTED_SOCK:-/tmp/docker-restricted.sock}"
RESTRICTED_DATA_ROOT="${DOCKERD_RESTRICTED_DATA_ROOT:-/tmp/docker-data}"
RESTRICTED_EXEC_ROOT="${DOCKERD_RESTRICTED_EXEC_ROOT:-/tmp/docker-exec}"

cleanup_stale_pid() {
  if [[ -f "${PID_FILE}" ]]; then
    local pid
    pid="$(cat "${PID_FILE}")"
    if [[ -n "${pid}" ]] && ps -p "${pid}" >/dev/null 2>&1; then
      kill "${pid}" >/dev/null 2>&1 || true
      sleep 1
      kill -9 "${pid}" >/dev/null 2>&1 || true
    fi
    rm -f "${PID_FILE}" || true
  fi
  if pgrep -x containerd >/dev/null 2>&1; then
    pkill -x containerd || true
    sleep 1
    pkill -9 -x containerd || true
  fi
  rm -f /var/run/docker/containerd/containerd.sock /var/run/docker/containerd/containerd.sock.ttrpc || true
}

echo "Starting dockerd (standard mode)..."
cleanup_stale_pid
nohup dockerd >"${LOG_FILE}" 2>&1 &
sleep 4

if docker info >/dev/null 2>&1; then
  echo "Docker daemon started in standard mode."
  exit 0
fi

echo "Standard mode failed; retrying in restricted-container mode..."
cleanup_stale_pid
nohup dockerd \
  --host="unix://${RESTRICTED_SOCK}" \
  --pidfile="${RESTRICTED_PID_FILE}" \
  --data-root="${RESTRICTED_DATA_ROOT}" \
  --exec-root="${RESTRICTED_EXEC_ROOT}" \
  --iptables=false \
  --bridge=none \
  --ip-forward=false \
  --ip-masq=false \
  --storage-driver=vfs \
  >"${LOG_FILE}" 2>&1 &
sleep 4

if DOCKER_HOST="unix://${RESTRICTED_SOCK}" docker info >/dev/null 2>&1; then
  echo "Docker daemon started in restricted-container mode."
  echo "Use it with: export DOCKER_HOST=unix://${RESTRICTED_SOCK}"
  exit 0
fi

echo "Unable to start Docker daemon. Inspect logs: ${LOG_FILE}" >&2
tail -n 80 "${LOG_FILE}" >&2 || true
exit 1
