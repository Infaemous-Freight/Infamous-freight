# Vercel Project Settings Execution Plan

This guide captures the latest Vercel project settings checklist for Infæmous Freight, aligned with the current production deployment standard.

## Phase 1 — Lock production + Git

1) **Confirm Production Branch = `main`**
   - Vercel → Project → Settings → Git
   - Production Branch: `main`
   - Confirm the connected repo is the correct one for this project.

**Result:** Production deploys are driven by `main`.

## Phase 2 — Fix domain assignments

Currently assigned domains should match the project actually serving that traffic.

**Option A (Recommended): Separate Web + API projects**
- **Web Vercel project**
  - Settings → Domains
  - Remove `infamous-freight-api.vercel.app`
- **API Vercel project**
  - Settings → Domains
  - Add `infamous-freight-api.vercel.app`

**Result:** Web and API domains are cleanly separated.

**Option B: Single Next.js project serving both web + `/api/*`**
- You may keep `infamous-freight-api.vercel.app`, but it serves the entire app.
- If API-only behavior is desired, Option A is still preferred.

## Phase 3 — Enable Build Cache

- Vercel deploy screen / project settings
- Enable **Use existing Build Cache**

**Clear cache only once** if you suspect stale artifacts:
- Redeploy → Clear Cache
- Then return to cache **ON**.

## Phase 4 — Configure Ignored Build Step (safe default)

**Monorepo ignore script** (use when the Next.js app is in a subfolder):

```bash
#!/bin/bash
set -e

# exit 0 => ignore build
# exit 1 => do NOT ignore (build)

if [ -z "$VERCEL_GIT_COMMIT_SHA" ]; then
  exit 1
fi

if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  CHANGED=$(git ls-files)
else
  CHANGED=$(git diff --name-only "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" || true)
fi

if [ -z "$CHANGED" ]; then
  exit 1
fi

if echo "$CHANGED" | grep -E '^(web/|api/|packages/|package\.json|pnpm-lock\.yaml|turbo\.json|tsconfig\.json|next\.config\.)' -q; then
  exit 1
fi

if echo "$CHANGED" | grep -E '^(docs/|mobile/|README\.md|\.github/|\.vscode/)' -q; then
  exit 0
fi

exit 1
```

**Single-app (root) ignore script** (use when Next.js is at repo root):

```bash
#!/bin/bash
set -e

if [ -z "$VERCEL_GIT_COMMIT_SHA" ]; then
  exit 1
fi

if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  CHANGED=$(git ls-files)
else
  CHANGED=$(git diff --name-only "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" || true)
fi

if [ -z "$CHANGED" ]; then
  exit 1
fi

if echo "$CHANGED" | grep -E '^(pages/|app/|src/|public/|components/|lib/|next\.config\.|package\.json|pnpm-lock\.yaml|tsconfig\.json)' -q; then
  exit 1
fi

if echo "$CHANGED" | grep -E '^(docs/|README\.md)' -q; then
  exit 0
fi

exit 1
```

## Phase 5 — Align Node.js version

- Vercel → Project → Settings → General → **Node.js Version**
- Set it explicitly to match the `engines.node` requirement in `package.json`.

## Phase 6 — Confirm Build & Output settings

**If Next.js is at repo root:**
- Root Directory: *(blank)*
- Install Command: `npm install` *(or leave blank to use Vercel's default)*
- Build Command: `npm run build`

**If Next.js is in a subfolder (example: `web`):**
- Root Directory: `web`
- Install Command: `npm install` *(or leave blank to use Vercel's default)*
- Build Command: `npm run build`

## Phase 7 — Verify environment variables

Vercel → Project → Settings → **Environment Variables**

Minimum sanity set (adjust to your stack):
- `NEXT_PUBLIC_API_URL` (public API base URL)
- `DATABASE_URL` (if Prisma/DB runs in this project)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` (if using Stripe)
- `TWILIO_*` (if using Twilio)

**Rule:** Secrets must **not** use the `NEXT_PUBLIC_` prefix.

## Phase 8 — Final verification steps

1) Make a tiny app change that should trigger a build.
2) Merge to `main` → confirm production deploy runs.
3) Make a docs-only change → confirm production build is skipped (if ignore step enabled).
4) Confirm domain resolves to the expected project (web vs API).

---

**Deliverable summary:**
- Production branch fixed to `main`
- Domains correctly assigned (no web/API confusion)
- Build cache enabled
- Ignore Build Step configured
- Node.js version aligned with `package.json`
- Build settings verified
- Production env vars verified
