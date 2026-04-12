# Netlify Production Runbook for `www.infamousfreight.com`

This runbook is the frontend hosting override for production.

## Decision

Keep the public frontend on Netlify at:

- `https://www.infamousfreight.com`

Keep the backend split out to a separate service at:

- `https://api.infamousfreight.com`
- `https://hooks.infamousfreight.com`

## Why this is the right move

If `www.infamousfreight.com` is the domain you can actually use on Netlify, do not fight that constraint. Keep Netlify on `www` and keep the backend on a separate hostname.

This preserves:

- existing domain control
- cleaner frontend deployment
- separate backend scaling and security boundaries
- cleaner webhook isolation

## Netlify site settings

Use the existing Netlify site for the public frontend.

Recommended build settings for the monorepo:

- Base directory: repository root
- Package directory: `apps/web`
- Build command: `pnpm install --frozen-lockfile && pnpm --filter web build`
- Publish directory: `apps/web/out`

## Production domains

Set the Netlify primary production domain to:

- `www.infamousfreight.com`

Add the apex domain as the alternate production domain:

- `infamousfreight.com`

Expected behavior:

- `infamousfreight.com` redirects to `https://www.infamousfreight.com`
- `www.infamousfreight.com` stays the canonical public site

## Required frontend environment values

Set these in Netlify:

- `NEXT_PUBLIC_SITE_URL=https://www.infamousfreight.com`
- `NEXT_PUBLIC_API_URL=https://api.infamousfreight.com/api`
- `NEXT_PUBLIC_APP_ENV=production`

## Backend split

Do not put the backend under the Netlify `www` domain.

Use a separate backend hostname for the API and webhooks:

- `api.infamousfreight.com`
- `hooks.infamousfreight.com`

## What to ignore from older deployment notes

If older docs reference Netlify or Vercel differently, follow `docs/deployment/TARGET_PRODUCTION_ARCHITECTURE.md` as the source of truth for production cutover. Use this runbook only as a temporary fallback when domain constraints block the planned Vercel migration.
