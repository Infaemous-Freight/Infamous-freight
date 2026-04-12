# Target Production Deployment Architecture

## Goal

Move Infamous Freight to a clean production topology with:

- Cloudflare at the edge for DNS, SSL, WAF, and rate limiting
- Vercel for the `apps/web` Next.js frontend
- Render for the `apps/api` service and `apps/worker`
- Supabase Postgres as the managed production database

## Current Constraint

The current API code exposes routes under `/api/*`, not `/v1/*`.

That means the production API should keep this shape:

- `https://api.infamousfreight.com/api/health`
- `https://api.infamousfreight.com/api/auth/*`
- `https://api.infamousfreight.com/api/loads/*`
- `https://api.infamousfreight.com/api/webhooks/stripe`

Do not introduce a `/v1` prefix during the hosting cutover unless the API itself is versioned in code first.

## Target Route Map

### Phase 1: cut over with the current codebase

- `infamousfreight.com` -> redirect to `https://www.infamousfreight.com`
- `www.infamousfreight.com` -> Vercel project for `apps/web`
- `api.infamousfreight.com` -> Render API service for `apps/api`
- `hooks.infamousfreight.com` -> same Render API service, restricted by Cloudflare rules to webhook traffic
- `status.infamousfreight.com` -> optional status page provider

### Phase 2: split customer and internal surfaces

Once host-based UX or separate frontend surfaces are implemented, extend the map to:

- `portal.infamousfreight.com` -> customer-facing portal
- `app.infamousfreight.com` -> internal operations dashboard

## Hosting Responsibilities

### Cloudflare

Use Cloudflare for:

- authoritative DNS
- proxied SSL termination
- WAF rules
- bot filtering
- rate limiting on `/api/auth/*`, `/api/webhooks/*`, `/quote`, and `/track`
- apex redirect from `infamousfreight.com` to `www.infamousfreight.com`

### Vercel

Use one Vercel project for `apps/web`.

Recommended settings:

- root directory: `apps/web`
- install command: `corepack enable && corepack prepare pnpm@10.33.0 --activate && pnpm install --frozen-lockfile`
- build command: `pnpm --filter web build`
- output: Next.js managed output

### Render

Use Render for:

- API web service from `apps/api`
- background worker from `apps/worker`
- Redis for queue workloads

### Supabase

Use Supabase Postgres as the primary production database.

## Required Environment Direction

### Frontend (`apps/web`)

Point the frontend at the production API domain:

- `NEXT_PUBLIC_SITE_URL=https://www.infamousfreight.com`
- `NEXT_PUBLIC_API_URL=https://api.infamousfreight.com/api`
- `NEXT_PUBLIC_APP_ENV=production`

### API (`apps/api`)

Use production hostnames in the API configuration:

- `WEB_BASE_URL=https://www.infamousfreight.com`
- `API_BASE_URL=https://api.infamousfreight.com/api`
- `CORS_ORIGIN=https://www.infamousfreight.com,https://app.infamousfreight.com,https://portal.infamousfreight.com`
- `CORS_ORIGINS=https://www.infamousfreight.com,https://app.infamousfreight.com,https://portal.infamousfreight.com`

## Cutover Order

1. Provision database and cache.
2. Deploy API and worker on Render.
3. Attach `api.infamousfreight.com` and validate `/health` and `/api/health`.
4. Deploy `apps/web` to Vercel.
5. Attach `www.infamousfreight.com` to Vercel.
6. Put Cloudflare in front of both domains.
7. Create redirect from apex to `www`.
8. Add `hooks.infamousfreight.com` to the same API service and lock it down with Cloudflare rules.
9. Decommission Netlify after the new stack is verified.

## What not to do

- Do not keep production on a mixed Netlify + Fly + dormant Vercel setup.
- Do not move the public frontend to the `app` subdomain.
- Do not move webhook traffic through the same public hostname as the website.
- Do not change API path prefixes during hosting migration.
