# Fly.io optimized build - simplified for remote builder compatibility
FROM node:24-alpine AS base

LABEL maintainer="Santorio Djuan Miles <237955567+MrMiless44@users.noreply.github.com>"
LABEL description="Infamous Freight Enterprises - Full-stack application"

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9.15.0

# Stage 1: Install dependencies
FROM base AS deps

# Copy workspace config first (for layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace packages (apps and packages)
COPY apps ./apps
COPY packages ./packages

# Install dependencies without cache mount (for Depot compatibility)
RUN pnpm install --no-frozen-lockfile

# Stage 2: Build application
FROM base AS build

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps

# Copy workspace config and TypeScript base config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Build shared package, then web app
RUN pnpm --filter @infamous-freight/shared build && \
    pnpm --filter web build

# Stage 3: Production runtime
FROM node:24-alpine AS runner

WORKDIR /app

# Install runtime utilities
RUN apk add --no-cache wget dumb-init

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy Next.js standalone output and static assets
COPY --from=build --chown=nodejs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nodejs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nodejs:nodejs /app/apps/web/public ./apps/web/public

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "apps/web/server.js"]
