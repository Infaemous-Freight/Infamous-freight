# Vercel Project Setup — Infamous Freight (apps/web)

This guide documents the required Vercel Project Settings to deploy **only the
Next.js frontend** (`apps/web`) from this monorepo.

---

## Required Vercel Project Setting

| Setting           | Value        |
| ----------------- | ------------ |
| **Root Directory** | `apps/web`  |

Setting _Root Directory_ to `apps/web` makes Vercel use `apps/web/vercel.json`
as the authoritative configuration file.  The root-level `vercel.json` is only
evaluated when Vercel deploys from the repository root (not recommended).

---

## Active configuration (`apps/web/vercel.json`)

```json
{
  "framework": "nextjs",
  "installCommand": "corepack enable && corepack prepare pnpm@10.33.0 --activate && pnpm install --frozen-lockfile",
  "buildCommand": "pnpm --filter @infamous-freight/shared build && pnpm --filter web build",
  "outputDirectory": ".next"
}
```

* **installCommand** — enables corepack so the exact pnpm version from
  `packageManager` in `package.json` is used.
* **buildCommand** — builds the shared package first, then the web app.
* **outputDirectory** — `.next` is relative to the `apps/web` root directory.

---

## Why `apps/api` is NOT deployed to Vercel

The API is deployed separately (Fly.io / Railway).  `apps/api/vercel.json` has
been removed so it cannot affect Vercel builds of the frontend.

---

## `.vercelignore` policy

The root `.vercelignore` is intentionally narrow and only excludes generated
build artifacts:

```
.next/
apps/web/.next/
dist/
coverage/
archive/
docs/
e2e/
```

Workspace source directories (`apps/`, `packages/`, `api/`, etc.) are **not**
excluded because Vercel needs them during `pnpm install` to resolve workspace
dependencies correctly.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| ------- | ------------ | --- |
| `Cannot find module @infamous-freight/shared` | Shared package not built | The buildCommand already handles this; verify Root Directory is `apps/web` |
| `Removed N ignored files` removing source files | Over-broad `.vercelignore` | Ensure `.vercelignore` only lists build artifacts |
| `Running "exit 1"` in build log | Stale `ignoreCommand` in an app's `vercel.json` | Remove the offending `vercel.json` |
