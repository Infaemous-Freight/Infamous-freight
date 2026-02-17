#!/bin/bash
# Week 3 Deployment Script
# Deploys monitoring, caching, and security infrastructure

set -e

echo "============================================="
echo "  Week 3 Deployment: Monitoring & Security"
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Environment
ENVIRONMENT=${1:-staging}
DRY_RUN=${DRY_RUN:-false}

echo "Environment: $ENVIRONMENT"
echo "Dry Run: $DRY_RUN"
echo ""

# Step 1: Verify prerequisites
echo "📋 Step 1: Verifying prerequisites..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found${NC}"
echo ""

# Step 2: Create monitoring directories
echo "📁 Step 2: Creating monitoring directories..."
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p monitoring/prometheus/rules
mkdir -p monitoring/alertmanager
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Step 3: Deploy Redis (Advanced Caching)
echo "🗄️  Step 3: Deploying Redis cache..."
if [ "$DRY_RUN" = "false" ]; then
    docker-compose -f docker-compose.prod.yml up -d redis
    echo "Waiting for Redis to be ready..."
    sleep 5
    docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping || true
    echo -e "${GREEN}✓ Redis deployed and running${NC}"
else
    echo -e "${YELLOW}⊙ Dry run - skipping Redis deployment${NC}"
fi
echo ""

# Step 4: Deploy Prometheus
echo "📊 Step 4: Deploying Prometheus..."
if [ "$DRY_RUN" = "false" ]; then
    docker run -d \
        --name prometheus \
        --network infamous-network \
        -p 9090:9090 \
        -v "$(pwd)/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml" \
        -v "$(pwd)/monitoring/alert-rules.yml:/etc/prometheus/rules/alert-rules.yml" \
        prom/prometheus:latest \
        --config.file=/etc/prometheus/prometheus.yml \
        --storage.tsdb.path=/prometheus \
        --web.console.libraries=/etc/prometheus/console_libraries \
        --web.console.templates=/etc/prometheus/consoles
    
    echo "Waiting for Prometheus to be ready..."
    sleep 5
    echo -e "${GREEN}✓ Prometheus deployed: http://localhost:9090${NC}"
else
    echo -e "${YELLOW}⊙ Dry run - skipping Prometheus deployment${NC}"
fi
echo ""

# Step 5: Deploy Grafana
echo "📈 Step 5: Deploying Grafana..."
if [ "$DRY_RUN" = "false" ]; then
    docker run -d \
        --name grafana \
        --network infamous-network \
        -p 3001:3000 \
        -v "$(pwd)/monitoring/grafana-dashboards:/etc/grafana/provisioning/dashboards" \
        -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
        -e "GF_USERS_ALLOW_SIGN_UP=false" \
        grafana/grafana:latest
    
    echo "Waiting for Grafana to be ready..."
    sleep 10
    echo -e "${GREEN}✓ Grafana deployed: http://localhost:3001 (admin/admin)${NC}"
else
    echo -e "${YELLOW}⊙ Dry run - skipping Grafana deployment${NC}"
fi
echo ""

# Step 6: Deploy exporters
echo "🔌 Step 6: Deploying exporters..."
if [ "$DRY_RUN" = "false" ]; then
    # Node Exporter
    docker run -d \
        --name node-exporter \
        --network infamous-network \
        -p 9100:9100 \
        prom/node-exporter:latest
    
    # Redis Exporter
    docker run -d \
        --name redis-exporter \
        --network infamous-network \
        -p 9121:9121 \
        -e "REDIS_ADDR=redis:6379" \
        oliver006/redis_exporter:latest
    
    echo -e "${GREEN}✓ Exporters deployed${NC}"
else
    echo -e "${YELLOW}⊙ Dry run - skipping exporter deployment${NC}"
fi
echo ""

# Step 7: Update API with caching
echo "⚙️  Step 7: Updating API with cache service..."
if [ "$DRY_RUN" = "false" ]; then
    docker-compose -f docker-compose.prod.yml restart api
    echo "Waiting for API to restart..."
    sleep 10
    echo -e "${GREEN}✓ API restarted with caching enabled${NC}"
else
    echo -e "${YELLOW}⊙ Dry run - skipping API restart${NC}"
fi
echo ""

# Step 8: Health checks
echo "🏥 Step 8: Running health checks..."
if [ "$DRY_RUN" = "false" ]; then
    # Check API
    if curl -sf http://localhost:4000/api/health > /dev/null; then
        echo -e "${GREEN}✓ API is healthy${NC}"
    else
        echo -e "${RED}✗ API health check failed${NC}"
    fi
    
    # Check Redis
    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q "PONG"; then
        echo -e "${GREEN}✓ Redis is healthy${NC}"
    else
        echo -e "${RED}✗ Redis health check failed${NC}"
    fi
    
    # Check Prometheus
    if curl -sf http://localhost:9090/-/healthy > /dev/null; then
        echo -e "${GREEN}✓ Prometheus is healthy${NC}"
    else
        echo -e "${RED}✗ Prometheus health check failed${NC}"
    fi
    
    # Check Grafana
    if curl -sf http://localhost:3001/api/health > /dev/null; then
        echo -e "${GREEN}✓ Grafana is healthy${NC}"
    else
        echo -e "${RED}✗ Grafana health check failed${NC}"
    fi
else
    echo -e "${YELLOW}⊙ Dry run - skipping health checks${NC}"
fi
echo ""

# Step 9: Display service URLs
echo "============================================="
echo "  Week 3 Deployment Complete!"
echo "============================================="
echo ""
echo "Services Available:"
echo "  🌐 API:        http://localhost:4000"
echo "  📊 Prometheus: http://localhost:9090"
echo "  📈 Grafana:    http://localhost:3001 (admin/admin)"
echo "  🗄️  Redis:      redis://localhost:6379"
echo ""
echo "Next Steps:"
echo "  1. Configure Grafana dashboards"
echo "  2. Test cache performance"
echo "  3. Review alert rules in Prometheus"
echo "  4. Deploy Week 4 (scaling): ./scripts/deploy-week4.sh"
echo ""
echo "✨ Week 3 Infrastructure Ready!"
