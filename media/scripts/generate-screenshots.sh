#!/bin/bash

###############################################################################
# Automated Screenshot Generator for Infamous Freight Enterprises
#
# Captures high-quality screenshots of web and mobile applications using
# Playwright for automated browser testing.
#
# Usage:
#   ./scripts/generate-screenshots.sh [type] [options]
#
# Types:
#   all      - Capture all screenshots
#   web      - Web application only
#   mobile   - Mobile application only
#   api      - API documentation only
#
# Examples:
#   ./scripts/generate-screenshots.sh all
#   ./scripts/generate-screenshots.sh web --headless
#   ./scripts/generate-screenshots.sh mobile --device="iPhone 13"
###############################################################################

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MEDIA_DIR="${PROJECT_ROOT}/media"
SCREENSHOTS_DIR="${MEDIA_DIR}/screenshots"
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_DOC_URL="${API_DOC_URL:-http://localhost:4000/api/docs}"

# Create directories
mkdir -p "${SCREENSHOTS_DIR}/web"
mkdir -p "${SCREENSHOTS_DIR}/mobile"
mkdir -p "${SCREENSHOTS_DIR}/api"

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $*"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

# Check if Playwright is installed
check_playwright() {
    if ! command -v npx &> /dev/null; then
        warn "npx not found. Installing Playwright..."
        cd "${PROJECT_ROOT}"
        npm install -g playwright
        npx playwright install chromium firefox webkit
    fi
}

# Generate Web Application Screenshots
generate_web_screenshots() {
    log "Generating web application screenshots..."
    
    cd "${PROJECT_ROOT}/e2e"
    
    cat > screenshot-web.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('Web Application Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
  });

  test('Landing Page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '../media/screenshots/web/landing-page.png',
      fullPage: true 
    });
  });

  test('Dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'demo@example.com');
    await page.fill('input[name="password"]', 'Demo123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '../media/screenshots/web/dashboard.png',
      fullPage: true 
    });
  });

  test('Shipment List', async ({ page }) => {
    await page.goto('/shipments');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '../media/screenshots/web/shipment-list.png',
      fullPage: true 
    });
  });

  test('Create Shipment Form', async ({ page }) => {
    await page.goto('/shipments/create');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '../media/screenshots/web/create-shipment.png',
      fullPage: true 
    });
  });

  test('Analytics Dashboard', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '../media/screenshots/web/analytics.png',
      fullPage: true 
    });
  });

  test('User Profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '../media/screenshots/web/user-profile.png',
      fullPage: true 
    });
  });
});
EOF

    npx playwright test screenshot-web.spec.ts --headed
    
    log "✅ Web screenshots generated in ${SCREENSHOTS_DIR}/web/"
}

# Generate Mobile Application Screenshots
generate_mobile_screenshots() {
    log "Generating mobile application screenshots..."
    
    cd "${PROJECT_ROOT}/e2e"
    
    cat > screenshot-mobile.spec.ts << 'EOF'
import { test, devices } from '@playwright/test';

test.use({
  ...devices['iPhone 13 Pro']
});

test.describe('Mobile Application Screenshots', () => {
  test('Mobile Landing Page', async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '../media/screenshots/mobile/landing-mobile.png'
    });
  });

  test('Mobile Dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '../media/screenshots/mobile/dashboard-mobile.png'
    });
  });

  test('Mobile Shipment List', async ({ page }) => {
    await page.goto('/shipments');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '../media/screenshots/mobile/shipments-mobile.png'
    });
  });

  test('Mobile Tracking', async ({ page }) => {
    await page.goto('/tracking/123');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '../media/screenshots/mobile/tracking-mobile.png'
    });
  });
});
EOF

    npx playwright test screenshot-mobile.spec.ts --headed
    
    log "✅ Mobile screenshots generated in ${SCREENSHOTS_DIR}/mobile/"
}

# Generate API Documentation Screenshots
generate_api_screenshots() {
    log "Generating API documentation screenshots..."
    
    cd "${PROJECT_ROOT}/e2e"
    
    cat > screenshot-api.spec.ts << 'EOF'
import { test } from '@playwright/test';

test.describe('API Documentation Screenshots', () => {
  test('Swagger UI Overview', async ({ page }) => {
    await page.goto(process.env.API_DOC_URL || 'http://localhost:4000/api/docs');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: '../media/screenshots/api/swagger-overview.png',
      fullPage: true 
    });
  });

  test('Shipments Endpoint', async ({ page }) => {
    await page.goto(process.env.API_DOC_URL || 'http://localhost:4000/api/docs');
    await page.click('text=Shipments');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: '../media/screenshots/api/shipments-endpoint.png'
    });
  });

  test('Authentication Section', async ({ page }) => {
    await page.goto(process.env.API_DOC_URL || 'http://localhost:4000/api/docs');
    await page.click('text=Authentication');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: '../media/screenshots/api/authentication.png'
    });
  });
});
EOF

    npx playwright test screenshot-api.spec.ts --headed
    
    log "✅ API documentation screenshots generated in ${SCREENSHOTS_DIR}/api/"
}

# Optimize screenshots
optimize_screenshots() {
    log "Optimizing screenshots..."
    
    if command -v optipng &> /dev/null; then
        find "${SCREENSHOTS_DIR}" -name "*.png" -exec optipng -o7 {} \;
        log "✅ Screenshots optimized with optipng"
    else
        warn "optipng not found. Install for better compression: brew install optipng"
    fi
}

# Generate thumbnail versions
generate_thumbnails() {
    log "Generating thumbnails..."
    
    if command -v convert &> /dev/null; then
        find "${SCREENSHOTS_DIR}" -name "*.png" -not -path "*/thumbnails/*" | while read -r file; do
            dir=$(dirname "$file")
            base=$(basename "$file" .png)
            mkdir -p "${dir}/thumbnails"
            convert "$file" -resize 400x300 "${dir}/thumbnails/${base}-thumb.png"
        done
        log "✅ Thumbnails generated"
    else
        warn "ImageMagick not found. Install for thumbnails: brew install imagemagick"
    fi
}

# Main function
main() {
    local type=${1:-all}
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║    Infamous Freight - Screenshot Generator              ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    
    info "Screenshot type: ${type}"
    info "Output directory: ${SCREENSHOTS_DIR}"
    info "Base URL: ${BASE_URL}"
    
    check_playwright
    
    case "${type}" in
        all)
            generate_web_screenshots
            generate_mobile_screenshots
            generate_api_screenshots
            ;;
        web)
            generate_web_screenshots
            ;;
        mobile)
            generate_mobile_screenshots
            ;;
        api)
            generate_api_screenshots
            ;;
        *)
            echo "Unknown type: ${type}"
            echo "Usage: $0 [all|web|mobile|api]"
            exit 1
            ;;
    esac
    
    optimize_screenshots
    generate_thumbnails
    
    log "✅ Screenshot generation complete!"
    log "Screenshots saved to: ${SCREENSHOTS_DIR}"
}

main "$@"
