#!/usr/bin/env bash
set -euo pipefail

# Harden OpenSSH server config in a safe, idempotent way.
# Usage:
#   ALLOW_USERS="deployer youradmin" ./harden-ssh.sh
#
# Optional:
#   SSHD_CONFIG=/path/to/sshd_config ALLOW_USERS="deployer youradmin" ./harden-ssh.sh

SSHD_CONFIG="${SSHD_CONFIG:-/etc/ssh/sshd_config}"
ALLOW_USERS="${ALLOW_USERS:-}"

validate_allow_users() {
  local value="$1"
  local entry

  if [[ "${value}" == *$'\n'* || "${value}" == *$'\r'* ]]; then
    echo "ERROR: ALLOW_USERS must not contain newline or carriage return characters."
    exit 1
  fi

  for entry in ${value}; do
    if [[ ! "${entry}" =~ ^[A-Za-z0-9._*?-]+(@[A-Za-z0-9._*?-]+)?$ ]]; then
      echo "ERROR: invalid AllowUsers entry: ${entry}"
      echo 'Expected entries like "deployer" or "deployer@example-host", separated by spaces.'
      exit 1
    fi
  done
}

if [[ -z "${ALLOW_USERS}" ]]; then
  echo "ERROR: ALLOW_USERS is required."
  echo 'Example: ALLOW_USERS="deployer youradmin" ./harden-ssh.sh'
  exit 1
fi

validate_allow_users "${ALLOW_USERS}"
if [[ "${EUID}" -ne 0 ]]; then
  echo "ERROR: must be run as root (or with sudo)."
  exit 1
fi

if [[ ! -f "${SSHD_CONFIG}" ]]; then
  echo "ERROR: sshd config not found at ${SSHD_CONFIG}"
  exit 1
fi

if ! command -v sshd >/dev/null 2>&1; then
  echo "ERROR: sshd binary not found in PATH."
  exit 1
fi

backup="${SSHD_CONFIG}.bak.$(date +%Y%m%d%H%M%S)"
cp "${SSHD_CONFIG}" "${backup}"
echo "Backed up existing config to: ${backup}"

tmp="$(mktemp)"
cp "${SSHD_CONFIG}" "${tmp}"

set_kv() {
  local key="$1"
  local value="$2"
  local rendered_line
  local new_tmp

  rendered_line="${key} ${value}"
  new_tmp="$(mktemp)"

  awk -v key="${key}" -v line="${rendered_line}" '
    BEGIN {
      in_match = 0
      updated = 0
      inserted = 0
    }
    /^[[:space:]]*Match([[:space:]]|$)/ {
      if (!updated && !inserted) {
        print line
        inserted = 1
      }
      in_match = 1
      print
      next
    }
    !in_match && $0 ~ ("^[#[:space:]]*" key "[[:space:]]+") {
      if (!updated) {
        print line
        updated = 1
      }
      next
    }
    {
      print
    }
    END {
      if (!updated && !inserted) {
        print line
      }
    }
  ' "${tmp}" >"${new_tmp}"

  mv "${new_tmp}" "${tmp}"
}

# Core hardening defaults for passwordless admin access.
set_kv "PermitRootLogin" "no"
set_kv "PasswordAuthentication" "no"
set_kv "ChallengeResponseAuthentication" "no"
set_kv "KbdInteractiveAuthentication" "no"
set_kv "UsePAM" "yes"
set_kv "PubkeyAuthentication" "yes"
set_kv "X11Forwarding" "no"
set_kv "AllowAgentForwarding" "no"
set_kv "AllowTcpForwarding" "no"
set_kv "MaxAuthTries" "3"
set_kv "ClientAliveInterval" "300"
set_kv "ClientAliveCountMax" "2"
set_kv "LoginGraceTime" "30"
set_kv "AllowUsers" "${ALLOW_USERS}"

if ! sshd -t -f "${tmp}"; then
  echo "ERROR: generated config failed validation. Original config was left untouched; backup remains available at ${backup}."
  rm -f "${tmp}"
  exit 1
fi

cp "${tmp}" "${SSHD_CONFIG}"
rm -f "${tmp}"

echo "Validated and wrote hardened SSH config."

if command -v systemctl >/dev/null 2>&1; then
  systemctl restart sshd 2>/dev/null || systemctl restart ssh 2>/dev/null || true
else
  service sshd restart 2>/dev/null || service ssh restart 2>/dev/null || true
fi

echo "Done. Current key settings:"
for k in PermitRootLogin PasswordAuthentication AllowUsers; do
  awk -v key="$k" 'tolower($1)==tolower(key){line=$0} END{if(line) print line}' "${SSHD_CONFIG}"
done
