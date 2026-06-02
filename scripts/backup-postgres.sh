#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

if [[ -n "${DATABASE_URL:-}" ]]; then
  OUT="$BACKUP_DIR/infamous-freight-$STAMP.dump"
  pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges --file "$OUT"
  gzip "$OUT"
  echo "Backup written to $OUT.gz"
  exit 0
fi

DB_USER="${DB_USER:-infamous}"
DB_NAME="${DB_NAME:-infamous_freight}"
OUT="$BACKUP_DIR/infamous-freight-$STAMP.sql"

docker compose exec -T postgres pg_dump \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  > "$OUT"

echo "Backup written to $OUT"
