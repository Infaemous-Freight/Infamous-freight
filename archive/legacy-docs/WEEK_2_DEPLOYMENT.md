# WEEK 2D: PRODUCTION DEPLOYMENT 100%

**Phase**: Docker, CI/CD, and Production Deployment  
**Time**: 3-5 hours  
**Status**: READY TO IMPLEMENT  
**Target**: Deploy to production with automated pipelines

---

## 🎯 OBJECTIVE

Containerize application, set up CI/CD pipelines, and deploy to production
platforms.

---

## ✅ STEP 1: CREATE DOCKERFILES

### File: `apps/api/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build (if needed)
RUN npm run build || true

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Set environment
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/production-server.js"]
```

### File: `apps/web/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

---

## ✅ STEP 2: CREATE DOCKER-COMPOSE FOR PRODUCTION

### File: `docker-compose.prod.yml`

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: infamous-postgres-prod
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: infamous_freight
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - infamous-network

  redis:
    image: redis:7-alpine
    container_name: infamous-redis-prod
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - infamous-network

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    container_name: infamous-api-prod
    environment:
      NODE_ENV: production
      LOG_LEVEL: info
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/infamous_freight
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      AUTH_SECRET: ${AUTH_SECRET}
      CORS_ORIGINS: ${CORS_ORIGINS}
      API_PORT: 4000
    ports:
      - "4000:4000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - infamous-network
    volumes:
      - api-logs:/app/logs

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    container_name: infamous-web-prod
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${API_URL}
      API_BASE_URL: http://api:4000
      WEB_PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - infamous-network

  nginx:
    image: nginx:alpine
    container_name: infamous-nginx-prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - web
    restart: unless-stopped
    networks:
      - infamous-network

volumes:
  postgres-data:
  redis-data:
  api-logs:

networks:
  infamous-network:
    driver: bridge
```

---

## ✅ STEP 3: CREATE NGINX CONFIGURATION

### File: `nginx.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/atom+xml image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=web_limit:10m rate=500r/m;

    # Upstream backends
    upstream api_backend {
        least_conn;
        server api:4000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream web_backend {
        least_conn;
        server web:3000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name _;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # API routes
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check
        location /api/health {
            limit_req zone=api_limit burst=50 nodelay;

            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;

            access_log off;
        }

        # Web routes
        location / {
            limit_req zone=web_limit burst=50 nodelay;

            proxy_pass http://web_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_cache_bypass $http_upgrade;
        }

        # Static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://web_backend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

---

## ✅ STEP 4: CREATE .ENV.PRODUCTION

### File: `.env.production`

```env
# Database
DATABASE_URL=postgresql://postgres:CHANGE_ME@postgres:5432/infamous_freight
DB_PASSWORD=CHANGE_ME

# Redis
REDIS_URL=redis://:CHANGE_ME@redis:6379
REDIS_PASSWORD=CHANGE_ME

# API
NODE_ENV=production
LOG_LEVEL=info
API_PORT=4000
AUTH_SECRET=CHANGE_ME_TO_STRONG_SECRET

# CORS
CORS_ORIGINS=https://example.com,https://api.example.com

# Web
NEXT_PUBLIC_API_URL=https://api.example.com
API_BASE_URL=http://api:4000
WEB_PORT=3000

# Monitoring
SENTRY_DSN=https://key@sentry.io/project
DD_TRACE_ENABLED=true

# Email (for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=CHANGE_ME
```

---

## ✅ STEP 5: CREATE CI/CD PIPELINES

### File: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8.15.9

      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "pnpm"

      - run: pnpm install

      - run: pnpm --filter api test

      - run: pnpm --filter web test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/lcov.info
          flags: api
```

### File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push API
        uses: docker/build-push-action@v4
        with:
          context: ./apps/api
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/infamous-api:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push Web
        uses: docker/build-push-action@v4
        with:
          context: ./apps/web
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/infamous-web:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H $DEPLOY_HOST >> ~/.ssh/known_hosts

          ssh -i ~/.ssh/deploy_key $DEPLOY_USER@$DEPLOY_HOST << 'EOF'
            cd /app
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker-compose -f docker-compose.prod.yml exec -T api pnpm prisma migrate deploy
          EOF

      - name: Verify deployment
        run: |
          sleep 10
          curl -f https://api.example.com/api/health || exit 1
```

---

## ✅ STEP 6: DEPLOYMENT PLATFORMS

### Option 1: Fly.io (Recommended)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Create apps
flyctl launch --name infamous-api --builder=docker --region=sjc --now
flyctl launch --name infamous-web --builder=docker --region=sjc --now

# Deploy
flyctl deploy --app infamous-api -c fly.api.toml
flyctl deploy --app infamous-web -c fly.web.toml

# Monitor logs
flyctl logs -a infamous-api
```

### Option 2: Railway.app

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway link
railway up
```

### Option 3: Render.com

```bash
# Create service on web dashboard
# Connect GitHub repository
# Set environment variables
# Deploy automatically
```

### Option 4: AWS ECS

```bash
# Create ECR repositories
aws ecr create-repository --repository-name infamous-api
aws ecr create-repository --repository-name infamous-web

# Push images
docker push $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/infamous-api:latest
docker push $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/infamous-web:latest

# Create ECS cluster and services
aws ecs create-cluster --cluster-name infamous-prod
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

---

## ✅ STEP 7: SSL/TLS CERTIFICATES

### Using Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d example.com -d api.example.com

# Renew automatically
sudo certbot renew --dry-run

# Copy to docker volume
sudo cp /etc/letsencrypt/live/example.com/cert.pem ./ssl/
sudo cp /etc/letsencrypt/live/example.com/privkey.pem ./ssl/key.pem
```

---

## ✅ STEP 8: MONITORING & ALERTING

### File: `docker-compose.monitoring.yml`

```yaml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3001:3000"

  alertmanager:
    image: prom/alertmanager
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    ports:
      - "9093:9093"

volumes:
  prometheus-data:
  grafana-data:
```

---

## ✅ STEP 9: DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All tests passing (unit + E2E)
- [ ] Load testing successful
- [ ] Docker images built and tested
- [ ] SSL/TLS certificates ready
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] Monitoring & alerting set up
- [ ] Logging aggregation configured
- [ ] Rollback plan documented
- [ ] Team trained on deployment

---

## ✅ STEP 10: POST-DEPLOYMENT VERIFICATION

```bash
# Check services are running
curl https://api.example.com/api/health
curl https://example.com

# Verify database
docker-compose exec postgres psql -U postgres -d infamous_freight -c "SELECT COUNT(*) FROM shipments;"

# Check logs
docker-compose logs -f api
docker-compose logs -f web

# Monitor performance
# Open https://grafana.example.com (username: admin, password: admin)
# Create dashboards for:
# - API response time
# - Error rate
# - Database queries
# - Cache hit rate
```

---

## 📊 DEPLOYMENT VERIFICATION

**Expected Status After Deployment**:

```
✅ API: https://api.example.com/api/health
✅ Web: https://example.com
✅ Database: Connected and synced
✅ Redis: Running and accessible
✅ SSL: Valid certificate
✅ Monitoring: Grafana dashboard active
✅ Logs: Aggregated and searchable
✅ Backups: Automated daily
```

---

## 🎉 WEEK 2 COMPLETE

After completing all 4 phases:

1. ✅ Database integration (PostgreSQL)
2. ✅ E2E testing (Playwright)
3. ✅ Load testing (k6)
4. ✅ Production deployment (Docker + CI/CD)

**System Status**:

- Production-ready platform
- Automated testing & deployment
- Full monitoring & alerting
- Scalable architecture (1000+ users)
- 99.9% uptime target

---

**Next Steps**:

- Week 3: Advanced features (analytics, notifications)
- Week 4: Mobile app integration
- Week 5: Advanced scaling

---

**Status**: Ready to Execute  
**Time Estimate**: 3-5 hours  
**Generated**: January 14, 2026
