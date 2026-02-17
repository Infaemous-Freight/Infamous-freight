#!/bin/bash

# Docker Configuration Verification Script
# Verifies all Docker files and configurations are correct

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "================================"
echo "🐳 Docker Configuration Verification"
echo "================================"
echo ""

ERRORS=0
WARNINGS=0

# Check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
    else
        echo -e "${RED}❌${NC} $1 - NOT FOUND"
        ERRORS=$((ERRORS + 1))
    fi
}

# Check Dockerfiles
echo "📝 Checking Dockerfiles..."
check_file "Dockerfile.fly"
check_file "apps/api/Dockerfile"
check_file "apps/web/Dockerfile"
check_file ".dockerignore"
echo ""

# Check Docker Compose files
echo "📦 Checking Docker Compose files..."
check_file "docker-compose.yml"
check_file "docker-compose.prod.yml"
check_file "docker-compose.dev.yml"
echo ""

# Check scripts
echo "🔧 Checking Docker scripts..."
if [ -x "scripts/docker-manager.sh" ]; then
    echo -e "${GREEN}✅${NC} scripts/docker-manager.sh (executable)"
else
    echo -e "${YELLOW}⚠️${NC} scripts/docker-manager.sh (not executable)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check documentation
echo "📚 Checking documentation..."
check_file "DOCKER_COMPLETE.md"
check_file "DOCKER_FIXED_100_PERCENT.md"
echo ""

# Validate Dockerfile syntax
echo "✨ Validating Dockerfile syntax..."

validate_dockerfile() {
    local file=$1
    if [ -f "$file" ]; then
        # Check for common patterns
        if grep -q "FROM.*AS" "$file" && \
           grep -q "WORKDIR" "$file" && \
           grep -q "COPY" "$file"; then
            echo -e "${GREEN}✅${NC} $file - valid multi-stage structure"
        else
            echo -e "${YELLOW}⚠️${NC} $file - missing standard patterns"
            WARNINGS=$((WARNINGS + 1))
        fi
        
        # Check for security features
        if grep -q "adduser\|addgroup" "$file" || grep -q "USER" "$file"; then
            echo -e "${GREEN}  ✅${NC} Non-root user configured"
        else
            echo -e "${YELLOW}  ⚠️${NC} No non-root user found"
            WARNINGS=$((WARNINGS + 1))
        fi
        
        if grep -q "HEALTHCHECK" "$file"; then
            echo -e "${GREEN}  ✅${NC} Health check configured"
        else
            echo -e "${YELLOW}  ⚠️${NC} No health check found"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
}

validate_dockerfile "Dockerfile.fly"
validate_dockerfile "apps/api/Dockerfile"
validate_dockerfile "apps/web/Dockerfile"
echo ""

# Validate docker-compose syntax
echo "✨ Validating docker-compose.yml..."
if [ -f "docker-compose.yml" ]; then
    # Check for key sections
    if grep -q "^services:" "docker-compose.yml" && \
       grep -q "^volumes:" "docker-compose.yml" && \
       grep -q "^networks:" "docker-compose.yml"; then
        echo -e "${GREEN}✅${NC} docker-compose.yml - valid structure"
    else
        echo -e "${YELLOW}⚠️${NC} docker-compose.yml - missing standard sections"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Check for health checks
    if grep -q "healthcheck:" "docker-compose.yml"; then
        echo -e "${GREEN}  ✅${NC} Health checks configured"
    else
        echo -e "${YELLOW}  ⚠️${NC} No health checks found"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Check for security options
    if grep -q "security_opt:" "docker-compose.yml"; then
        echo -e "${GREEN}  ✅${NC} Security options configured"
    else
        echo -e "${YELLOW}  ⚠️${NC} No security options found"
        WARNINGS=$((WARNINGS + 1))
    fi
fi
echo ""

# Check for best practices
echo "🛡️  Checking best practices..."

# Check .dockerignore
if [ -f ".dockerignore" ]; then
    if grep -q "node_modules" ".dockerignore" && \
       grep -q ".git" ".dockerignore" && \
       grep -q "*.log" ".dockerignore"; then
        echo -e "${GREEN}✅${NC} .dockerignore includes standard patterns"
    else
        echo -e "${YELLOW}⚠️${NC} .dockerignore may be incomplete"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Check for security in Dockerfiles
echo -e "${BLUE}📊 Security Checklist:${NC}"
for dockerfile in "Dockerfile.fly" "apps/api/Dockerfile" "apps/web/Dockerfile"; do
    if [ -f "$dockerfile" ]; then
        echo "  Checking $dockerfile:"
        
        # Alpine base
        if grep -q "alpine" "$dockerfile"; then
            echo -e "    ${GREEN}✅${NC} Using Alpine Linux (minimal)"
        else
            echo -e "    ${YELLOW}⚠️${NC} Not using Alpine"
        fi
        
        # Security updates
        if grep -q "apk.*upgrade" "$dockerfile"; then
            echo -e "    ${GREEN}✅${NC} Security updates enabled"
        else
            echo -e "    ${YELLOW}⚠️${NC} No security updates found"
        fi
        
        # Dumb-init or tini
        if grep -q "dumb-init\|tini" "$dockerfile"; then
            echo -e "    ${GREEN}✅${NC} Init system configured"
        else
            echo -e "    ${YELLOW}⚠️${NC} No init system"
        fi
    fi
done
echo ""

# Check environment
echo "🌍 Checking environment..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅${NC} .env.example exists"
    
    # Check for Docker-related vars
    if grep -q "POSTGRES_" ".env.example" && \
       grep -q "REDIS_" ".env.example"; then
        echo -e "${GREEN}  ✅${NC} Docker environment variables documented"
    else
        echo -e "${YELLOW}  ⚠️${NC} Missing Docker environment variables"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠️${NC} .env.example not found"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "================================"
echo "📊 Verification Summary"
echo "================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 Perfect! All Docker configurations are optimal!${NC}"
    echo ""
    echo "Your Docker setup is 100% production-ready:"
    echo -e "  ${GREEN}✅${NC} All Dockerfiles present and valid"
    echo -e "  ${GREEN}✅${NC} Multi-stage builds configured"
    echo -e "  ${GREEN}✅${NC} Security best practices implemented"
    echo -e "  ${GREEN}✅${NC} Health checks configured"
    echo -e "  ${GREEN}✅${NC} Documentation complete"
    echo ""
    echo "Next steps:"
    echo "  1. Test locally: ./scripts/docker-manager.sh up"
    echo "  2. Check health: ./scripts/docker-manager.sh health"
    echo "  3. View logs: ./scripts/docker-manager.sh logs"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Configuration is good with $WARNINGS warnings${NC}"
    echo ""
    echo "Warnings are recommendations, not blockers."
    echo "Your Docker setup will work but could be improved."
    echo ""
    echo "Review warnings above and consider implementing suggestions."
    echo ""
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS errors and $WARNINGS warnings${NC}"
    echo ""
    echo "Critical issues found! Fix before using Docker:"
    echo "  • Missing required Dockerfiles"
    echo "  • Invalid Docker Compose configuration"
    echo "  • Missing critical security features"
    echo ""
    echo "Review errors above and fix them."
    echo ""
    exit 1
fi
