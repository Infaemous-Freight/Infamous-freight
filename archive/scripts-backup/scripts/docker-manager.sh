#!/bin/bash

# Docker Management Script for Infamous Freight Enterprises
# Provides easy commands for building, running, and managing Docker containers

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "================================"
echo "🐳 Docker Management Tool"
echo "================================"
echo ""

# Function to display usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build              Build all Docker images"
    echo "  build-api          Build API image only"
    echo "  build-web          Build Web image only"
    echo "  up                 Start all services"
    echo "  down               Stop all services"
    echo "  restart            Restart all services"
    echo "  logs               View logs from all services"
    echo "  logs-api           View API logs"
    echo "  logs-web           View Web logs"
    echo "  logs-db            View database logs"
    echo "  health             Check health of all services"
    echo "  shell-api          Open shell in API container"
    echo "  shell-web          Open shell in Web container"
    echo "  shell-db           Open shell in PostgreSQL container"
    echo "  clean              Clean up containers, networks, and volumes"
    echo "  prune              Remove all unused Docker resources"
    echo "  stats              Show resource usage stats"
    echo "  prod-build         Build production images"
    echo "  prod-up            Start production stack"
    echo "  test               Run tests in containers"
    echo "  migrate            Run database migrations"
    echo ""
    echo "Examples:"
    echo "  $0 build           # Build all images"
    echo "  $0 up              # Start all services in development mode"
    echo "  $0 prod-build      # Build for production"
    echo "  $0 health          # Check health status"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        echo "Install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        echo "Install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker is installed${NC}"
    docker --version
    docker-compose --version 2>/dev/null || docker compose version
    echo ""
}

# Build all images
build_all() {
    echo -e "${BLUE}🔨 Building all Docker images...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose build --parallel
    echo -e "${GREEN}✅ Build complete${NC}"
}

# Build API image
build_api() {
    echo -e "${BLUE}🔨 Building API image...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose build api
    echo -e "${GREEN}✅ API build complete${NC}"
}

# Build Web image
build_web() {
    echo -e "${BLUE}🔨 Building Web image...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose build web
    echo -e "${GREEN}✅ Web build complete${NC}"
}

# Start all services
start_services() {
    echo -e "${BLUE}🚀 Starting all services...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose up -d
    echo ""
    echo -e "${GREEN}✅ Services started${NC}"
    echo ""
    echo "Services running:"
    docker-compose ps
}

# Stop all services
stop_services() {
    echo -e "${BLUE}⏹️  Stopping all services...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Restart services
restart_services() {
    echo -e "${BLUE}🔄 Restarting all services...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose restart
    echo -e "${GREEN}✅ Services restarted${NC}"
}

# View logs
view_logs() {
    cd "$PROJECT_ROOT"
    docker-compose logs -f --tail=100
}

# View API logs
view_api_logs() {
    cd "$PROJECT_ROOT"
    docker-compose logs -f --tail=100 api
}

# View Web logs
view_web_logs() {
    cd "$PROJECT_ROOT"
    docker-compose logs -f --tail=100 web
}

# View database logs
view_db_logs() {
    cd "$PROJECT_ROOT"
    docker-compose logs -f --tail=100 postgres
}

# Check health
check_health() {
    echo -e "${BLUE}🏥 Checking service health...${NC}"
    echo ""
    cd "$PROJECT_ROOT"
    
    # Check if services are running
    if ! docker-compose ps | grep -q "Up"; then
        echo -e "${RED}❌ No services are running${NC}"
        echo "Run: $0 up"
        exit 1
    fi
    
    # Check each service
    check_service_health "postgres" "5432"
    check_service_health "redis" "6379"
    check_service_health "api" "4000"
    check_service_health "web" "3000"
    
    echo ""
    echo -e "${GREEN}✅ Health check complete${NC}"
}

# Check individual service health
check_service_health() {
    local service=$1
    local port=$2
    
    if docker-compose ps | grep "$service" | grep -q "Up"; then
        local health=$(docker inspect --format='{{.State.Health.Status}}' "infamous_${service}" 2>/dev/null || echo "none")
        
        if [ "$health" = "healthy" ] || [ "$health" = "none" ]; then
            echo -e "  ${GREEN}✅${NC} $service (port $port) - Running"
        else
            echo -e "  ${YELLOW}⚠️${NC} $service (port $port) - Unhealthy"
        fi
    else
        echo -e "  ${RED}❌${NC} $service (port $port) - Not running"
    fi
}

# Open shell in API container
shell_api() {
    echo -e "${BLUE}🐚 Opening shell in API container...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose exec api sh
}

# Open shell in Web container
shell_web() {
    echo -e "${BLUE}🐚 Opening shell in Web container...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose exec web sh
}

# Open shell in database
shell_db() {
    echo -e "${BLUE}🐚 Opening PostgreSQL shell...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose exec postgres psql -U infamous -d infamous_freight
}

# Clean up
clean_up() {
    echo -e "${YELLOW}⚠️  This will remove all containers, networks, and volumes${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🧹 Cleaning up...${NC}"
        cd "$PROJECT_ROOT"
        docker-compose down -v --remove-orphans
        echo -e "${GREEN}✅ Cleanup complete${NC}"
    else
        echo "Cancelled"
    fi
}

# Prune Docker resources
prune_docker() {
    echo -e "${YELLOW}⚠️  This will remove all unused Docker resources${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🧹 Pruning Docker resources...${NC}"
        docker system prune -a --volumes -f
        echo -e "${GREEN}✅ Prune complete${NC}"
    else
        echo "Cancelled"
    fi
}

# Show resource stats
show_stats() {
    echo -e "${BLUE}📊 Container resource usage:${NC}"
    echo ""
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Build production images
build_production() {
    echo -e "${BLUE}🔨 Building production images...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel
    echo -e "${GREEN}✅ Production build complete${NC}"
}

# Start production stack
start_production() {
    echo -e "${BLUE}🚀 Starting production stack...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    echo ""
    echo -e "${GREEN}✅ Production services started${NC}"
    echo ""
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
}

# Run tests
run_tests() {
    echo -e "${BLUE}🧪 Running tests in containers...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose exec api pnpm test
    echo -e "${GREEN}✅ Tests complete${NC}"
}

# Run migrations
run_migrations() {
    echo -e "${BLUE}🔄 Running database migrations...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose exec api pnpm run prisma:migrate:deploy
    echo -e "${GREEN}✅ Migrations complete${NC}"
}

# Main command handling
check_docker

case "${1:-}" in
    build)
        build_all
        ;;
    build-api)
        build_api
        ;;
    build-web)
        build_web
        ;;
    up)
        start_services
        ;;
    down)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        view_logs
        ;;
    logs-api)
        view_api_logs
        ;;
    logs-web)
        view_web_logs
        ;;
    logs-db)
        view_db_logs
        ;;
    health)
        check_health
        ;;
    shell-api)
        shell_api
        ;;
    shell-web)
        shell_web
        ;;
    shell-db)
        shell_db
        ;;
    clean)
        clean_up
        ;;
    prune)
        prune_docker
        ;;
    stats)
        show_stats
        ;;
    prod-build)
        build_production
        ;;
    prod-up)
        start_production
        ;;
    test)
        run_tests
        ;;
    migrate)
        run_migrations
        ;;
    help|--help|-h)
        usage
        ;;
    "")
        usage
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        usage
        exit 1
        ;;
esac
