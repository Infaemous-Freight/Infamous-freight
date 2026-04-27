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
RUN npm run prisma:generate --workspace apps/api
RUN npm run build --workspace apps/api

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

WORKDIR /app/apps/api
ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3001; const http = require('http'); const req = http.get('http://localhost:' + port + '/api/health', (r) => { let body = ''; r.on('data', (chunk) => { body += chunk; }); r.on('end', () => { try { const health = JSON.parse(body); process.exit(r.statusCode === 200 && health.status === 'ok' ? 0 : 1); } catch (e) { process.exit(1); } }); }); req.on('error', () => process.exit(1));"

CMD ["node", "dist/src/server.js"]
