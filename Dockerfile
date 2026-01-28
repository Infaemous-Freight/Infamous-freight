ARG NODE_VERSION=20.20.0-alpine
ARG PNPM_VERSION=9.15.4
FROM node:${NODE_VERSION} AS deps

LABEL maintainer="Santorio Djuan Miles <237955567+MrMiless44@users.noreply.github.com>"
LABEL description="Infamous Freight Enterprises - Full-stack application"

WORKDIR /app

# Install pnpm (Corepack is unavailable in node:alpine)
RUN npm install -g pnpm@${PNPM_VERSION}

# Copy workspace and package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/*/package.json ./apps/
COPY packages/*/package.json ./packages/

# Install ALL dependencies (including dev dependencies needed for build)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS build
WORKDIR /app
RUN npm install -g pnpm@${PNPM_VERSION}

COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Build the application (shared, generate Prisma client, api, then web)
RUN pnpm --filter @infamous-freight/shared build \
  && pnpm --filter api exec prisma generate --schema=./apps/api/prisma/schema.prisma \
  && pnpm --filter api build \
  && pnpm --filter web build

FROM node:${NODE_VERSION} AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy Next.js standalone output and static assets
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/next.config.mjs ./apps/web/next.config.mjs
# Expose port for web
EXPOSE 3000

# Production command - run the web server
CMD ["node", "apps/web/server.js"]

# Health check for web frontend
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1
