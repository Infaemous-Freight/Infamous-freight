#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLAYBOOK_PATH="${ROOT_DIR}/infra/deploy/ansible/ssh-hardening.yml"

if ! command -v flyctl >/dev/null 2>&1; then
  echo "flyctl is required but not installed." >&2
  exit 127
fi

if ! command -v ansible-playbook >/dev/null 2>&1; then
  echo "ansible-playbook is required but not installed." >&2
  exit 127
fi

FLY_APP="${FLY_APP:-}"
if [[ -z "${FLY_APP}" ]]; then
  echo "Set FLY_APP to the Fly.io application name." >&2
  exit 1
fi

TMP_INVENTORY="$(mktemp)"
trap 'rm -f "${TMP_INVENTORY}"' EXIT

# Build an inventory from running Fly machine private IPs.
# These hosts are expected to be reachable over your current network context.
flyctl machine list --app "${FLY_APP}" --json \
  | node -e '
      const fs = require("fs");
      const machines = JSON.parse(fs.readFileSync(0, "utf8"));
      const ips = machines
        .filter((m) => m.state === "started")
        .map((m) => m.private_ip)
        .filter(Boolean);
      process.stdout.write("[ssh_hosts]\\n" + ips.join("\\n") + "\\n");
    ' > "${TMP_INVENTORY}"

if ! grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' "${TMP_INVENTORY}"; then
  echo "No running Fly machines with private IPv4 addresses found for app ${FLY_APP}." >&2
  exit 1
fi

exec ansible-playbook -i "${TMP_INVENTORY}" "${PLAYBOOK_PATH}" "$@"
