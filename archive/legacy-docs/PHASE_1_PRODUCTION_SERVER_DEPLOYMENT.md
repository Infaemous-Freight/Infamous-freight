# Phase 1: Production Server Deployment Guide

**Project**: Infamous Freight Enterprises v2.0.0  
**Phase**: 1 of 4  
**Status**: READY FOR EXECUTION  
**Date**: December 30, 2025  
**Target Completion**: January 1, 2026 (1 day)

---

## 📋 Executive Summary

This guide provides step-by-step instructions to deploy v1.0.0 to production, achieving:

- ✅ 99.9% uptime SLA
- ✅ <0.5% error rate
- ✅ p95 response time <2s
- ✅ All 7 core services running

**Timeline**: 45 minutes active deployment + 24 hours monitoring

---

## 🎯 Phase 1 Success Criteria

All of the following must be met:

- [ ] All 7 services running and healthy
- [ ] API health endpoint: `GET /api/health` returns 200
- [ ] Web application loads without errors
- [ ] Database migrations completed successfully
- [ ] Error rate < 0.5% in first hour
- [ ] Response time p95 < 2 seconds
- [ ] Monitoring dashboards showing real-time metrics
- [ ] Uptime >= 99.9% after 24-hour monitoring period

---

## 📊 7 Core Services

| Service       | Port | Purpose                         | Status   |
| ------------- | ---- | ------------------------------- | -------- |
| API (Node.js) | 4000 | Express backend, business logic | ✅ Ready |
| Web (Next.js) | 3000 | React frontend, UI              | ✅ Ready |
| PostgreSQL    | 5432 | Primary database                | ✅ Ready |
| Redis         | 6379 | Caching, sessions               | ✅ Ready |
| Prometheus    | 9090 | Metrics collection              | ✅ Ready |
| Grafana       | 3002 | Dashboards, visualization       | ✅ Ready |
| Jaeger        | 6831 | Distributed tracing             | ✅ Ready |

---

## 🚀 STEP-BY-STEP EXECUTION

### STEP 1: Choose Production Server (15 min)

Select one of the following cloud providers:

#### Option A: AWS EC2

```bash
# Requirements:
# - Ubuntu 22.04 LTS t3.large (2 vCPU, 8GB RAM)
# - 100GB EBS volume (gp3)
# - Security group: Allow 80, 443, 3000, 4000, 9090, 3002
# - IAM role for CloudWatch

# Cost: ~$70/month
# Performance: Excellent
# Scaling: Built-in auto-scaling

# Launch:
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.large \
  --key-name your-key \
  --security-group-ids sg-xxxxxx
```

#### Option B: DigitalOcean App Platform

```bash
# Requirements:
# - Droplet: 2GB RAM, 2vCPU, 50GB SSD
# - Ubuntu 22.04 LTS
# - Pre-configured firewall

# Cost: ~$12-15/month
# Performance: Good
# Scaling: Vertical only

# Launch via web console:
# 1. Create → Droplets
# 2. Size: 2GB/2vCPU
# 3. Region: Choose closest
# 4. Auth: SSH Key
```

#### Option C: Azure Virtual Machine

```bash
# Requirements:
# - VM: B2s (2 vCPU, 4GB RAM)
# - 100GB managed disk
# - Ubuntu 22.04 LTS

# Cost: ~$30-40/month
# Performance: Good
# Scaling: Built-in VMSS

# Launch:
az vm create \
  --resource-group infamous-prod \
  --name infamous-api-1 \
  --image UbuntuLTS \
  --size Standard_B2s
```

#### Option D: Render.com (Recommended for Simplicity)

```bash
# Requirements:
# - Render Native Container Runtime
# - Auto-deploys from GitHub
# - Built-in database hosting

# Cost: ~$50-100/month
# Performance: Good
# Scaling: Automatic

# Steps:
# 1. Go to render.com/dashboard
# 2. New Service → Docker (select repo)
# 3. Configure environment variables
# 4. Deploy
```

---

### STEP 2: Server Preparation (10 min)

After server is running, SSH in and run:

```bash
#!/bin/bash
# Phase 1 Server Preparation Script

set -e

echo "🚀 Phase 1: Server Preparation"
echo "========================================"

# Step 1: Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git build-essential

# Step 2: Install Node.js v22
echo "📦 Installing Node.js v22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Step 3: Install pnpm
echo "📦 Installing pnpm..."
npm install -g pnpm@8.15.9

# Step 4: Install Docker
echo "📦 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Step 5: Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo apt-get install -y docker-compose-plugin
docker compose version

# Step 6: Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/infamous-freight
sudo chown $USER:$USER /opt/infamous-freight
cd /opt/infamous-freight

# Step 7: Verify installations
echo ""
echo "✅ Verification:"
node --version
pnpm --version
docker --version
docker compose version

echo ""
echo "✅ Server preparation complete!"
echo ""
echo "Next: Clone repository and deploy"
```

Save as `prep-server.sh` and run:

```bash
bash prep-server.sh
```

---

### STEP 3: Clone and Configure Repository (10 min)

```bash
# Clone repository
cd /opt/infamous-freight
git clone https://github.com/MrMiless44/Infamous-freight-enterprises.git
cd Infamous-freight-enterprises
git checkout main

# Verify commit
git log --oneline -1
# Should show: 7b422cd feat: complete all-phases deployment infrastructure

# Install dependencies
pnpm install
```

---

### STEP 4: Configure Environment Variables (5 min)

Create `.env.production`:

```bash
# Copy from template and update
cp .env.example .env.production

# Edit with your values
nano .env.production
```

**Required variables:**

```env
# Environment
NODE_ENV=production
LOG_LEVEL=info

# API Configuration
API_PORT=4000
API_BASE_URL=https://api.yourdomain.com

# Web Configuration
WEB_PORT=3000
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com

# Database (Create PostgreSQL instance)
DATABASE_URL=postgresql://postgres:PASSWORD@db-instance.c6ufgf.us-east-1.rds.amazonaws.com:5432/infamous_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<STRONG-RANDOM-PASSWORD-MIN-32-CHARS>

# Redis (Create Redis instance)
REDIS_URL=redis://<REDIS-PASSWORD>@redis.yourdomain.com:6379

# JWT Secret (Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=<GENERATE-NEW-SECRET-MIN-32-CHARS>

# AI Provider (default: synthetic, or use openai/anthropic)
AI_PROVIDER=synthetic
# Optional: OPENAI_API_KEY=sk-...

# Stripe Integration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3002
GRAFANA_PASSWORD=<STRONG-RANDOM-PASSWORD>

# Sentry Error Tracking (Optional)
SENTRY_DSN=https://...@sentry.io/...

# Email (Optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG...
```

---

### STEP 5: Database Setup (5 min)

```bash
# Navigate to API directory
cd api

# Generate Prisma Client
pnpm prisma:generate

# Create database and run migrations
pnpm prisma:migrate:deploy

# Verify database
pnpm prisma db execute --stdin < <(echo "SELECT version();")
```

---

### STEP 6: Build Docker Images (10 min)

```bash
cd /opt/infamous-freight

# Build services
docker compose -f docker-compose.production.yml build

# Output should show:
# ✅ Building api
# ✅ Building web
# ✅ Building postgres (or skip if using managed DB)
# ✅ Building redis (or skip if using managed Redis)
# ✅ Building prometheus
# ✅ Building grafana
# ✅ Building jaeger

# Verify images
docker image ls | grep infamous
```

---

### STEP 7: Start Services (5 min)

```bash
# Start all services
docker compose -f docker-compose.production.yml up -d

# Check status
docker compose -f docker-compose.production.yml ps

# Should show:
# infamous-api         ✅ running (0.0.0.0:4000->4000/tcp)
# infamous-web         ✅ running (0.0.0.0:3000->3000/tcp)
# infamous-postgres    ✅ running (0.0.0.0:5432->5432/tcp)
# infamous-redis       ✅ running (0.0.0.0:6379->6379/tcp)
# infamous-prometheus  ✅ running (0.0.0.0:9090->9090/tcp)
# infamous-grafana     ✅ running (0.0.0.0:3002->3002/tcp)
# infamous-jaeger      ✅ running (0.0.0.0:6831->6831/udp)
```

---

### STEP 8: Validate Services (15 min)

#### 8.1 API Health Check

```bash
# Wait 30 seconds for API to start
sleep 30

# Check API health
curl -X GET http://localhost:4000/api/health

# Expected response:
#{
#  "status": "ok",
#  "service": "infamous-freight-api",
#  "version": "2.0.0",
#  "timestamp": "2026-01-01T00:00:00Z",
#  "uptime": 35.234,
#  "environment": "production"
#}
```

#### 8.2 Web Application Check

```bash
# Check web application
curl -X GET http://localhost:3000

# Expected: HTML response with 200 status code
```

#### 8.3 Database Connection

```bash
# Test database connection
curl -X GET http://localhost:4000/api/health/detailed

# Expected: Database shows "healthy"
```

#### 8.4 Prometheus Metrics

```bash
# Check Prometheus is scraping
curl -X GET http://localhost:9090/api/v1/targets

# Expected: All targets should be "healthy"
```

#### 8.5 Grafana Dashboard

```bash
# Access Grafana
echo "Open browser: http://YOUR_SERVER_IP:3002"
# Login: admin / GRAFANA_PASSWORD

# Import Dashboard:
# 1. Go to Dashboards
# 2. New → Import
# 3. ID: 1860 (Node Exporter Full)
# 4. Select Prometheus datasource
# 5. Import
```

---

### STEP 9: Configure SSL/TLS (10 min)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate (auto-renew)
sudo certbot certonly --standalone \
  -d api.yourdomain.com \
  -d yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos \
  --non-interactive

# Verify certificate
sudo ls -la /etc/letsencrypt/live/api.yourdomain.com/

# Configure Nginx (optional - if using Nginx reverse proxy)
# Update docker-compose to use certificates
```

---

### STEP 10: 24-Hour Monitoring (Ongoing)

```bash
# Follow logs
docker compose -f docker-compose.production.yml logs -f api web

# Monitor key metrics in separate terminal
watch -n 5 'docker compose -f docker-compose.production.yml ps && echo "---" && curl -s http://localhost:4000/api/health | jq'

# Success criteria checklist:
echo "📊 Success Criteria Monitoring:"
echo "✓ Error rate < 0.5% (Grafana: Requests > 5xx errors)"
echo "✓ Response p95 < 2s (Grafana: Request Duration)"
echo "✓ Uptime >= 99.9% (Grafana: Uptime Panel)"
echo "✓ No unhandled exceptions (Grafana: Errors panel)"
echo "✓ All services healthy (docker ps)"
echo "✓ Database connections stable (Grafana: DB Connections)"
echo "✓ Cache hit rate > 70% (Grafana: Cache Stats)"
echo ""
echo "Continue monitoring for 24 hours before proceeding to Phase 2"
```

---

## 📋 Phase 1 Completion Checklist

After deployment, verify all items:

- [ ] Server preparation completed
- [ ] Repository cloned (commit 7b422cd)
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] Docker images built successfully
- [ ] All 7 services running
- [ ] API health endpoint returns 200
- [ ] Web application loads
- [ ] Database shows healthy
- [ ] Prometheus targets healthy
- [ ] Grafana dashboards display metrics
- [ ] SSL/TLS certificates installed
- [ ] 24-hour monitoring started
- [ ] Error rate < 0.5%
- [ ] Response p95 < 2s
- [ ] Uptime >= 99.9%

---

## 🚨 Troubleshooting Phase 1

### Issue: Docker daemon not running

```bash
sudo systemctl start docker
sudo systemctl status docker
```

### Issue: Port already in use

```bash
# Find and kill process using port 4000
sudo lsof -i :4000
sudo kill -9 <PID>
```

### Issue: Database migration fails

```bash
# Check migration status
cd api && pnpm prisma migrate status

# If stuck, reset (dev only!)
# pnpm prisma migrate reset --force
```

### Issue: API won't start

```bash
# Check logs
docker logs -f infamous-api

# Common issues:
# - DATABASE_URL not set
# - JWT_SECRET not set
# - Port 4000 already in use
# - Node.js version mismatch
```

### Issue: Grafana won't connect

```bash
# Check Prometheus datasource
curl -X GET http://localhost:9090/api/v1/query?query=up

# Verify Prometheus config
docker exec infamous-prometheus cat /etc/prometheus/prometheus.yml
```

---

## 📈 Performance Monitoring Dashboard

Once deployed, access Grafana at `http://YOUR_IP:3002`:

**Key Panels to Monitor:**

1. **API Health**
   - Uptime %
   - Error Rate (%)
   - Request Count (RPS)
   - Response Time (p50, p95, p99)

2. **Database**
   - Connection Count
   - Query Duration
   - Active Queries
   - Cache Hit Rate

3. **Infrastructure**
   - CPU Usage %
   - Memory Usage %
   - Disk Usage %
   - Network I/O

4. **Application**
   - Log Entries by Level
   - Top Errors
   - Slow Endpoints
   - HTTP Status Codes

---

## ✅ Phase 1 Success Confirmation

Once all criteria are met:

```bash
# Generate completion report
cat > PHASE_1_COMPLETION.md << 'EOF'
# Phase 1 Completion Report

**Completed**: January 1, 2026
**Status**: ✅ SUCCESS

## Metrics
- Uptime: 99.9%
- Error Rate: <0.5%
- Response p95: <2s
- Services: 7/7 running
- Database: Healthy
- Cache: 70%+ hit rate

## Next: Phase 2 Performance Optimization

Ready to proceed with Phase 2 (Performance tuning + optimization)

EOF

# Commit completion
git add PHASE_1_COMPLETION.md
git commit -m "feat: Phase 1 production deployment successful"
git push origin main
```

---

## 📞 Support & Escalation

**Phase 1 Support Channels:**

- **Documentation**: [PHASE_1_DEPLOYMENT_EXECUTION.md](PHASE_1_DEPLOYMENT_EXECUTION.md)
- **Issues**: Check [DEPLOYMENT_EXECUTION_PROCEDURES.md](DEPLOYMENT_EXECUTION_PROCEDURES.md#troubleshooting)
- **Escalation**: Contact Technical Lead if services fail to start

---

## 🎯 Ready for Phase 2?

After Phase 1 is stable for 24 hours:

1. Verify all success criteria met
2. Run Phase 2 preparation: `bash scripts/optimize-performance-phase2.sh`
3. Review [PHASE_2_PERFORMANCE_OPTIMIZATION.md](PHASE_2_PERFORMANCE_OPTIMIZATION.md)
4. Execute Phase 2: Performance tuning, database optimization, caching

---

**Total Timeline**: 45 min deployment + 24 hour monitoring = **1 day to Phase 2 ready**

🚀 Good luck with Phase 1 deployment!
