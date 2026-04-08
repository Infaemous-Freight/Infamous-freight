---
name: DevOps & Docker Deployment
description:
  Containerize, orchestrate, and deploy services using Docker Compose,
  Kubernetes, and cloud platforms
applyTo:
  - docker-compose*.yml
  - Dockerfile*
keywords:
  - docker
  - docker-compose
  - kubernetes
  - deployment
  - containerization
  - orchestration
  - vercel
  - fly.io
---

# DevOps & Docker Deployment Skill

## 📋 Quick Rules

1. **Local Dev**: `docker-compose.yml` (Port mapping: API 3001, Web 3000)
2. **Environment**: Override via `.env` (e.g., `API_PORT=4000`)
3. **Production**: Use optimized images, multi-stage builds
4. **Platform**: Vercel (Web), Fly.io (API), Firebase (backup)
5. **CI/CD**: GitHub Actions workflows in `.github/workflows/`

## 🐳 Docker Compose Configurations

### Development (`docker-compose.yml`)

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_DB: ${DB_NAME:-infamous_freight}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    environment:
      NODE_ENV: development
      PORT: ${API_PORT:-3001}
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGINS: ${CORS_ORIGINS:-http://localhost:3000}
    ports:
      - "${API_PORT:-3001}:${API_PORT:-3001}"
    depends_on:
      - postgres
    volumes:
      - ./apps/api/src:/app/apps/api/src

  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    environment:
      NODE_ENV: development
      NEXT_PUBLIC_API_URL: http://localhost:${API_PORT:-3001}
    ports:
      - "${WEB_PORT:-3000}:${WEB_PORT:-3000}"
    depends_on:
      - api
    volumes:
      - ./apps/web/pages:/app/apps/web/pages

volumes:
  postgres_data:
```

### Production (`docker-compose.prod.yml`)

```yaml
version: "3.9"

services:
  api:
    image: infamous-freight/api:latest
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      SENTRY_DSN: ${SENTRY_DSN}
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
```

## 🏗️ Multi-Stage Dockerfile

### API (`Dockerfile.api`)

```dockerfile
# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY . .
# Build shared package first
RUN pnpm --filter @infamous-freight/shared build
RUN pnpm --filter api build

# Runtime stage
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --prod --frozen-lockfile

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/packages/shared/dist ./node_modules/@infamous-freight/shared/dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

### Web (`Dockerfile.web`)

```dockerfile
# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @infamous-freight/shared build
RUN pnpm --filter web build

# Runtime stage
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --prod --frozen-lockfile

COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/packages/shared/dist ./node_modules/@infamous-freight/shared/dist

EXPOSE 3000

CMD ["pnpm", "--filter", "web", "start"]
```

## 🚀 Common Commands

### Local Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api
docker-compose logs -f web

# Stop all services
docker-compose down

# Rebuild images
docker-compose build --no-cache
```

### Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Push to registry
docker tag infamous-freight/api:latest myregistry.azurecr.io/api:latest
docker push myregistry.azurecr.io/api:latest

# Deploy (depends on platform)
kubectl apply -f k8s/deployment.yaml  # Kubernetes
fly deploy                             # Fly.io
vercel deploy                          # Vercel
```

## 🌐 Platform Deployments

### Vercel (Web)

```bash
# Connect repository
vercel link

# Deploy preview on PR
vercel

# Deploy production on main
# Automatic via GitHub integration
```

**`vercel.json`**:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "apps/web/.next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url"
  }
}
```

### Fly.io (API)

```bash
# Install CLI
curl -L https://fly.io/install.sh | sh

# Create app
fly apps create infamous-freight-api

# Deploy
fly deploy -c fly.api.toml

# View logs
fly logs -a infamous-freight-api
```

**`fly.api.toml`**:

```toml
[app]
kill_signal = "SIGINT"
kill_timeout = 5

[[services]]
internal_port = 3001
protocol = "tcp"

[[services.ports]]
port = 80

[[services.ports]]
port = 443

[env]
DATABASE_URL = "postgresql://..."
JWT_SECRET = "..."
```

### Firebase Hosting (Optional)

```bash
firebase deploy --only hosting
```

## 📊 Health Checks & Monitoring

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /api/health
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Docker Healthcheck

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1
```

## 🔧 Environment Management

### `.env` Template

```bash
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/db
DB_USER=postgres
DB_PASSWORD=secure_password
DB_NAME=infamous_freight
DB_PORT=5432

# API
API_PORT=3001
NODE_ENV=development

# Web
WEB_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Security
JWT_SECRET=your-secret-key-here
CORS_ORIGINS=http://localhost:3000

# External Services
SENTRY_DSN=https://...
OPENAI_API_KEY=sk-...
```

## 🧪 Testing Containers

```bash
# Run tests in container
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Test single service
docker run --rm infamous-freight/api npm test
```

## 📈 Performance Tips

1. **Multi-stage builds** - Reduce image size
2. **Alpine base images** - Lightweight (15MB vs 900MB)
3. **Layer caching** - Order dependencies by change frequency
4. **Healthchecks** - Enable automatic restarts
5. **Resource limits** - Prevent runaway containers

```yaml
services:
  api:
    resources:
      limits:
        cpus: "1"
        memory: 512M
      reservations:
        cpus: "0.5"
        memory: 256M
```

## 🔗 Resources

- [Docker Docs](https://docs.docker.com)
- [Docker Compose Spec](https://github.com/compose-spec/compose-spec)
- [Kubernetes Docs](https://kubernetes.io/docs)
- [Fly.io Docs](https://fly.io/docs)
