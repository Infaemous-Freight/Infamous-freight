# Dispatch Realtime WebSocket Contract

## Endpoint

`GET /dispatch` (WebSocket upgrade)

## Message Envelope

```json
{
  "type": "LOAD_STATUS_UPDATED",
  "loadId": "uuid",
  "status": "IN_TRANSIT",
  "location": { "lat": 41.88, "lng": -87.63 },
  "timestamp": "2026-01-30T12:34:56.000Z"
}
```

## Scaling Strategy

- Publish incoming updates to Redis Pub/Sub channel `dispatch-updates`.
- Fan out to local socket clients.
- Keep channel payloads idempotent and versioned.
