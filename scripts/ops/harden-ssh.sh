#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLAYBOOK_PATH="${ROOT_DIR}/infra/deploy/ansible/ssh-hardening.yml"

if ! command -v ansible-playbook >/dev/null 2>&1; then
  echo "ansible-playbook is required but not installed." >&2
  exit 127
fi

if [[ ! -f "${PLAYBOOK_PATH}" ]]; then
  echo "Playbook not found at ${PLAYBOOK_PATH}" >&2
  exit 1
fi

INVENTORY="${INVENTORY:-${ROOT_DIR}/infra/deploy/ansible/hosts.ini}"

if [[ ! -f "${INVENTORY}" ]]; then
  cat >&2 <<EOF
Inventory file not found at ${INVENTORY}.
Set INVENTORY=/path/to/hosts.ini and retry.
EOF
  exit 1
fi

exec ansible-playbook -i "${INVENTORY}" "${PLAYBOOK_PATH}" "$@"
