#!/bin/bash
# Automated Backup Script for Production Data
# Backs up database, configuration, and logs

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/infamous-freight}"
DATABASE_FILE="${DATABASE_FILE:-/app/data/data.json}"
CONFIG_DIR="${CONFIG_DIR:-/app/config}"
LOG_DIR="${LOG_DIR:-/app/logs}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_${TIMESTAMP}"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

send_alert() {
    local message="$1"
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🔐 Backup: $message\",\"timestamp\":\"$(date -Iseconds)\"}" \
            2>/dev/null || true
    fi
}

create_backup() {
    log "Creating backup: $BACKUP_NAME"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
    
    # Backup database
    if [ -f "$DATABASE_FILE" ]; then
        log "Backing up database..."
        cp "$DATABASE_FILE" "$BACKUP_DIR/$BACKUP_NAME/database.json"
        gzip "$BACKUP_DIR/$BACKUP_NAME/database.json"
        log "${GREEN}✓ Database backed up${NC}"
    else
        log "${YELLOW}⚠ Database file not found: $DATABASE_FILE${NC}"
    fi
    
    # Backup configuration
    if [ -d "$CONFIG_DIR" ]; then
        log "Backing up configuration..."
        tar -czf "$BACKUP_DIR/$BACKUP_NAME/config.tar.gz" -C "$CONFIG_DIR" . 2>/dev/null || true
        log "${GREEN}✓ Configuration backed up${NC}"
    fi
    
    # Backup logs (last 7 days)
    if [ -d "$LOG_DIR" ]; then
        log "Backing up logs..."
        find "$LOG_DIR" -type f -mtime -7 -print0 | \
            tar -czf "$BACKUP_DIR/$BACKUP_NAME/logs.tar.gz" --null -T - 2>/dev/null || true
        log "${GREEN}✓ Logs backed up${NC}"
    fi
    
    # Create backup manifest
    cat > "$BACKUP_DIR/$BACKUP_NAME/manifest.json" <<EOF
{
    "timestamp": "$(date -Iseconds)",
    "backup_name": "$BACKUP_NAME",
    "files": [
        "database.json.gz",
        "config.tar.gz",
        "logs.tar.gz"
    ],
    "size": "$(du -sh "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)"
}
EOF
    
    log "${GREEN}✓ Backup created: $BACKUP_DIR/$BACKUP_NAME${NC}"
    send_alert "Backup completed successfully: $BACKUP_NAME"
}

upload_to_s3() {
    if [ -z "$S3_BUCKET" ]; then
        return 0
    fi
    
    log "Uploading to S3: $S3_BUCKET"
    
    # Create tarball
    tar -czf "/tmp/${BACKUP_NAME}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
    
    # Upload to S3
    if command -v aws &> /dev/null; then
        aws s3 cp "/tmp/${BACKUP_NAME}.tar.gz" "s3://$S3_BUCKET/backups/" || {
            log "${RED}✗ S3 upload failed${NC}"
            send_alert "S3 upload failed for $BACKUP_NAME"
            return 1
        }
        rm "/tmp/${BACKUP_NAME}.tar.gz"
        log "${GREEN}✓ Backup uploaded to S3${NC}"
        send_alert "Backup uploaded to S3: $BACKUP_NAME"
    else
        log "${YELLOW}⚠ AWS CLI not found, skipping S3 upload${NC}"
    fi
}

cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup_*" -mtime +$RETENTION_DAYS -exec rm -rf {} \;
    
    local remaining
    remaining=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup_*" | wc -l)
    log "${GREEN}✓ Cleanup complete. $remaining backups remaining${NC}"
}

verify_backup() {
    local backup_path="$BACKUP_DIR/$BACKUP_NAME"
    
    log "Verifying backup..."
    
    # Check if files exist
    [ -f "$backup_path/database.json.gz" ] || {
        log "${RED}✗ Database backup missing${NC}"
        return 1
    }
    
    # Test gzip integrity
    gzip -t "$backup_path/database.json.gz" || {
        log "${RED}✗ Database backup corrupted${NC}"
        send_alert "Backup verification failed: corrupted database file"
        return 1
    }
    
    log "${GREEN}✓ Backup verified${NC}"
    return 0
}

restore_backup() {
    local backup_name="$1"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [ ! -d "$backup_path" ]; then
        log "${RED}✗ Backup not found: $backup_name${NC}"
        return 1
    fi
    
    log "${YELLOW}Restoring backup: $backup_name${NC}"
    read -p "Are you sure? This will overwrite current data (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Restore cancelled"
        return 0
    fi
    
    # Restore database
    if [ -f "$backup_path/database.json.gz" ]; then
        log "Restoring database..."
        gunzip -c "$backup_path/database.json.gz" > "$DATABASE_FILE"
        log "${GREEN}✓ Database restored${NC}"
    fi
    
    # Restore configuration
    if [ -f "$backup_path/config.tar.gz" ]; then
        log "Restoring configuration..."
        tar -xzf "$backup_path/config.tar.gz" -C "$CONFIG_DIR"
        log "${GREEN}✓ Configuration restored${NC}"
    fi
    
    send_alert "Backup restored: $backup_name"
    log "${GREEN}✓ Restore complete${NC}"
}

list_backups() {
    log "Available backups:"
    find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup_*" -printf "%T@ %p\n" | \
        sort -rn | \
        while read -r timestamp path; do
            local name=$(basename "$path")
            local size=$(du -sh "$path" | cut -f1)
            local date=$(date -d "@${timestamp%.*}" '+%Y-%m-%d %H:%M:%S')
            echo "  $name - $size - $date"
        done
}

main() {
    local action="${1:-backup}"
    
    case "$action" in
        backup)
            create_backup
            verify_backup
            upload_to_s3
            cleanup_old_backups
            ;;
        restore)
            if [ -z "${2:-}" ]; then
                log "${RED}Error: Please specify backup name${NC}"
                list_backups
                exit 1
            fi
            restore_backup "$2"
            ;;
        list)
            list_backups
            ;;
        *)
            log "${RED}Usage: $0 {backup|restore <name>|list}${NC}"
            exit 1
            ;;
    esac
}

# Run
main "$@"
