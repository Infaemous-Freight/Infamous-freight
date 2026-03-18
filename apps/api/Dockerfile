FROM node:22-alpine AS base
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --filter @infamous/api... --no-frozen-lockfile

COPY . .

RUN pnpm --filter @infamous/api build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable

COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/apps/api/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 4000

# Health check to verify API is responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/server.js"]
