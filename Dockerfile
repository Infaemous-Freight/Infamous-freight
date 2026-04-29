FROM node:22-alpine AS deps

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --prod --filter @infamous-freight/api...


FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @infamous-freight/api...

COPY apps/api ./apps/api

WORKDIR /app/apps/api

# Use Prisma 6 to match @prisma/client and the current schema.prisma format.
# Prisma 7 rejects datasource.url in schema.prisma during generate.
RUN pnpm run prisma:generate

RUN pnpm exec tsc -p tsconfig.json


FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001

USER nodejs

WORKDIR /app/apps/api

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; const http = require('http'); const req = http.get('http://127.0.0.1:' + port + '/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.setTimeout(4000, () => { req.destroy(); process.exit(1); });"

CMD ["node", "dist/src/server.js"]
