ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm --filter @infamous/api exec prisma generate
RUN pnpm --filter @infamous/api build

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV API_PORT=3000

COPY --from=build /app ./

EXPOSE 3000

CMD ["node", "apps/api/dist/server.js"]
