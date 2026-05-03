# Infamous Freight Project Notes

## Project summary

Infamous Freight is a freight dispatch platform. The repository is a pnpm workspace monorepo with application packages under `apps/*`.

## Repository structure

- `apps/web` - Vite and React frontend.
- `apps/api` - Node.js and Express API backend.
- `apps/web/dist` - Netlify static publish output after a successful frontend build.
- `netlify.toml` - Netlify build, publish, redirect, header, and plugin configuration.

## Tooling and runtime

- Package manager: `pnpm@10.0.0`.
- Node engine: `>=22.0.0 <23.0.0`.
- Root build command: `pnpm run build`.
- Netlify build command: `npm run build`.
- Netlify publish directory: `apps/web/dist`.

## Frontend notes

The frontend lives in `apps/web` and uses Vite, React, TypeScript, Supabase client tooling, Stripe client tooling, Sentry, React Router, Axios, Socket.io client, and UI/application dependencies.

Useful commands:

```bash
pnpm -C apps/web run build
pnpm -C apps/web run preview
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
```

## Backend notes

The backend lives in `apps/api` and uses Node.js, Express, Prisma, Sentry, CORS, Helmet, OpenAI integration tooling, Jest, and TypeScript.

Useful commands:

```bash
pnpm -C apps/api run build
pnpm -C apps/api run start:dev
pnpm -C apps/api run start:prod
pnpm -C apps/api run test
pnpm -C apps/api run lint
pnpm -C apps/api run prisma:generate
```

## Netlify deployment notes

Netlify is configured to:

- Run `npm run build`.
- Publish `apps/web/dist`.
- Use Node `22`.
- Skip the Netlify Next.js plugin because this is a Vite app.
- Disable Sentry upload during build when auth is missing or stale.
- Proxy `/api/*` to the hosted backend.
- Proxy `/socket.io/*` to the hosted backend.
- Route SPA fallback requests to `/index.html`.

## Environment setup notes

The build session used safe placeholder values for build validation. Replace placeholders with real production values in the proper hosting dashboards before launch.

Guidance:

- Keep private values out of logs and documentation.
- Use frontend prefixes only for values that are safe to expose in browser code.
- Do not expose database credentials, private payment keys, service role keys, or server-side API keys to the frontend.
- Apply values to the correct deploy contexts: production, deploy previews, and branch deploys.

## Build verification

Reported successful build flow:

```bash
pnpm install
npm run build
```

Reported build results:

- Prisma client generated.
- API TypeScript compiled.
- Vite frontend built successfully.
- Static output generated in `apps/web/dist`.

To verify build output after building locally or in CI:

```bash
test -d apps/web/dist
test -f apps/web/dist/index.html
ls -lah apps/web/dist
find apps/web/dist -maxdepth 2 -type f | sort | head -50
```

## Local testing checklist

From the repository root:

```bash
pnpm install
pnpm run build
pnpm -C apps/web run preview -- --host 0.0.0.0
```

Then open the local preview URL shown by Vite and check:

- Home page loads.
- Client-side routing works after refresh.
- API calls route to the expected backend URL.
- Browser console has no missing configuration errors.
- Production services are not using placeholder values.

Optional backend checks:

```bash
pnpm -C apps/api run start:dev
pnpm -C apps/api run test
pnpm -C apps/api run lint
```

## Current status

- Repository cloned successfully in the build session.
- Dependencies installed successfully.
- Project inspected as a pnpm monorepo.
- Build completed successfully using placeholder values.
- Netlify output target is `apps/web/dist`.
- Before production launch, replace placeholders with real production values in the correct hosting dashboards.
