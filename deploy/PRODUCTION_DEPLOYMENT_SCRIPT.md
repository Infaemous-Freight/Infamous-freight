# Production Deployment Script (Vercel + Railway/Supabase)

This repository includes an automated deployment workflow script at:

```bash
deploy/production-vercel-railway.sh
```

It is tailored for Infæmous Freight's current monorepo shape (`apps/web`,
`apps/api`) but also supports a single-app Next.js layout.

## What the script does

1. Verifies required tooling (`git`, `node`, `pnpm`, `vercel`).
2. Detects deploy mode automatically:
   - `single`: root Next.js app
   - `monorepo`: `apps/web` exists
3. Runs preflight checks:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm build`
4. Runs production migrations (auto-detected):
   - Supabase (`supabase db push`) when `supabase/config.toml` exists
   - Prisma (`pnpm prisma migrate deploy`)
   - Drizzle (`pnpm run db:push`)
5. Deploys frontend to Vercel:
   - single repo: `vercel --prod --yes`
   - monorepo: `vercel --cwd apps/web --prod --yes`
6. Prints post-deploy hardening checks.

## Required environment variables

Export at minimum:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB"
```

Recommended production secrets (in Vercel dashboard, not git):

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `OPENAI_API_KEY`
- `JWT_SECRET` (or Clerk keys)

## Usage

### Default (auto detect mode)

```bash
./deploy/production-vercel-railway.sh
```

### Monorepo explicit mode

```bash
DEPLOY_MODE=monorepo WEB_DIR=apps/web API_DIR=apps/api ./deploy/production-vercel-railway.sh
```

### Skip lint/typecheck/build (for hotfix only)

```bash
SKIP_CHECKS=1 ./deploy/production-vercel-railway.sh
```

### Skip migrations

```bash
RUN_MIGRATIONS=0 ./deploy/production-vercel-railway.sh
```

## Notes

- Keep `.env.production` out of git (already covered by the repository
  `.gitignore`).
- Always set production variables in Vercel project settings for `Production`
  scope.
- For Railway-managed Postgres, paste the Railway connection string into
  `DATABASE_URL`.
