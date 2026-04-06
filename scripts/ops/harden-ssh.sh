#!/usr/bin/env bash
set -euo pipefail

# Harden OpenSSH server with drop-in config while preserving rollback safety.
# Supports Debian/Ubuntu and RHEL/Amazon Linux style service naming.

BACKUP_DIR="${BACKUP_DIR:-/etc/ssh/backup}"
DROPIN_DIR="${DROPIN_DIR:-/etc/ssh/sshd_config.d}"
TS="$(date +%F-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/sshd_config.${TS}.bak"
HARDEN_FILE="${DROPIN_DIR}/99-hardening.conf"
ALLOW_FILE="${DROPIN_DIR}/99-allowusers.conf"

ALLOW_USERS="${ALLOW_USERS:-deployer}"
DRY_RUN=true
FORCE=false

usage() {
  cat <<USAGE
Usage:
  ./scripts/ops/harden-ssh.sh [--apply] [--force] [--allow-users "user1 user2"]

Options:
  --apply                 Apply changes. Default is dry-run.
  --allow-users "..."      Space-separated SSH admin users for AllowUsers.
  --force                 Skip current-user lockout guard.
  -h, --help              Show this help.

Environment overrides:
  ALLOW_USERS, BACKUP_DIR, DROPIN_DIR
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply)
      DRY_RUN=false
      ;;
    --force)
      FORCE=true
      ;;
    --allow-users)
      shift
      ALLOW_USERS="${1:-}"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
  shift
done

run() {
  if $DRY_RUN; then
    echo "[dry-run] $*"
  else
    "$@"
  fi
}

run_root() {
  if $DRY_RUN; then
    echo "[dry-run] $*"
    return 0
  fi

  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

have_cmd() { command -v "$1" >/dev/null 2>&1; }

require_cmd() {
  have_cmd "$1" || {
    echo "ERROR: Required command not found: $1"
    exit 1
  }
}

contains_word() {
  local needle="$1"
  shift
  for v in "$@"; do
    [[ "$v" == "$needle" ]] && return 0
  done
  return 1
}

detect_service_candidates() {
  if [[ -r /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    case "${ID:-unknown}" in
      ubuntu|debian)
        echo "ssh sshd"
        return
        ;;
      amzn|rhel|centos|fedora|rocky|almalinux)
        echo "sshd ssh"
        return
        ;;
    esac
  fi
  echo "sshd ssh"
}

ensure_include_directive() {
  local include_line='Include /etc/ssh/sshd_config.d/*.conf'
  if grep -Eq '^\s*Include\s+/etc/ssh/sshd_config\.d/\*\.conf\s*$' /etc/ssh/sshd_config; then
    echo "Include directive already present in /etc/ssh/sshd_config"
    return
  fi

  echo "Adding Include directive to /etc/ssh/sshd_config"
  run_root cp /etc/ssh/sshd_config "$BACKUP_FILE"
  if $DRY_RUN; then
    echo "[dry-run] printf '%s\n' '$include_line' | cat - /etc/ssh/sshd_config > /etc/ssh/sshd_config.new"
    echo "[dry-run] mv /etc/ssh/sshd_config.new /etc/ssh/sshd_config"
  else
    {
      printf '%s\n' "$include_line"
      cat /etc/ssh/sshd_config
    } | run_root tee /etc/ssh/sshd_config.new >/dev/null
    run_root mv /etc/ssh/sshd_config.new /etc/ssh/sshd_config
  fi
}

validate_allow_users() {
  if [[ -z "${ALLOW_USERS// }" ]]; then
    echo "ERROR: ALLOW_USERS is empty. Refusing to continue."
    exit 1
  fi

  local current_user="${SUDO_USER:-${USER:-}}"
  if [[ -n "$current_user" && "$current_user" != "root" ]]; then
    local users=($ALLOW_USERS)
    if ! contains_word "$current_user" "${users[@]}" && ! $FORCE; then
      echo "ERROR: Current user '$current_user' is not in ALLOW_USERS='$ALLOW_USERS'."
      echo "       Add your current user or pass --force if intentional."
      exit 1
    fi
  fi
}

write_hardening_files() {
  run_root install -d -m 700 "$BACKUP_DIR"
  run_root install -d -m 755 "$DROPIN_DIR"
  run_root cp /etc/ssh/sshd_config "$BACKUP_FILE"

  if $DRY_RUN; then
    echo "[dry-run] would write $HARDEN_FILE and $ALLOW_FILE"
    return
  fi

  sudo tee "$HARDEN_FILE" >/dev/null <<'HARDEN_EOF'
# Authentication
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PermitEmptyPasswords no
MaxAuthTries 3
LoginGraceTime 30
MaxSessions 10

# Root/account policy
PermitRootLogin no
PermitUserEnvironment no
StrictModes yes

# Session/network hardening
X11Forwarding no
AllowTcpForwarding no
AllowAgentForwarding no
PermitTunnel no
GatewayPorts no
ClientAliveInterval 300
ClientAliveCountMax 2
TCPKeepAlive no
Compression no

# Logging
SyslogFacility AUTHPRIV
LogLevel VERBOSE
HARDEN_EOF

  echo "AllowUsers ${ALLOW_USERS}" | sudo tee "$ALLOW_FILE" >/dev/null
}

validate_sshd() {
  if $DRY_RUN; then
    echo "[dry-run] sudo sshd -t"
    return 0
  fi

  sudo sshd -t
}

rollback() {
  echo "Validation failed. Rolling back…"
  run_root rm -f "$HARDEN_FILE" "$ALLOW_FILE"
  run_root cp "$BACKUP_FILE" /etc/ssh/sshd_config
  run_root sshd -t || true
}

reload_service() {
  local candidates
  candidates="$(detect_service_candidates)"

  if $DRY_RUN; then
    echo "[dry-run] would reload service candidates: $candidates"
    return 0
  fi

  for svc in $candidates; do
    if sudo systemctl reload "$svc" 2>/dev/null; then
      echo "Reloaded $svc."
      return 0
    fi
  done

  echo "WARNING: Could not reload via systemctl; attempting restart fallback..."
  for svc in $candidates; do
    if sudo systemctl restart "$svc" 2>/dev/null; then
      echo "Restarted $svc."
      return 0
    fi
  done

  echo "WARNING: Could not restart/reload SSH service automatically. Reload manually."
  return 1
}

main() {
  echo "[1/8] Preflight checks..."
  require_cmd sshd
  require_cmd install
  require_cmd cp
  require_cmd systemctl

  validate_allow_users

  echo "[2/8] Create backup and directories..."
  write_hardening_files

  echo "[3/8] Ensure drop-in include in sshd_config..."
  ensure_include_directive

  echo "[4/8] Validate sshd configuration..."
  if validate_sshd; then
    echo "Config validation passed."
  else
    rollback
    echo "Rollback complete. Exiting with failure."
    exit 1
  fi

  echo "[5/8] Reload ssh service..."
  reload_service || true

  echo "[6/8] Summary"
  echo "  Backup: $BACKUP_FILE"
  echo "  Harden file: $HARDEN_FILE"
  echo "  AllowUsers: $ALLOW_USERS"

  echo "[7/8] Safety reminder"
  echo "  Keep current session open and test a NEW SSH login before closing this one."

  if $DRY_RUN; then
    echo "[8/8] Dry-run complete. Re-run with --apply to enforce changes."
  else
    echo "[8/8] Hardening complete."
  fi
}

main "$@"
