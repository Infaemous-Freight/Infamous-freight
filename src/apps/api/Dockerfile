# Production-optimized Dockerfile for API
# Multi-stage build with security hardening

FROM node:20-alpine AS base

# Install security updates and required tools
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
        dumb-init \
        wget \
        ca-certificates && \
    rm -rf /var/cache/apk/*

# Enable pnpm with specific version
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
ENV PNPM_HOME=/usr/local/bin

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/apps/api/package.json ./src/apps/api/package.json
COPY src/packages/shared/package.json ./src/packages/shared/package.json

# Install all dependencies with cache mount
ENV HUSKY=0
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --filter infamous-freight-api... --frozen-lockfile

# Stage 2: Build shared packages
FROM base AS shared-builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/packages/shared/node_modules ./src/packages/shared/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/packages/shared ./src/packages/shared

WORKDIR /app/src/packages/shared
RUN pnpm run build

# Stage 3: Build API application
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/apps/api/node_modules ./src/apps/api/node_modules

# Copy built shared package
COPY --from=shared-builder /app/src/packages/shared/dist ./src/packages/shared/dist
COPY --from=shared-builder /app/src/packages/shared/package.json ./src/packages/shared/package.json

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy Prisma schema for the API
COPY src/apps/api/prisma ./src/apps/api/prisma

# Copy API source and configuration
COPY src/apps/api/tsconfig.json ./src/apps/api/tsconfig.json
COPY src/apps/api/scripts ./src/apps/api/scripts
COPY src/apps/api/src ./src/apps/api/src
COPY src/apps/api/package.json ./src/apps/api/package.json

# Generate Prisma client and build
WORKDIR /app/src/apps/api
RUN pnpm run prisma:generate && pnpm run build

# Stage 4: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Install security updates and required tools
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
        dumb-init \
        wget \
        ca-certificates \
        tini && \
    rm -rf /var/cache/apk/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

ENV PNPM_HOME=/usr/local/bin
ENV NODE_ENV=production
ENV PORT=4000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/logs /app/tmp && \
    chown -R nodejs:nodejs /app

# Copy only production dependencies and built artifacts
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src/apps/api/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/src/apps/api/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/src/apps/api/package.json ./package.json

# Copy built shared package
COPY --from=shared-builder --chown=nodejs:nodejs /app/src/packages/shared/dist ./node_modules/@infamous-freight/shared/dist
COPY --from=shared-builder --chown=nodejs:nodejs /app/src/packages/shared/package.json ./node_modules/@infamous-freight/shared/package.json

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
