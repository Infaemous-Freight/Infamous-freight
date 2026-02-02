# Render API Testing Guide

## Setup

1. **Get your API key** from <https://dashboard.render.com/>
   - Navigate to: Profile → Account Settings → API Keys
   - Create new key or copy existing one

2. **Set environment variable:**

   ```bash
   export RENDER_API_KEY="your-actual-key-here"
   ```

## Direct Database Connection

For database management, queries, or manual inspection:

```bash
# Connect with psql (requires PostgreSQL client installed)
PGPASSWORD=Ae5GguNrKQiIIIyPuBm7G1A4i5NMWHIn psql -h dpg-d50s6gp5pdvs739a3g10-a.oregon-postgres.render.com -U infamous infamous_freight
```

**Common psql commands:**

```sql
-- List all tables
\dt

-- Describe a table
\d table_name

-- Count records
SELECT COUNT(*) FROM "User";

-- View recent shipments
SELECT * FROM "Shipment" ORDER BY "createdAt" DESC LIMIT 10;

-- Exit
\q
```

**Or use connection string:**

```bash
psql "postgresql://infamous:Ae5GguNrKQiIIIyPuBm7G1A4i5NMWHIn@dpg-d50s6gp5pdvs739a3g10-a.oregon-postgres.render.com/infamous_freight"
```

## Quick Test

```bash
# Test API connectivity
curl --header "Authorization: Bearer $RENDER_API_KEY" \
     https://api.render.com/v1/services
```

Expected: JSON response with your services

## Testing the Backup Script

```bash
# Set API key
export RENDER_API_KEY="your-key"

# Run backup script
./scripts/backup-database.sh
```

Expected output:

```
🔄 Starting database backup for infamous_freight...
📤 Triggering backup job...
✅ Backup job started: job-abc123
⏳ Waiting for backup to complete...
⏳ Status: running (attempt 1/30)
✅ Backup completed successfully!
```

## Manual Testing Steps

### 1. List Services

```bash
curl --header "Authorization: Bearer $RENDER_API_KEY" \
     https://api.render.com/v1/services
```

### 2. Start Backup Job

```bash
curl --request POST 'https://api.render.com/v1/services/dpg-d50s6gp5pdvs739a3g10-a/jobs' \
     --header "Authorization: Bearer $RENDER_API_KEY" \
     --header 'Content-Type: application/json' \
     --data-raw '{"startCommand": "pg_dump infamous_freight"}'
```

### 3. Check Job Status

```bash
# Replace JOB_ID with actual ID from step 2
curl --request GET "https://api.render.com/v1/services/dpg-d50s6gp5pdvs739a3g10-a/jobs/JOB_ID" \
     --header "Authorization: Bearer $RENDER_API_KEY"
```

## Verification

✅ API returns valid JSON (not 401 Unauthorized)
✅ Service list includes database `dpg-d50s6gp5pdvs739a3g10-a`
✅ Backup job starts successfully
✅ Job status progresses: pending → running → succeeded
✅ Backup history log created: `backups/backup-history.log`

## Troubleshooting

**401 Unauthorized**: Invalid API key

- Regenerate key in Render dashboard
- Make sure no extra spaces in environment variable

**404 Not Found**: Invalid service ID

- List all services to find correct ID
- Database service ID: `dpg-d50s6gp5pdvs739a3g10-a`

**Timeout**: Backup taking too long

- Check Render dashboard for job status
- Default timeout: 5 minutes (30 attempts × 10s)
- Increase `MAX_ATTEMPTS` in script if needed

## Next Steps

After successful testing:

1. Add to weekly routine (every Sunday)
2. Monitor `backups/backup-history.log` for failures
3. Set up automated alerts if needed
