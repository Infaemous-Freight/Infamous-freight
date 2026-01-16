# Phase 3 Testing Guide

## Quick Start

### 1. Create a Job (Logs: CREATED + PAYMENT_INITIATED)
```bash
curl -X POST http://localhost:4000/api/marketplace/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress": "123 Main St, SF, CA 94102",
    "dropoffAddress": "456 Oak Ave, SF, CA 94105",
    "pickupLat": 37.7749,
    "pickupLng": -122.4194,
    "dropoffLat": 37.7751,
    "dropoffLng": -122.4189
  }'
```

**Expected Response** (includes jobId):
```json
{
  "ok": true,
  "job": {
    "id": "cjld8s9d8abcd1234...",
    "status": "AWAITING_PAYMENT",
    "priceUsd": 8.75,
    ...
  }
}
```

### 2. Initiate Checkout (Logs: PAYMENT_INITIATED)
```bash
curl -X POST http://localhost:4000/api/marketplace/jobs/JOBID/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"returnUrl": "http://localhost:3000/jobs/JOBID"}'
```

**Expected Response** (includes Stripe session URL):
```json
{
  "ok": true,
  "sessionUrl": "https://checkout.stripe.com/pay/...",
  "sessionId": "cs_test_..."
}
```

### 3. View Job Timeline (All Events)
```bash
curl -X GET http://localhost:4000/api/marketplace/jobs/JOBID/timeline \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (chronological event list):
```json
{
  "ok": true,
  "job": {
    "id": "cjld8s9d8abcd1234...",
    "status": "AWAITING_PAYMENT",
    "shipper": {...},
    "driver": null,
    "pickupAddress": "...",
    "dropoffAddress": "...",
    "priceUsd": 8.75,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z",
    "payment": null
  },
  "timeline": [
    {
      "id": "event_001",
      "type": "CREATED",
      "actorUserId": "user_123",
      "message": "Created job from 123 Main St to 456 Oak Ave",
      "createdAt": "2025-01-15T10:00:00Z"
    },
    {
      "id": "event_002",
      "type": "PAYMENT_INITIATED",
      "actorUserId": "user_123",
      "message": "Stripe session cs_test_... created",
      "createdAt": "2025-01-15T10:01:00Z"
    }
  ]
}
```

---

## Event Logging Verification

### Check Events in Database Directly
```bash
# SSH into container or use psql
psql $DATABASE_URL

-- View all events for a job
SELECT id, type, actor_user_id, message, created_at 
FROM "JobEvent" 
WHERE job_id = 'JOBID' 
ORDER BY created_at ASC;

-- View latest event
SELECT * FROM "JobEvent" 
WHERE job_id = 'JOBID' 
ORDER BY created_at DESC 
LIMIT 1;

-- Count events by type
SELECT type, COUNT(*) 
FROM "JobEvent" 
GROUP BY type;
```

---

## Phase 3 Validation Checklist

- [ ] Job creation logs CREATED event with address details
- [ ] Job creation logs PAYMENT_INITIATED event with price
- [ ] Checkout endpoint logs PAYMENT_INITIATED event with session ID
- [ ] GET /jobs/:jobId/timeline returns all events in chronological order
- [ ] Timeline includes job details (shipper, pickup/dropoff, price)
- [ ] Non-owner cannot view timeline (403 Forbidden)
- [ ] WebhookEvent table stores jobId and stripeObjId for audit trail
- [ ] All syntax checks pass (`node -c`)
- [ ] Prisma schema validates successfully

---

## Common Issues & Fixes

### "Missing bearer token" when viewing timeline
```
Ensure you're passing Authorization header with valid JWT
```

### Timeline returns empty events array
```
Check JobEvent table in database — events may not be persisting.
Verify audit.ts is imported and logJobEvent() is called.
```

### Job has no shipper/driver/payment in timeline response
```
These are optional until assigned. Shipper/payment populate after creation.
Driver populates only after job is ACCEPTED.
```

### Webhook events not correlating with jobs
```
Verify Stripe webhook payload includes metadata.jobId
Check WebhookEvent table for jobId + stripeObjId columns populated
```

---

## Performance Notes

Timeline queries on large jobs (100+ events) should complete in < 100ms due to composite index.

If latency is high, verify Prisma indexes are created:
```sql
\d "JobEvent"  -- List indexes in psql
```

---

## Next Steps

After Phase 3 validation:
1. **Phase 4**: Add logging to driver actions (ACCEPTED, PICKED_UP, DELIVERED)
2. **Phase 5**: Implement advanced timeline search (filter by event type, actor, date range)
3. **Phase 6**: Add timeline webhooks for customer notifications

