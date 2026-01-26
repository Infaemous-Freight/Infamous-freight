# Vercel Project Settings

Use these settings when configuring the Vercel project for the web app.

## Project Settings

- **Framework Preset**: Next.js
- **Root Directory**:
  - If Next.js is in a subfolder (example: `web`)
  - Set **Root Directory** to: `web`

## Build & Output Settings

- **Install Command**: `pnpm install`
- **Build Command**: `pnpm build`

> Note: The Vercel project (`web/vercel.json`) currently uses `pnpm install`. For stricter, reproducible production builds (as used in CI), you may prefer to configure Vercel to run `pnpm install --frozen-lockfile` instead.
