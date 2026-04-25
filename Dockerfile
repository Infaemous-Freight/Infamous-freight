FROM node:20-alpine AS build

WORKDIR /app/apps/api

COPY apps/api/package.json ./package.json
COPY apps/api/package-lock.json ./package-lock.json
COPY apps/api/prisma ./prisma
RUN npm ci
RUN npm run prisma:generate

COPY apps/api ./
RUN npx tsc -p tsconfig.build.json

FROM node:20-alpine AS runtime

WORKDIR /app/apps/api
ENV NODE_ENV=production

COPY --from=build /app/apps/api/package.json ./package.json
RUN npm install --omit=dev
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; const http = require('http'); const req = http.get('http://localhost:' + port + '/api/health', (r) => { let body = ''; r.on('data', (chunk) => { body += chunk; }); r.on('end', () => { try { const health = JSON.parse(body); process.exit(r.statusCode === 200 && health.status === 'ok' ? 0 : 1); } catch (e) { process.exit(1); } }); }); req.on('error', () => process.exit(1));"

CMD ["node", "dist/src/server.js"]
