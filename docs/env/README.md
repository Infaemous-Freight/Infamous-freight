# Environment Variable Templates

This directory contains environment variable templates for different deployment tiers.

## Files

| File | Purpose |
|------|---------|
| `.env.cost-optimized.example` | Cost-optimized (staging / small-scale) deployment |
| `.env.tier1-5-production.example` | Full production tiers 1–5 (enterprise scale) |

## Quick Start

Copy the root `.env.example` for local development:

```bash
cp .env.example .env
# Then fill in the required values
```

For environment-specific deployments, use the appropriate template from this directory:

```bash
# Cost-optimized / staging
cp docs/env/.env.cost-optimized.example .env

# Production (enterprise)
cp docs/env/.env.tier1-5-production.example .env
```

## Security

- **Never** commit `.env` files to source control.
- The root `.gitignore` excludes all `.env` files except `.env.example`.
- Rotate secrets immediately if they are accidentally committed.
