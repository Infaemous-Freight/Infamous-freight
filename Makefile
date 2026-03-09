install:
	pnpm install

build:
	pnpm build

dev:
	pnpm dev

dev-web:
	pnpm dev:web

dev-mobile:
	pnpm dev:mobile

dev-all:
	scripts/dev-all.sh

lint:
	pnpm lint

test:
	pnpm test

typecheck:
	pnpm typecheck

validate:
	pnpm validate

smoke:
	scripts/smoke.sh

infra-up:
	docker compose up -d postgres redis

infra-down:
	docker compose down

infra-logs:
	docker compose logs -f
