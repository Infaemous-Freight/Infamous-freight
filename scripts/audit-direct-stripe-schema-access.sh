#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# The Stripe schema is intentionally internal-only. Browser/client code must not
# query stripe.* tables directly through Supabase. Billing reads should go
# through backend API routes or server-side service-role code.

ALLOWLIST_REGEX='(docs/|README|CHANGELOG|migrations/|supabase/migrations/|audit-direct-stripe-schema-access\.sh|OWNER_REMEDIATION_TRACKER)'
found=0

while IFS= read -r line; do
  [ -z "$line" ] && continue
  file="${line%%:*}"
  if [[ "$file" =~ $ALLOWLIST_REGEX ]]; then
    continue
  fi
  echo "Potential direct Stripe schema access: $line"
  found=1
done < <(grep -RIn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=coverage --exclude-dir=.next -E "schema\(['\"]stripe['\"]\)|from\(['\"]stripe\.|stripe\." . || true)

if [ "$found" -ne 0 ]; then
  echo "Direct Stripe schema access audit failed. Keep stripe schema internal-only and route billing through server APIs." >&2
  exit 1
fi

echo "Direct Stripe schema access audit passed."
