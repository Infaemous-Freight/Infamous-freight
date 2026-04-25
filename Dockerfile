# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.21.1
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"
WORKDIR /app

FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

# Copy workspace manifests first so npm can resolve workspaces deterministically.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci --include=dev --workspaces --include-workspace-root

COPY . .

# Ensure Prisma client is generated before TypeScript build.
RUN npm --prefix apps/api run prisma:generate

# Build only the API for this runtime image.
RUN npm run build:api

# Keep only production dependencies for runtime.
RUN npm prune --omit=dev --workspaces --include-workspace-root

FROM base AS final

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodeapp

COPY --from=build --chown=nodeapp:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodeapp:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=nodeapp:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=nodeapp:nodejs /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

USER nodeapp

CMD ["node", "apps/api/dist/src/server.js"]
