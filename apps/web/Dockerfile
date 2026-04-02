# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./

RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

COPY . .

# Build Next.js application
RUN pnpm build

# Production stage
FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init wget

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=256"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

ENTRYPOINT ["dumb-init", "--"]

CMD ["npm", "start"]
