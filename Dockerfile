FROM node:22-bookworm-slim AS deps
WORKDIR /app

ARG PNPM_VERSION=10.0.0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY --chown=1001:1001 package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=1001:1001 apps/api/package.json ./apps/api/package.json

RUN pnpm install --frozen-lockfile --prod --filter @infamous-freight/api...


FROM node:22-bookworm-slim AS build
WORKDIR /app

ARG PNPM_VERSION=10.0.0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY --chown=1001:1001 package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=1001:1001 apps/api/package.json ./apps/api/package.json

RUN pnpm install --frozen-lockfile --filter @infamous-freight/api...

COPY apps/api ./apps/api

ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

RUN pnpm -C apps/api prisma:generate

RUN pnpm -C apps/api build


FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --from=deps --chown=1001:1001 /app/node_modules ./node_modules
COPY --chown=1001:1001 package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

COPY --from=build --chown=1001:1001 /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=1001:1001 /app/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=1001:1001 /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=build --chown=1001:1001 /app/node_modules/@prisma /app/node_modules/@prisma

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid 1001 nodejs
USER nodejs

WORKDIR /app/apps/api

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; const http = require('http'); const req = http.get('http://127.0.0.1:' + port + '/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.setTimeout(8000, () => { req.destroy(); process.exit(1); });"

CMD ["node", "dist/src/server.js"]
