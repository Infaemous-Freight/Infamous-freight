# Auth & Rate Limit Runbook

## JWT & Scopes

- JWT secret: `JWT_SECRET` (api). Token must include `sub`; `org_id` is required where `requireOrganization` is used.
- Scopes: enforced per route via `requireScope()`. Example: `ai:command`, `voice:ingest`, `billing:write`, `shipments:read|write`, `users:read|write`, `admin`.
- Dev override: `x-user-id` header is accepted when no bearer token (for local only). Use `x-org-id` to simulate org context.

## Rate Limiters (see api/src/middleware/security.js)

- `general`: default (100 / 15m).
- `auth`: login/password change (5 / 15m).
- `ai`: AI commands/history (20 / min).
- `billing`: billing routes (30 / 15m).
- `voice`: voice ingest/command (10 / min).
- `export`: exports (5 / hour).
- `passwordReset`: reset requests (3 / 24h per email).
- `webhook`: inbound webhooks (100 / min).

Skip list: health endpoints are skipped by limiter.

## Expected middleware order

`limiters -> authenticate -> requireScope -> requireOrganization (where needed) -> auditLog -> validators -> handleValidationErrors -> handler -> next(err)`

## Operations

- Temporarily widen a limiter: set `RATE_LIMIT_<NAME>_MAX` / `_WINDOW_MS` env vars and restart API.
- Health check: `GET /api/health` (skips limits). Use for uptime probes.
- Voice upload size: `VOICE_MAX_FILE_SIZE_MB` (defaults 10MB). Unsupported MIME returns 400.
- AI feature flag: `ENABLE_AI_COMMANDS=false` returns 503 for `/ai/command`.
- Voice feature flag: `ENABLE_VOICE_PROCESSING=false` returns 503 for `/voice/ingest`.

## Testing

- API tests: `pnpm --filter api test`.
- New validation coverage: `api/src/routes/__tests__/shipments.validation.test.js` exercises UUID/body validation and scope+auth chain for shipments.

## Common issues

- Missing `JWT_SECRET`: auth middleware returns 500 "Server auth misconfiguration".
- Missing scopes: returns 403 with `required` scopes array.
- Org-required routes: ensure token includes `org_id`; otherwise 401 "No organization".
- Rate limit hits: 429 with JSON message per limiter configuration.

## Logging & Sentry

- Errors: global handler logs via `logger.error` and captures to Sentry when `SENTRY_DSN` is set.
- Audit log: `auditLog` masks Authorization and chains to tamper-evident log.
