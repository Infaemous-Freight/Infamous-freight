FROM node:18-alpine

LABEL maintainer="Santorio Djuan Miles <237955567+MrMiless44@users.noreply.github.com>"
LABEL description="Infamous Freight Enterprises - Full-stack application"

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.9

# Copy workspace and package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/
COPY packages/shared/package.json ./packages/shared/
COPY web/package.json ./web/

# Install ALL dependencies (including dev dependencies needed for build)
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build the application (builds shared first, then api)
RUN pnpm --filter @infamous-freight/shared build && pnpm --filter api build

# Expose ports
EXPOSE 3000 3001 8080

# Default command
CMD ["pnpm", "dev"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
