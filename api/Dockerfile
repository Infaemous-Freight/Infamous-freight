# syntax=docker/dockerfile:1.6

FROM node:20-slim AS base
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY api/package.json ./api/package.json
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/api ./api
COPY . .
RUN pnpm --filter @infamous-freight/shared build
RUN pnpm --filter infamous-freight-api build
RUN pnpm --filter infamous-freight-api prisma:generate

FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN useradd -m nodeuser
USER nodeuser

COPY --from=build /app/api ./api
COPY --from=build /app/packages ./packages
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "api/src/server.js"]
