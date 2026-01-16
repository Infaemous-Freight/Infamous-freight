# Phase 4: Race-Safe Acceptance — Testing Guide

## Quick Start

### Prerequisites
- Job created and paid via Stripe (Phase 2 complete)
- Job should be OPEN status
- At least 1 eligible driver with:
  - Active profile
  - Valid location (lastLat, lastLng)
  - Compatible vehicle (same type as job requires)

---

## Test 1: Single Driver Accept (Happy Path)

### Setup
```bash
# 1. Ensure you have a paid OPEN job
JOB_ID="your_job_id"
DRIVER_JWT="your_driver_token"
DRIVER_ID="your_driver_id"
```

### Execute
```bash
curl -X POST http://localhost:4000/api/marketplace/jobs/$JOB_ID/accept \
  -H "Authorization: Bearer $DRIVER_JWT" \
  -H "Content-Type: application/json"
```

### Expected Response
```json
{
  "ok": true,
  "job": {
    "id": "job_123",
    "status": "ACCEPTED",
    "driverId": "driver_456",
    "shipper": { "id": "shipper_789", "email": "...", "name": "..." },
    "driver": { "id": "driver_456", "email": "...", "name": "..." },
    "pickupAddress": "...",
    "dropoffAddress": "...",
    "priceUsd": 15.50,
    "payment": { "status": "SUCCEEDED", ... },
    "events": [
      { "type": "CREATED", ... },
      { "type": "PAYMENT_INITIATED", ... },
      { "type": "PAYMENT_SUCCEEDED", ... },
      { "type": "OPENED", ... },
      { "type": "ACCEPTED", "actorUserId": "driver_456", "message": "Driver accepted job" }
    ]
  }
}
```

### Verify
```bash
# Check job status updated
curl -X GET http://localhost:4000/api/marketplace/jobs/$JOB_ID/timeline \
  -H "Authorization: Bearer $DRIVER_JWT" | jq '.job.status, .timeline | last'

# Should show:
# "ACCEPTED"
# { "type": "ACCEPTED", "actorUserId": "driver_456", ... }
```

---

## Test 2: Race Condition (Two Drivers Simultaneously)

### Setup
```bash
JOB_ID="your_open_job_id"
DRIVER1_JWT="token_for_driver_1"
DRIVER1_ID="driver_1"
DRIVER2_JWT="token_for_driver_2"
DRIVER2_ID="driver_2"

# Both drivers must be:
# - Active
# - Have location set
# - Have compatible vehicle
```

### Execute (Terminal 1)
```bash
curl -X POST http://localhost:4000/api/marketplace/jobs/$JOB_ID/accept \
  -H "Authorization: Bearer $DRIVER1_JWT" \
  -H "Content-Type: application/json" | jq
```

### Execute (Terminal 2 - at the same time)
```bash
curl -X POST http://localhost:4000/api/marketplace/jobs/$JOB_ID/accept \
  -H "Authorization: Bearer $DRIVER2_JWT" \
  -H "Content-Type: application/json" | jq
```

### Expected Results
**One succeeds** (example: Driver 1):
```json
{
  "ok": true,
  "job": {
    "id": "job_123",
    "status": "ACCEPTED",
    "driverId": "driver_1"
  }
}
```

**One fails** (example: Driver 2):
```json
{
  "error": "Job was just accepted by another driver"
}
```

### Why This Matters
- Without race-safe logic: Both might think they accepted it, job assigned to second updater
- With race-safe logic: Only one succeeds, second fails immediately with clear message

---

## Test 3: Ineligible Driver (Lacks Vehicle)

### Setup
```bash
DRIVER_NO_VEHICLE_ID="driver_without_van"
JOB_REQUIRES_VAN="job_needing_van"
```

### Execute
```bash
curl -X POST http://localhost:4000/api/marketplace/jobs/$JOB_REQUIRES_VAN/accept \
  -H "Authorization: Bearer $DRIVER_NO_VEHICLE_JWT" \
  -H "Content-Type: application/json"
```

### Expected Response
```json
{
  "error": "No compatible vehicle available"
}
```

### Verify in Database
```bash
# Job status should NOT change
psql $DATABASE_URL
SELECT status, driver_id FROM "Job" WHERE id = '$JOB_REQUIRES_VAN';
# Should show: OPEN | null
```

---

## Test 4: Inactive Driver

### Setup
```bash
# Deactivate a driver
psql $DATABASE_URL
UPDATE "DriverProfile" SET "isActive" = false 
WHERE "userId" = 'driver_id_to_deactivate';
```

### Execute
```bash
curl -X POST http://localhost:4000/api/marketplace/jobs/$JOB_ID/accept \
  -H "Authorization: Bearer $INACTIVE_DRIVER_JWT"
```

### Expected Response
```json
{
  "error": "Driver is not active"
}
```

---

## Test 5: Missing Driver Location

### Setup
```bash
# Create a driver without location
# Or clear location:
psql $DATABASE_URL
UPDATE "DriverProfile" SET "lastLat" = NULL, "lastLng" = NULL
WHERE "userId" = 'driver_id';
```

### Execute
```bash
curl -X POST http://localhost:4000/api/marketplace/jobs/$JOB_ID/accept \
  -H "Authorization: Bearer $NO_LOCATION_JWT"
```

### Expected Response
```json
{
  "error": "Driver location not available"
}
```

---

## Test 6: Unpaid Job (No Payment Record)

### Setup
```bash
# Create a job but DON'T pay
# Or manually reset payment status:
psql $DATABASE_URL
UPDATE "JobPayment" SET status = 'PENDING'
WHERE "jobId" = 'job_id';
```

### Execute
```bash
curl -X POST http://localhost:4000/api/marketplace/jobs/$UNPAID_JOB_ID/accept \
  -H "Authorization: Bearer $DRIVER_JWT"
```

### Expected Response
```json
{
  "error": "Job payment not confirmed"
}
```

---

## Test 7: View My Jobs

### Execute
```bash
curl -X GET http://localhost:4000/api/marketplace/drivers/$DRIVER_ID/jobs \
  -H "Authorization: Bearer $DRIVER_JWT" | jq
```

### Expected Response
```json
{
  "ok": true,
  "count": 3,
  "jobs": [
    {
      "id": "job_123",
      "status": "ACCEPTED",
      "driverId": "driver_1",
      "shipper": { ... },
      "payment": { ... },
      ...
    },
    ...
  ]
}
```

### Verify Authorization
```bash
# Driver 2 tries to view Driver 1's jobs
curl -X GET http://localhost:4000/api/marketplace/drivers/$DRIVER1_ID/jobs \
  -H "Authorization: Bearer $DRIVER2_JWT"

# Expected: 403 Forbidden
# { "error": "Cannot view another driver's jobs" }
```

---

## Test 8: Admin Can View Any Driver's Jobs

### Execute
```bash
curl -X GET http://localhost:4000/api/marketplace/drivers/$DRIVER1_ID/jobs \
  -H "Authorization: Bearer $ADMIN_JWT"
```

### Expected Response
```json
{
  "ok": true,
  "count": 5,
  "jobs": [ ... ]
}
```

---

## Stress Test: 10 Drivers Race for Same Job

### Setup Script
```bash
#!/bin/bash

JOB_ID="job_to_race_for"

# Array of driver tokens
DRIVERS=(
  "driver1_token"
  "driver2_token"
  "driver3_token"
  "driver4_token"
  "driver5_token"
  "driver6_token"
  "driver7_token"
  "driver8_token"
  "driver9_token"
  "driver10_token"
)

# Launch all 10 simultaneously
for token in "${DRIVERS[@]}"; do
  curl -X POST http://localhost:4000/api/marketplace/jobs/$JOB_ID/accept \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -w "\nHTTP Status: %{http_code}\n" &
done

wait
```

### Expected Outcome
- **1 driver**: HTTP 200 with `{ ok: true, job: { status: "ACCEPTED", driverId: "..." } }`
- **9 drivers**: HTTP 400 with `{ error: "Job was just accepted by another driver" }`
- **Job status**: ACCEPTED with 1 assigned driver
- **JobEvent table**: Exactly 1 ACCEPTED event (no duplicates)

### Verify Results
```bash
psql $DATABASE_URL
-- Check job only has one driver
SELECT id, status, driver_id FROM "Job" WHERE id = '$JOB_ID';

-- Check exactly one ACCEPTED event
SELECT COUNT(*) FROM "JobEvent" 
WHERE job_id = '$JOB_ID' AND type = 'ACCEPTED';
# Should show: 1
```

---

## Database Verification Queries

```bash
psql $DATABASE_URL

-- View all events for a job
SELECT type, actor_user_id, message, created_at 
FROM "JobEvent" 
WHERE job_id = 'job_123'
ORDER BY created_at;

-- Check job status and driver
SELECT id, status, driver_id, updated_at 
FROM "Job" 
WHERE id = 'job_123';

-- View all jobs for a driver
SELECT id, status, shipper_id, price_usd, created_at 
FROM "Job" 
WHERE driver_id = 'driver_456'
ORDER BY created_at DESC;

-- Count ACCEPTED events
SELECT type, COUNT(*) 
FROM "JobEvent" 
WHERE type = 'ACCEPTED'
GROUP BY type;
```

---

## Common Issues & Fixes

### Issue: "Job not found"
- Verify JOB_ID exists in database
- Check you're using correct job ID (not shipper ID, etc.)

### Issue: "Driver not found"
- Verify DRIVER_ID exists
- Check driver role is set to "DRIVER"

### Issue: "Driver is not active"
- Activate driver: `UPDATE "DriverProfile" SET "isActive" = true WHERE "userId" = 'driver_id'`

### Issue: "Driver location not available"
- Set driver location: `UPDATE "DriverProfile" SET "lastLat" = 37.7749, "lastLng" = -122.4194 WHERE "userId" = 'driver_id'`

### Issue: "No compatible vehicle available"
- Add vehicle for driver with matching type and capacity
- Verify vehicle type matches job's requiredVehicle

### Issue: Race test shows both drivers accepted it
- Verify using `updateMany` with compound WHERE clause (not `update`)
- Check code in router.js lines 500-515
- Ensure transaction isolation level is correct

---

## Performance Notes

**Expected Latencies**:
- Accept (successful): ~80-120ms
- Accept (race loss): ~40-60ms
- List jobs (10 items): ~20-40ms
- List jobs (100 items): ~40-70ms

**If Slow**:
1. Check database indexes: `\d "Job"` in psql
2. Verify network latency: `curl -w "@curl-format.txt" ...`
3. Check API server logs for errors
4. Monitor database connection pool

---

## Summary Checklist

- [ ] Single driver accept works
- [ ] ACCEPTED event logged correctly
- [ ] Race test shows 1 winner, 9 failures
- [ ] Ineligible driver (no vehicle) rejected
- [ ] Inactive driver rejected
- [ ] No location driver rejected
- [ ] Unpaid job rejected
- [ ] View my jobs returns correct driver's jobs
- [ ] Non-admin cannot view other driver's jobs
- [ ] Admin can view any driver's jobs
- [ ] Stress test (10 drivers) shows 1 success, 9 failures
- [ ] Database shows exactly 1 ACCEPTED event per job

---

**Phase 4 Testing Complete!** 🎉

