FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm --dir apps/api exec prisma generate
RUN pnpm --filter ./apps/api build
RUN find apps/api/src -type f -name "*.js" | while read -r src; do \
	rel="${src#apps/api/src/}"; \
	ts="apps/api/src/${rel%.js}.ts"; \
	mts="apps/api/src/${rel%.js}.mts"; \
	if [ ! -f "$ts" ] && [ ! -f "$mts" ]; then \
		dest="apps/api/dist/$rel"; \
		mkdir -p "$(dirname "$dest")"; \
		cp "$src" "$dest"; \
	fi; \
done
RUN find apps/api/src -type f -name "*.cjs" | while read -r src; do \
	rel="${src#apps/api/src/}"; \
	dest="apps/api/dist/$rel"; \
	mkdir -p "$(dirname "$dest")"; \
	cp "$src" "$dest"; \
done

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

COPY --from=build /app ./

EXPOSE 3000

CMD ["node", "apps/api/dist/server.js"]
