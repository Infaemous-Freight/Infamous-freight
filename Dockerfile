FROM node:25-alpine AS deps

LABEL maintainer="Santorio Djuan Miles <237955567+MrMiless44@users.noreply.github.com>"
LABEL description="Infamous Freight Enterprises - Full-stack application"

WORKDIR /app

# Install pnpm (Corepack is unavailable in node:25-alpine)
RUN npm install -g pnpm@9.15.0

# Copy workspace and package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/
COPY packages/shared/package.json ./packages/shared/
COPY web/package.json ./web/

# Install ALL dependencies (including dev dependencies needed for build)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

FROM node:25-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@9.15.0

COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules

# Build the application (shared, generate Prisma client, api, then web)
RUN pnpm --filter @infamous-freight/shared build \
  && cd api && pnpm prisma:generate \
  && pnpm --filter api build \
  && pnpm --filter web build

FROM node:25-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN npm install -g pnpm@9.15.0

# Copy only runtime essentials instead of the entire /app directory
# Root workspace metadata for pnpm
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
# Installed dependencies
COPY --from=build /app/node_modules ./node_modules
# Web application build output and configuration
COPY --from=build /app/web/.next ./web/.next
COPY --from=build /app/web/public ./web/public
COPY --from=build /app/web/package.json ./web/package.json
COPY --from=build /app/web/next.config.mjs ./web/next.config.mjs

# Re-install only production dependencies to prune devDependencies
RUN pnpm install --prod --frozen-lockfile
# Expose port for web
EXPOSE 3000

# Production command - run the web server
CMD ["pnpm", "--filter", "web", "start"]

# Health check for web frontend
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1
