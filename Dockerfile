# syntax=docker/dockerfile:1

##########
# deps
##########
FROM node:18-alpine AS deps
WORKDIR /app

# Ensure pnpm is available and pinned (offline-safe during later stages)
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Copy only manifests first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/
COPY web/package.json ./web/
COPY packages/shared/package.json ./packages/shared/

# Deterministic install
RUN pnpm install --frozen-lockfile

##########
# build
##########
FROM node:18-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Copy the entire deps workspace to preserve pnpm symlink structure
COPY --from=deps /app ./

# Overlay source after deps (so changes invalidate only after deps cache)
COPY . .

# Build in dependency order (shared -> api -> web)
RUN pnpm --filter @infamous-freight/shared build \
 && pnpm --filter api build \
 && pnpm --filter web build

##########
# run
##########
FROM node:18-alpine AS run
WORKDIR /app
ENV NODE_ENV=production

# Make pnpm available without network on container start
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Copy only what you need to run (manifests + built outputs)
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/api ./api
COPY --from=build /app/web ./web
COPY --from=build /app/packages/shared ./packages/shared

# Install production deps only
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000

# Health check for web frontend
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["pnpm", "--filter", "web", "start"]
