#!/usr/bin/env bash
set -euo pipefail

# Execute SSH hardening script on Fly Machine/VM via fly ssh console.
# This is intended for private ops boxes running OpenSSH, not typical app machines.

usage() {
  cat <<USAGE
Usage:
  ./scripts/ops/harden-ssh-over-fly.sh --app APP --machine MACHINE_ID [--allow-users "user1 user2"] [--apply]

Examples:
  ./scripts/ops/harden-ssh-over-fly.sh --app infra-bastion --machine 9080e4 --allow-users "deployer ops"
  ./scripts/ops/harden-ssh-over-fly.sh --app infra-bastion --machine 9080e4 --allow-users "deployer" --apply
USAGE
}

APP=""
MACHINE=""
ALLOW_USERS="${ALLOW_USERS:-deployer}"
APPLY_FLAG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      shift
      APP="${1:-}"
      ;;
    --machine)
      shift
      MACHINE="${1:-}"
      ;;
    --allow-users)
      shift
      ALLOW_USERS="${1:-}"
      ;;
    --apply)
      APPLY_FLAG="--apply"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1"
      usage
      exit 1
      ;;
  esac
  shift
done

if [[ -z "$APP" || -z "$MACHINE" ]]; then
  echo "ERROR: --app and --machine are required."
  usage
  exit 1
fi

if ! command -v flyctl >/dev/null 2>&1 && ! command -v fly >/dev/null 2>&1; then
  echo "ERROR: flyctl/fly CLI not found."
  exit 1
fi

FLY_BIN="$(command -v flyctl || command -v fly)"

if [[ -z "${ALLOW_USERS// }" ]]; then
  echo "ERROR: --allow-users is empty."
  exit 1
fi

echo "Copying hardening script to $APP/$MACHINE ..."
"$FLY_BIN" ssh sftp shell -a "$APP" -s "$MACHINE" <<SFTP_CMDS
put scripts/ops/harden-ssh.sh /tmp/harden-ssh.sh
chmod 0755 /tmp/harden-ssh.sh
SFTP_CMDS

echo "Running hardening script on remote machine (default dry-run unless --apply is set) ..."
"$FLY_BIN" ssh console -a "$APP" -s "$MACHINE" -C "ALLOW_USERS='$ALLOW_USERS' /tmp/harden-ssh.sh $APPLY_FLAG"

echo "Done. Keep your current Fly SSH session available until a new access path is verified."
