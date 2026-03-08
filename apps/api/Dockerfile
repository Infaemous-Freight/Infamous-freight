FROM node:20-alpine AS base
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --filter @infamous/api... --no-frozen-lockfile

COPY . .

RUN pnpm --filter @infamous/api build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN corepack enable

COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/apps/api/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/server.js"]
