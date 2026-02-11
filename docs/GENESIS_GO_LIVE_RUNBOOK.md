# GENESIS Go-Live Runbook (Deploy → Providers → Onboarding)

This runbook is the execution order for taking GENESIS live with production controls.

## Phase A — Deploy

### A1. Infrastructure Accounts (one-time)

Confirm the following accounts and access are ready:

- Supabase (database, auth, realtime)
- Cloudflare (edge, DNS, WAF)
- GitHub (CI/CD)
- AI provider (OpenAI, Anthropic, or Azure OpenAI)
- Payments provider (Cash App Business)

### A2. Supabase deployment

```bash
npm install -g supabase
supabase init
supabase link --project-ref <PROJECT_ID>
supabase db push
supabase functions deploy
```

Required verification:

- Row Level Security (RLS) enabled on all tenant-aware tables.
- Service role key stays server-side only.
- Realtime enabled for:
  - `ai_requests`
  - `compliance_decisions`
  - `audits`

### A3. Backend services deployment

```bash
pnpm install
pnpm build
pnpm start
```

Target runtime services:

- `api-gateway`
- `ai-core`
- `compliance-engine` (`/E-LAW`)
- `avatar-service`
- `audit-service`
- `realtime-service`
- `payments-service`

### A4. Cloudflare edge

- Point DNS to API gateway origin.
- Enable Cloudflare rate limiting.
- Enable WAF managed/custom rules.
- Configure zero-trust security headers.
- Optional: workers for auth pre-checks.

### A5. CI/CD

On each push to `main`, enforce:

- lint
- build
- contract checks
- deployment

## Phase B — Connect providers

### B1. AI provider wiring

```bash
# Required: select provider
AI_PROVIDER=openai # or "anthropic" or "synthetic"

# If using OpenAI
OPENAI_API_KEY=sk-****
AI_MODEL=gpt-4.1-mini

# If using Anthropic
# AI_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-****
# ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# If using synthetic (for local/testing)
# AI_PROVIDER=synthetic
```

Enforcement requirements:

- No direct provider calls outside `ai-core`.
- Every inference call logged and auditable.
- Compliance policy gate runs before inference.

### B2. Payments (Cash App)

Webhook chain:

`Cash App → payments-service → ledger → audit`

Required controls:

- Signature verification
- Idempotency keys
- No AI access to raw payment payloads

### B3. Notifications (recommended)

- Email: Postmark or SendGrid
- SMS: Twilio
- Admin alerts via realtime channel

## Phase C — Onboard users

### C1. Role model

| Role | Access |
| --- | --- |
| User | Own GENIUS Avatar |
| Driver | Freight workflows |
| Enterprise | Multi-avatar workspace |
| Admin | Monitoring and controls |
| System | GENESIS PRIME |

### C2. Create initial avatars

- `GENESIS PRIME`:
  - role: `system`
  - compliance: `strict`
- First user avatar should include owner, role, policy attachments, and compliance level.

### C3. Onboarding pipeline

`Sign Up → Supabase Auth → Create GENIUS Avatar → Attach Policies → Activate → Realtime Connected`

Execution constraints:

- No user can execute actions without a GENIUS avatar.
- No GENIUS avatar can execute actions without `/E-LAW` policy enforcement.

### C4. Admin verification

Admin console must show:

- Live users
- Live avatars
- AI activity
- Compliance decisions
- Audit logs

## Final go-live checklist

- Infra deployed
- AI provider connected
- Payments live
- Realtime active
- Compliance enforced
- GENESIS PRIME active
- User onboarding active

## Verification automation

Use the repository verification script to quickly validate env and service wiring:

```bash
bash scripts/genesis-go-live-verify.sh
```
