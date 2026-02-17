#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Automated Backup System - 100% Production Ready

set -e

# ============================================
# CONFIGURATION
# ============================================

# Load environment
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/infamous-freight}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
NOTIFICATION_WEBHOOK="${BACKUP_NOTIFICATION_WEBHOOK:-}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_${TIMESTAMP}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        curl -X POST "$NOTIFICATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"status\": \"$status\", \"message\": \"$message\", \"timestamp\": \"$(date -Iseconds)\"}" \
            2>/dev/null || true
    fi
}

# ============================================
# DATABASE BACKUP
# ============================================

backup_database() {
    log_info "Starting database backup..."
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL not set"
        return 1
    fi
    
    local db_backup_file="${BACKUP_DIR}/${BACKUP_NAME}_database.sql.gz"
    mkdir -p "$BACKUP_DIR"
    
    # Dump database with compression
    if pg_dump "$DATABASE_URL" | gzip > "$db_backup_file"; then
        local size=$(du -h "$db_backup_file" | cut -f1)
        log_info "Database backed up: $db_backup_file ($size)"
        
        # Encrypt if key provided
        if [ -n "$ENCRYPTION_KEY" ]; then
            openssl enc -aes-256-cbc -salt -in "$db_backup_file" -out "${db_backup_file}.enc" -k "$ENCRYPTION_KEY"
            rm "$db_backup_file"
            log_info "Database backup encrypted"
        fi
        
        return 0
    else
        log_error "Database backup failed"
        return 1
    fi
}

# ============================================
# REDIS BACKUP
# ============================================

backup_redis() {
    log_info "Starting Redis backup..."
    
    if [ -z "$REDIS_URL" ]; then
        log_warn "REDIS_URL not set, skipping Redis backup"
        return 0
    fi
    
    local redis_backup_file="${BACKUP_DIR}/${BACKUP_NAME}_redis.rdb"
    
    # Trigger Redis save
    if command -v redis-cli &> /dev/null; then
        redis-cli -u "$REDIS_URL" SAVE 2>/dev/null || log_warn "Redis SAVE failed"
        
        # Copy dump.rdb if accessible
        if [ -f /var/lib/redis/dump.rdb ]; then
            cp /var/lib/redis/dump.rdb "$redis_backup_file"
            gzip "$redis_backup_file"
            log_info "Redis backed up: ${redis_backup_file}.gz"
        else
            log_warn "Redis dump.rdb not found"
        fi
    else
        log_warn "redis-cli not available, skipping Redis backup"
    fi
    
    return 0
}

# ============================================
# FILE SYSTEM BACKUP
# ============================================

backup_files() {
    log_info "Starting file system backup..."
    
    local files_backup="${BACKUP_DIR}/${BACKUP_NAME}_files.tar.gz"
    
    # Backup critical directories
    local backup_paths=(
        ".env"
        "apps/api/uploads"
        "apps/api/logs"
        "apps/web/public/uploads"
    )
    
    local existing_paths=()
    for path in "${backup_paths[@]}"; do
        if [ -e "$path" ]; then
            existing_paths+=("$path")
        fi
    done
    
    if [ ${#existing_paths[@]} -gt 0 ]; then
        tar -czf "$files_backup" "${existing_paths[@]}" 2>/dev/null || log_warn "Some files not backed up"
        local size=$(du -h "$files_backup" | cut -f1)
        log_info "Files backed up: $files_backup ($size)"
    else
        log_warn "No files to backup"
    fi
    
    return 0
}

# ============================================
# UPLOAD TO S3 (OPTIONAL)
# ============================================

upload_to_s3() {
    if [ -z "$S3_BUCKET" ]; then
        log_info "S3_BUCKET not set, skipping cloud upload"
        return 0
    fi
    
    log_info "Uploading backups to S3..."
    
    if ! command -v aws &> /dev/null; then
        log_warn "AWS CLI not installed, skipping S3 upload"
        return 0
    fi
    
    local backup_files=$(find "$BACKUP_DIR" -name "${BACKUP_NAME}*")
    local uploaded=0
    
    for file in $backup_files; do
        if aws s3 cp "$file" "s3://${S3_BUCKET}/backups/$(basename $file)" 2>/dev/null; then
            log_info "Uploaded: $(basename $file)"
            ((uploaded++))
        else
            log_warn "Failed to upload: $(basename $file)"
        fi
    done
    
    log_info "Uploaded $uploaded file(s) to S3"
    return 0
}

# ============================================
# CLEANUP OLD BACKUPS
# ============================================

cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted=0
    local old_backups=$(find "$BACKUP_DIR" -name "backup_*" -type f -mtime +$RETENTION_DAYS)
    
    for file in $old_backups; do
        rm -f "$file"
        log_info "Deleted: $(basename $file)"
        ((deleted++))
    done
    
    log_info "Deleted $deleted old backup(s)"
    return 0
}

# ============================================
# BACKUP VERIFICATION
# ============================================

verify_backups() {
    log_info "Verifying backups..."
    
    local errors=0
    
    # Check database backup exists and is not empty
    local db_backup=$(find "$BACKUP_DIR" -name "${BACKUP_NAME}_database*" -type f)
    if [ -n "$db_backup" ]; then
        local size=$(stat -f%z "$db_backup" 2>/dev/null || stat -c%s "$db_backup" 2>/dev/null)
        if [ "$size" -gt 1000 ]; then
            log_info "Database backup verified ($(numfmt --to=iec $size))"
        else
            log_error "Database backup too small"
            ((errors++))
        fi
    else
        log_error "Database backup not found"
        ((errors++))
    fi
    
    return $errors
}

# ============================================
# MAIN BACKUP PROCEDURE
# ============================================

run_backup() {
    log_info "═══════════════════════════════════════"
    log_info "INFÆMOUS FREIGHT - Automated Backup"
    log_info "Timestamp: $(date -Iseconds)"
    log_info "═══════════════════════════════════════"
    echo ""
    
    local start_time=$(date +%s)
    local success=true
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Run backups
    backup_database || success=false
    backup_redis || true  # Redis optional
    backup_files || true  # Files optional
    
    # Verify
    if [ "$success" = true ]; then
        verify_backups || success=false
    fi
    
    # Upload to cloud
    if [ "$success" = true ]; then
        upload_to_s3 || true  # S3 optional
    fi
    
    # Cleanup
    cleanup_old_backups || true
    
    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Results
    echo ""
    log_info "═══════════════════════════════════════"
    if [ "$success" = true ]; then
        log_info "✅ Backup completed successfully"
        log_info "Duration: ${duration}s"
        log_info "Location: $BACKUP_DIR"
        send_notification "success" "Backup completed in ${duration}s"
    else
        log_error "❌ Backup failed"
        send_notification "failure" "Backup failed after ${duration}s"
        exit 1
    fi
    log_info "═══════════════════════════════════════"
}

# ============================================
# RESTORE FUNCTIONALITY
# ============================================

restore_database() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_warn "⚠️  WARNING: This will REPLACE the current database!"
    read -p "Are you sure? Type 'YES' to confirm: " confirm
    
    if [ "$confirm" != "YES" ]; then
        log_info "Restore cancelled"
        return 1
    fi
    
    log_info "Restoring database from: $backup_file"
    
    # Decrypt if encrypted
    local restore_file="$backup_file"
    if [[ "$backup_file" == *.enc ]]; then
        if [ -z "$ENCRYPTION_KEY" ]; then
            log_error "ENCRYPTION_KEY required for encrypted backup"
            return 1
        fi
        restore_file="${backup_file%.enc}"
        openssl enc -aes-256-cbc -d -in "$backup_file" -out "$restore_file" -k "$ENCRYPTION_KEY"
    fi
    
    # Restore
    if gunzip -c "$restore_file" | psql "$DATABASE_URL"; then
        log_info "✅ Database restored successfully"
        return 0
    else
        log_error "❌ Database restore failed"
        return 1
    fi
}

list_backups() {
    log_info "Available backups in $BACKUP_DIR:"
    echo ""
    
    find "$BACKUP_DIR" -name "backup_*" -type f -exec ls -lh {} \; | \
        awk '{print $9, "(" $5 ")", $6, $7, $8}' | \
        sort -r
}

# ============================================
# COMMAND LINE INTERFACE
# ============================================

show_help() {
    cat << EOF
INFÆMOUS FREIGHT - Backup System

USAGE:
    $0 [COMMAND] [OPTIONS]

COMMANDS:
    backup          Run full backup (default)
    restore <file>  Restore database from backup
    list            List available backups
    verify          Verify latest backup
    cleanup         Remove old backups
    help            Show this help

ENVIRONMENT VARIABLES:
    DATABASE_URL              PostgreSQL connection string
    REDIS_URL                 Redis connection string (optional)
    BACKUP_DIR                Backup directory (default: /var/backups/infamous-freight)
    BACKUP_RETENTION_DAYS     Days to keep backups (default: 30)
    BACKUP_S3_BUCKET          S3 bucket for cloud backup (optional)
    BACKUP_ENCRYPTION_KEY     Encryption key for backups (optional)
    BACKUP_NOTIFICATION_WEBHOOK   Webhook for notifications (optional)

EXAMPLES:
    # Run backup
    $0 backup

    # Run backup with custom directory
    BACKUP_DIR=/mnt/backups $0 backup

    # List backups
    $0 list

    # Restore from backup
    $0 restore /var/backups/infamous-freight/backup_20260214_120000_database.sql.gz

    # Schedule daily backups (crontab)
    0 2 * * * /path/to/backup-system.sh backup >> /var/log/backup.log 2>&1

EOF
}

# ============================================
# MAIN
# ============================================

case "${1:-backup}" in
    backup)
        run_backup
        ;;
    restore)
        if [ -z "$2" ]; then
            log_error "Usage: $0 restore <backup-file>"
            exit 1
        fi
        restore_database "$2"
        ;;
    list)
        list_backups
        ;;
    verify)
        verify_backups
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
