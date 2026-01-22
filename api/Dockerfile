## Monorepo-friendly API image for Render/Fly/DO
FROM node:20-alpine AS base

WORKDIR /app

# Enable pnpm via corepack
RUN apk add --no-cache python3 make g++ openssl openssl-dev
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Cache deps first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY api/package.json ./api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --frozen-lockfile || pnpm install

# Build shared package
COPY packages ./packages
RUN pnpm -C packages/shared build || true

# Copy full repo (api + packages + shared assets)
COPY . .

# Generate Prisma client
RUN pnpm -C api prisma:generate || true

# Build API if script exists (CI-safe)
RUN pnpm -C api --if-present build || true

# Cleanup build dependencies
RUN apk del --no-cache python3 make g++

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "api/src/index.js"]
