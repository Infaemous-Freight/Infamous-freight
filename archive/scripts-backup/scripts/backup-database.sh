#!/bin/bash

# Database Backup Script for Render PostgreSQL
# Usage: ./scripts/backup-database.sh

set -e

# Configuration
SERVICE_ID="dpg-d50s6gp5pdvs739a3g10-a"
DATABASE_NAME="infamous_freight"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Check for API key
if [ -z "$RENDER_API_KEY" ]; then
    echo "❌ Error: RENDER_API_KEY environment variable not set"
    echo "Get your API key from: https://dashboard.render.com/"
    echo "Then run: export RENDER_API_KEY='your-key-here'"
    exit 1
fi

echo "🔄 Starting database backup for $DATABASE_NAME..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Step 1: Trigger backup job
echo "📤 Triggering backup job..."
RESPONSE=$(curl -s --request POST "https://api.render.com/v1/services/$SERVICE_ID/jobs" \
     --header "Authorization: Bearer $RENDER_API_KEY" \
     --header "Content-Type: application/json" \
     --data-raw "{
        \"startCommand\": \"pg_dump $DATABASE_NAME\"
     }")

# Extract job ID
JOB_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
    echo "❌ Failed to start backup job"
    echo "Response: $RESPONSE"
    exit 1
fi

echo "✅ Backup job started: $JOB_ID"

# Step 2: Poll job status
echo "⏳ Waiting for backup to complete..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    STATUS_RESPONSE=$(curl -s --request GET "https://api.render.com/v1/services/$SERVICE_ID/jobs/$JOB_ID" \
         --header "Authorization: Bearer $RENDER_API_KEY")
    
    STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    case $STATUS in
        "succeeded")
            echo "✅ Backup completed successfully!"
            echo "Job ID: $JOB_ID"
            echo "Timestamp: $TIMESTAMP"
            echo "Status: $STATUS"
            
            # Log successful backup
            echo "$TIMESTAMP,$JOB_ID,succeeded" >> "$BACKUP_DIR/backup-history.log"
            exit 0
            ;;
        "failed")
            echo "❌ Backup failed"
            echo "Job ID: $JOB_ID"
            echo "Check logs: https://dashboard.render.com/"
            echo "$TIMESTAMP,$JOB_ID,failed" >> "$BACKUP_DIR/backup-history.log"
            exit 1
            ;;
        "running"|"pending")
            echo "⏳ Status: $STATUS (attempt $((ATTEMPT + 1))/$MAX_ATTEMPTS)"
            sleep 10
            ;;
        *)
            echo "⚠️  Unknown status: $STATUS"
            ;;
    esac
    
    ATTEMPT=$((ATTEMPT + 1))
done

echo "⏰ Backup timed out after $MAX_ATTEMPTS attempts"
echo "Check status manually:"
echo "curl --request GET 'https://api.render.com/v1/services/$SERVICE_ID/jobs/$JOB_ID' --header 'Authorization: Bearer \$RENDER_API_KEY'"
exit 1
