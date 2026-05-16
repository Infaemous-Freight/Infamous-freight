# Fly Runtime Operations

## Current production app

- App: `infamous-freight-api`
- Region: `dfw`
- Process: `node apps/api/dist/src/server.js`
- Health check: `/api/health/live`
- VM: `shared-cpu-1x`, `512mb`
- Auto-stop: disabled
- Deploy strategy: rolling

## What to monitor

### Memory

Watch for:

- OOM restarts
- increasing RSS after deploys
- Prisma/client memory growth
- Socket.io connection growth
- AI request spikes

Upgrade trigger:

```text
If memory usage remains above 75% for sustained production periods or OOM restarts occur, move from 512mb to 1gb.
```

### Concurrency

Current limits:

```toml
soft_limit = 25
hard_limit = 40
```

Do not raise until load tests and DB pool behavior are measured.

### Health

Required checks:

- `/api/health/live`
- `/api/health/ready`
- deployment smoke test
- realtime Socket.io handshake

### Database pool

Watch for:

- connection exhaustion
- Supavisor errors
- Prisma timeout errors
- repeated malformed DB URL errors

## Review commands

```bash
fly status -a infamous-freight-api
fly checks list -a infamous-freight-api
fly logs -a infamous-freight-api
fly machine list -a infamous-freight-api
fly machine status <machine-id> -a infamous-freight-api
```

## Scaling rules

### Scale memory first when

- API is stable but memory pressure is high
- Prisma or Socket.io usage increases
- OOM restarts appear

Recommended next step:

```toml
memory = "1gb"
memory_mb = 1024
```

### Add machines when

- latency rises but memory is healthy
- request load increases
- uptime requirements justify redundancy

Recommended next step:

```toml
min_machines_running = 2
```

### Raise concurrency only when

- load tests prove headroom
- database pool has capacity
- p95 latency stays below target

## Weekly Fly review

- Check latest deploy state.
- Review health check failures.
- Review memory pressure.
- Review API latency.
- Review restarts.
- Review logs for database errors.
- Confirm smoke tests pass.
