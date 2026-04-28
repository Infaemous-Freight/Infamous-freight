FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm ci --omit=dev --workspace apps/api --include-workspace-root=false


FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm ci --workspace apps/api

COPY apps/api ./apps/api

WORKDIR /app/apps/api

# Use Prisma 6 to match @prisma/client and the current schema.prisma format.
# Prisma 7 rejects datasource.url in schema.prisma during generate.
RUN npx prisma@6.7.0 generate

RUN npm run build


FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001

USER nodejs

WORKDIR /app/apps/api

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; const http = require('http'); const req = http.get('http://127.0.0.1:' + port + '/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.setTimeout(4000, () => { req.destroy(); process.exit(1); });"

CMD ["node", "dist/src/server.js"]
