#!/bin/bash

set -euo pipefail

DOMAIN="${1:-infamousfreight.com}"
EXPECTED_A="${EXPECTED_A:-216.198.79.1}"

if ! command -v dig >/dev/null 2>&1; then
  echo "❌ 'dig' is required. Install dnsutils first."
  exit 1
fi

echo "🔎 Checking DNS for ${DOMAIN}"

A_RECORDS="$(dig +short A "$DOMAIN" | tr -d '\r')"
AAAA_RECORDS="$(dig +short AAAA "$DOMAIN" | tr -d '\r')"

echo "A records:"
printf '%s\n' "${A_RECORDS:-<none>}"

echo "AAAA records:"
printf '%s\n' "${AAAA_RECORDS:-<none>}"

if ! grep -qx "$EXPECTED_A" <<<"$A_RECORDS"; then
  echo "❌ Missing expected A record: $EXPECTED_A"
  exit 1
fi

if [[ -n "$AAAA_RECORDS" ]]; then
  echo "❌ Conflicting AAAA records detected. Remove AAAA records at your DNS provider for ${DOMAIN}."
  exit 1
fi

echo "✅ DNS looks correct for Vercel apex mapping."
