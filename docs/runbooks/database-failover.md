# Database Failover Runbook

## 📋 Prerequisites

- PostgreSQL replication configured (see `setup-replication.sh`)
- Primary database running at `db-primary:5432`
- Secondary database running at `db-secondary:5432`
- Write access to DNS or load balancer configuration

## 🔄 Planned Failover (Maintenance)

Use this procedure for planned maintenance windows.

### Step 1: Verify Replication Status

```bash
# Check replication lag on primary
docker exec db-primary psql -U postgres -c "
SELECT client_addr, state, sync_state, replay_lag 
FROM pg_stat_replication;
"

# Verify secondary is catching up
docker exec db-secondary psql -U postgres -c "
SELECT * FROM pg_stat_wal_receiver;
"
```

**Expected:** Replay lag should be < 100ms

### Step 2: Stop Write Traffic

```bash
# Put application in read-only mode
docker exec api node -e "
const maintenance = require('./src/config/maintenance');
maintenance.enableReadOnlyMode();
"

# Verify no writes are happening
docker exec db-primary psql -U postgres -c "
SELECT count(*) FROM pg_stat_activity 
WHERE state = 'active' AND query ILIKE '%INSERT%' OR query ILIKE '%UPDATE%';
"
```

### Step 3: Promote Secondary to Primary

```bash
# Promote secondary to primary
docker exec db-secondary psql -U postgres -c "SELECT pg_promote();"

# Wait for promotion (usually < 5 seconds)
sleep 5

# Verify secondary is now accepting writes
docker exec db-secondary psql -U postgres -c "
SHOW wal_level;
SELECT pg_is_in_recovery();
"
```

**Expected:** `pg_is_in_recovery()` returns `false`

### Step 4: Update Application Configuration

```bash
# Update DATABASE_URL to point to new primary
export NEW_PRIMARY_URL="postgresql://user:pass@db-secondary:5432/infamous_freight"

# Update environment variable
docker-compose -f docker-compose.prod.yml down
sed -i "s|DATABASE_URL=.*|DATABASE_URL=$NEW_PRIMARY_URL|" .env
docker-compose -f docker-compose.prod.yml up -d

# Or update DNS record
# aws route53 change-resource-record-sets --hosted-zone-id Z123 \
#   --change-batch '{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"db.infamous-freight.com","Type":"CNAME","TTL":60,"ResourceRecords":[{"Value":"db-secondary"}]}}]}'
```

### Step 5: Re-enable Write Traffic

```bash
# Disable read-only mode
docker exec api node -e "
const maintenance = require('./src/config/maintenance');
maintenance.disableReadOnlyMode();
"

# Verify writes are working
curl -X POST http://localhost:4000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{"origin":"Test","destination":"Test"}'
```

### Step 6: Reconfigure Old Primary as Secondary

```bash
# Stop old primary
docker exec db-primary psql -U postgres -c "SELECT pg_ctl stop -D /var/lib/postgresql/data;"

# Remove old data directory
docker exec db-primary rm -rf /var/lib/postgresql/data/*

# Create base backup from new primary
docker exec db-primary pg_basebackup \
  -h db-secondary \
  -D /var/lib/postgresql/data \
  -U replicator \
  -P -v -R -X stream

# Start old primary as secondary
docker exec db-primary pg_ctl -D /var/lib/postgresql/data start
```

### Step 7: Verify New Replication

```bash
# Check replication status on new primary
docker exec db-secondary psql -U postgres -c "
SELECT * FROM pg_stat_replication;
"

# Check new secondary is receiving data
docker exec db-primary psql -U postgres -c "
SELECT * FROM pg_stat_wal_receiver;
"
```

---

## 🚨 Emergency Failover (Unplanned)

Use this procedure when primary database is DOWN.

### Step 1: Confirm Primary is Down

```bash
# Try to connect to primary
docker exec api nc -zv db-primary 5432 || echo "PRIMARY IS DOWN"

# Check Docker container status
docker ps | grep db-primary
docker logs --tail=50 db-primary
```

### Step 2: Immediate Secondary Promotion

```bash
# Promote secondary immediately (DO NOT WAIT)
docker exec db-secondary psql -U postgres -c "SELECT pg_promote();"

# Verify promotion
docker exec db-secondary psql -U postgres -c "SELECT pg_is_in_recovery();"
```

**Expected:** Returns `false` (not in recovery mode)

### Step 3: Emergency Application Reconfiguration

```bash
# Update database connection immediately
export DATABASE_URL="postgresql://user:pass@db-secondary:5432/infamous_freight"

# Restart API with new connection
docker-compose -f docker-compose.prod.yml restart api

# Verify API is working
curl http://localhost:4000/api/health
```

### Step 4: Notify Stakeholders

```bash
# Post to status page
curl -X POST https://api.statuspage.io/v1/pages/PAGE_ID/incidents \
  -H "Authorization: OAuth YOUR_TOKEN" \
  -d '{
    "incident": {
      "name": "Database Failover In Progress",
      "status": "investigating",
      "body": "Primary database failure detected. Failing over to secondary.",
      "impact_override": "major"
    }
  }'

# Send Slack notification
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🚨 EMERGENCY: Database failover to secondary completed. Investigating primary failure.",
    "username": "InfamousOps"
  }'
```

### Step 5: Verify Data Integrity

```bash
# Check recent transactions
docker exec db-secondary psql -U postgres -d infamous_freight -c "
SELECT * FROM shipments ORDER BY created_at DESC LIMIT 10;
"

# Verify no corruption
docker exec db-secondary psql -U postgres -c "
SELECT datname, pg_database_size(datname) 
FROM pg_database 
WHERE datname = 'infamous_freight';
"

# Run consistency checks
docker exec db-secondary psql -U postgres -d infamous_freight -c "
SELECT tablename, n_live_tup, n_dead_tup 
FROM pg_stat_user_tables;
"
```

### Step 6: Investigate Primary Failure

```bash
# Check logs for errors
docker logs db-primary | grep -E 'ERROR|FATAL' | tail -100

# Check disk space
docker exec db-primary df -h

# Check memory
docker stats db-primary --no-stream

# Check for corruption
docker exec db-primary pg_controldata /var/lib/postgresql/data
```

### Step 7: Recover or Replace Primary

**Option A: Restart Primary (if issue was temporary)**
```bash
docker-compose -f docker-compose.prod.yml restart db-primary

# Reconfigure as secondary
./scripts/setup-replication.sh
```

**Option B: Provision New Database**
```bash
# Spin up new database instance
docker run -d --name db-new \
  --network infamous-network \
  -e POSTGRES_PASSWORD=secure_password \
  postgres:15-alpine

# Configure as secondary of current primary
# (follow replication setup steps)
```

---

## 🔧 Automated Failover (Future Enhancement)

### Using Patroni

```yaml
# patroni.yml
scope: infamous-freight
namespace: /db/
name: postgres1

restapi:
  listen: 0.0.0.0:8008
  connect_address: postgres1:8008

etcd:
  host: etcd:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
    postgresql:
      use_pg_rewind: true

postgresql:
  listen: 0.0.0.0:5432
  connect_address: postgres1:5432
  data_dir: /var/lib/postgresql/data
  pgpass: /tmp/pgpass
  authentication:
    replication:
      username: replicator
      password: secure_password
```

### Using PgBouncer for Connection Pooling

```ini
# pgbouncer.ini
[databases]
infamous_freight = host=db-primary port=5432 dbname=infamous_freight

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

---

## 📊 Monitoring After Failover

### Key Metrics to Watch

1. **Replication Lag**
```sql
SELECT replay_lag FROM pg_stat_replication;
```

2. **Active Connections**
```sql
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

3. **Transaction Rate**
```sql
SELECT sum(xact_commit + xact_rollback) FROM pg_stat_database WHERE datname = 'infamous_freight';
```

4. **Error Rate**
```bash
docker logs api | grep 'database' | grep -i error | wc -l
```

### Grafana Alerts to Enable

- Replication lag > 500ms
- No active replication connection
- Database connection failures > 1%
- Slow queries > 1s

---

## ✅ Post-Failover Checklist

- [ ] Verify all services are connected to new primary
- [ ] Confirm replication is working (if secondary configured)
- [ ] Check application logs for database errors
- [ ] Run database integrity checks
- [ ] Update monitoring dashboards
- [ ] Schedule investigation of primary failure
- [ ] Update status page with resolution
- [ ] Document incident in post-mortem
- [ ] Review and update failover procedures
- [ ] Test rollback procedure

---

## 🧪 Testing Failover

### Monthly Failover Drill

```bash
# 1. Schedule maintenance window
# 2. Announce on status page
# 3. Execute planned failover procedure
# 4. Verify application functionality
# 5. Measure time to failover (target: < 5 minutes)
# 6. Document any issues encountered
# 7. Update runbook based on learnings
```

### Automated Testing

```bash
# chaos-engineering/db-failover-test.sh
#!/bin/bash
echo "Starting failover test..."

# Kill primary
docker stop db-primary

# Wait for automatic failover
sleep 30

# Verify app is still responding
if curl -f http://localhost:4000/api/health; then
  echo "✓ Failover successful"
else
  echo "✗ Failover failed"
  exit 1
fi

# Restore primary
docker start db-primary
```

---

## 📞 Emergency Contacts

- **Database Admin**: dba@infamous-freight.com
- **On-Call Engineer**: PagerDuty
- **AWS Support**: (if using RDS) https://console.aws.amazon.com/support/
- **Status Page**: https://status.infamous-freight.com

---

## 📚 Additional Resources

- [PostgreSQL Replication Documentation](https://www.postgresql.org/docs/current/warm-standby.html)
- [Setup Replication Script](../../scripts/setup-replication.sh)
- [Database Backup Script](../../scripts/backup-database.sh)
- [Incident Response Runbook](incident-response.md)
