.DEFAULT_GOAL := help

.PHONY: help install build typecheck lint test validate dev dev-api dev-web dev-mobile dev-all clean infra-up infra-down infra-logs smoke

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	corepack enable
	corepack prepare pnpm@9.15.0 --activate
	pnpm install

build: ## Build all packages and apps
	pnpm run build

typecheck: ## Run TypeScript type checking
	pnpm run typecheck

lint: ## Run linters across all workspaces
	pnpm run lint

test: ## Run tests across all workspaces
	pnpm run test

validate: ## Run full validation (build + typecheck + lint + test)
	pnpm run validate

dev: ## Start the API in development mode
	pnpm run dev

dev-api: ## Start the API only
	pnpm run dev:api

dev-web: ## Start the web app only
	pnpm run dev:web

dev-mobile: ## Start the mobile app only
	pnpm run dev:mobile

dev-all: ## Start all services concurrently
	bash scripts/dev-all.sh

setup: ## Bootstrap local development environment
	bash scripts/setup.sh

clean: ## Remove build artifacts and dependency caches
	find . -name "dist" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
	find . -name ".next" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
	find . -name "coverage" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.tsbuildinfo" -not -path "*/node_modules/*" -delete 2>/dev/null || true
	@echo "Build artifacts removed."

infra-up: ## Start local infrastructure and API via docker compose
	docker-compose up -d

infra-down: ## Stop local infrastructure and API
	docker-compose down

infra-logs: ## Tail docker compose logs
	docker-compose logs -f

smoke: ## Run local HTTP smoke test
	bash scripts/smoke.sh
