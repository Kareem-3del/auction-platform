#!/bin/bash

##############################################################################
# PostgreSQL Database Backup Script
# Automated backup with rotation and verification
##############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/auction-platform}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DB_NAME="${POSTGRES_DB:-auction_db}"
DB_USER="${POSTGRES_BACKUP_USER:-auction_user}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"

# Timestamp for backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/auction_db_$TIMESTAMP.sql.gz"
BACKUP_LOG="$BACKUP_DIR/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$BACKUP_LOG"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$BACKUP_LOG"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$BACKUP_LOG"
}

##############################################################################
# Main Backup Process
##############################################################################

main() {
    log "Starting database backup..."

    # Create backup directory if it doesn't exist
    if [ ! -d "$BACKUP_DIR" ]; then
        log "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi

    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump command not found. Please install PostgreSQL client tools."
        exit 1
    fi

    # Perform backup
    log "Backing up database: $DB_NAME"
    log "Backup file: $BACKUP_FILE"

    if PGPASSWORD="$POSTGRES_BACKUP_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        | gzip > "$BACKUP_FILE"; then

        log "Backup completed successfully"

        # Get backup file size
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "Backup size: $BACKUP_SIZE"

        # Verify backup integrity
        if verify_backup "$BACKUP_FILE"; then
            log "Backup verification passed"
        else
            error "Backup verification failed"
            exit 1
        fi

        # Rotate old backups
        rotate_backups

        log "Backup process completed successfully"
    else
        error "Backup failed"
        exit 1
    fi
}

##############################################################################
# Verify Backup Integrity
##############################################################################

verify_backup() {
    local backup_file=$1

    log "Verifying backup integrity..."

    # Check if file exists and is not empty
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi

    if [ ! -s "$backup_file" ]; then
        error "Backup file is empty: $backup_file"
        return 1
    fi

    # Test gzip integrity
    if ! gzip -t "$backup_file" 2>/dev/null; then
        error "Backup file is corrupted (gzip test failed)"
        return 1
    fi

    # Check if backup contains expected data
    if ! zcat "$backup_file" | head -n 20 | grep -q "PostgreSQL database dump"; then
        error "Backup file does not appear to contain valid PostgreSQL dump"
        return 1
    fi

    return 0
}

##############################################################################
# Rotate Old Backups
##############################################################################

rotate_backups() {
    log "Rotating old backups (retention: $RETENTION_DAYS days)..."

    # Find and delete backups older than retention period
    local deleted_count=0

    while IFS= read -r old_backup; do
        log "Deleting old backup: $(basename "$old_backup")"
        rm -f "$old_backup"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "auction_db_*.sql.gz" -type f -mtime +$RETENTION_DAYS)

    if [ $deleted_count -gt 0 ]; then
        log "Deleted $deleted_count old backup(s)"
    else
        log "No old backups to delete"
    fi

    # Keep weekly backups for 12 weeks
    keep_weekly_backups

    # Keep monthly backups for 12 months
    keep_monthly_backups
}

##############################################################################
# Keep Weekly Backups
##############################################################################

keep_weekly_backups() {
    local weekly_dir="$BACKUP_DIR/weekly"
    mkdir -p "$weekly_dir"

    # If it's Sunday, copy latest backup to weekly directory
    if [ "$(date +%u)" -eq 7 ]; then
        local weekly_file="$weekly_dir/auction_db_week_$(date +%Y%W).sql.gz"

        if [ ! -f "$weekly_file" ]; then
            log "Creating weekly backup: $(basename "$weekly_file")"
            cp "$BACKUP_FILE" "$weekly_file"
        fi

        # Delete weekly backups older than 12 weeks
        find "$weekly_dir" -name "auction_db_week_*.sql.gz" -type f -mtime +84 -delete
    fi
}

##############################################################################
# Keep Monthly Backups
##############################################################################

keep_monthly_backups() {
    local monthly_dir="$BACKUP_DIR/monthly"
    mkdir -p "$monthly_dir"

    # If it's the 1st of the month, copy latest backup to monthly directory
    if [ "$(date +%d)" -eq 1 ]; then
        local monthly_file="$monthly_dir/auction_db_month_$(date +%Y%m).sql.gz"

        if [ ! -f "$monthly_file" ]; then
            log "Creating monthly backup: $(basename "$monthly_file")"
            cp "$BACKUP_FILE" "$monthly_file"
        fi

        # Delete monthly backups older than 12 months
        find "$monthly_dir" -name "auction_db_month_*.sql.gz" -type f -mtime +365 -delete
    fi
}

##############################################################################
# Display Backup Statistics
##############################################################################

display_stats() {
    log "Backup Statistics:"
    log "-------------------"

    local daily_count=$(find "$BACKUP_DIR" -maxdepth 1 -name "auction_db_*.sql.gz" -type f | wc -l)
    local weekly_count=$(find "$BACKUP_DIR/weekly" -name "auction_db_week_*.sql.gz" -type f 2>/dev/null | wc -l || echo 0)
    local monthly_count=$(find "$BACKUP_DIR/monthly" -name "auction_db_month_*.sql.gz" -type f 2>/dev/null | wc -l || echo 0)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0")

    log "Daily backups: $daily_count"
    log "Weekly backups: $weekly_count"
    log "Monthly backups: $monthly_count"
    log "Total backup size: $total_size"
}

##############################################################################
# Run Main Function
##############################################################################

main
display_stats

log "Backup script completed"
exit 0
