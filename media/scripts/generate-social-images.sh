#!/bin/bash

###############################################################################
# Social Media Image Generator for Infamous Freight Enterprises
#
# Generates optimized images for various social media platforms using Puppeteer.
#
# Usage:
#   ./generate-social-images.sh [platform]
#
# Platforms: all, twitter, facebook, linkedin, instagram
###############################################################################

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MEDIA_DIR="${SCRIPT_DIR}/.."
SOCIAL_DIR="${MEDIA_DIR}/social"
OUTPUT_DIR="${SOCIAL_DIR}/generated"

mkdir -p "${OUTPUT_DIR}"

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $*"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

check_dependencies() {
    if ! command -v node &> /dev/null; then
        warn "Node.js not installed. Install from https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        warn "npx not available. Update Node.js to latest version."
        exit 1
    fi
}

# Generate Open Graph image (1200x630 for Facebook, LinkedIn, Twitter)
generate_og_image() {
    log "Generating Open Graph image (1200x630)..."
    
    cat > /tmp/generate-og.js << 'EOF'
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1200, height: 630 });
    
    const htmlPath = path.join(__dirname, '../open-graph-template.html');
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle2' });
    
    const outputPath = path.join(__dirname, '../generated/og-image.png');
    await page.screenshot({
        path: outputPath,
        clip: { x: 0, y: 0, width: 1200, height: 630 }
    });
    
    console.log(`✅ Open Graph image created: ${outputPath}`);
    
    await browser.close();
})();
EOF

    cd "${SOCIAL_DIR}"
    npx puppeteer@latest /tmp/generate-og.js
    rm /tmp/generate-og.js
    
    log "✅ Open Graph image created"
}

# Generate Twitter Card (1200x600)
generate_twitter_card() {
    log "Generating Twitter card (1200x600)..."
    
    if command -v convert &> /dev/null; then
        # Resize OG image to Twitter dimensions
        convert "${OUTPUT_DIR}/og-image.png" \
            -resize 1200x600! \
            "${OUTPUT_DIR}/twitter-card.png"
        
        log "✅ Twitter card created"
    else
        warn "ImageMagick not installed. Skipping Twitter card."
    fi
}

# Generate Instagram post (1080x1080 square)
generate_instagram_post() {
    log "Generating Instagram post (1080x1080)..."
    
    cat > /tmp/generate-instagram.js << 'EOF'
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1080, height: 1080 });
    
    // Set HTML content for Instagram square format
    await page.setContent(`
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            width: 1080px;
            height: 1080px;
            background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            position: relative;
            overflow: hidden;
        }
        .logo { font-size: 80px; font-weight: 700; color: white; margin-bottom: 40px; }
        .title { font-size: 56px; font-weight: 700; color: white; text-align: center; margin-bottom: 24px; padding: 0 60px; line-height: 1.2; }
        .subtitle { font-size: 28px; color: rgba(255,255,255,0.9); text-align: center; padding: 0 80px; line-height: 1.4; }
        .badge { position: absolute; bottom: 60px; background: #F97316; color: white; padding: 20px 50px; border-radius: 50px; font-size: 24px; font-weight: 600; }
        .pattern { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.05; background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255, 255, 255, 0.1) 35px, rgba(255, 255, 255, 0.1) 70px); }
    </style>
</head>
<body>
    <div class="pattern"></div>
    <div class="logo">IF</div>
    <div class="title">Ship Smarter with AI</div>
    <div class="subtitle">Real-time tracking • Instant quotes • Secure delivery</div>
    <div class="badge">Try Free Today</div>
</body>
</html>
    `, { waitUntil: 'networkidle2' });
    
    const outputPath = path.join(__dirname, '../generated/instagram-post.png');
    await page.screenshot({ path: outputPath });
    
    console.log(`✅ Instagram post created: ${outputPath}`);
    
    await browser.close();
})();
EOF

    cd "${SOCIAL_DIR}"
    npx puppeteer@latest /tmp/generate-instagram.js
    rm /tmp/generate-instagram.js
    
    log "✅ Instagram post created"
}

# Generate Instagram Story (1080x1920 vertical)
generate_instagram_story() {
    log "Generating Instagram story (1080x1920)..."
    
    cat > /tmp/generate-story.js << 'EOF'
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1080, height: 1920 });
    
    await page.setContent(`
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            width: 1080px;
            height: 1920px;
            background: linear-gradient(180deg, #1E3A8A 0%, #2563EB 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            padding: 100px 60px;
            position: relative;
        }
        .logo { font-size: 120px; font-weight: 700; color: white; margin-bottom: 60px; }
        .title { font-size: 72px; font-weight: 700; color: white; text-align: center; margin-bottom: 40px; line-height: 1.2; }
        .features { margin-top: 60px; }
        .feature { display: flex; align-items: center; gap: 30px; margin-bottom: 40px; }
        .feature-icon { width: 80px; height: 80px; background: rgba(249, 115, 22, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; }
        .feature-text { font-size: 32px; color: white; font-weight: 600; }
        .cta { position: absolute; bottom: 120px; background: #F97316; color: white; padding: 30px 80px; border-radius: 60px; font-size: 36px; font-weight: 700; }
    </style>
</head>
<body>
    <div class="logo">IF</div>
    <div class="title">Transform Your Logistics</div>
    <div class="features">
        <div class="feature">
            <div class="feature-icon">✓</div>
            <div class="feature-text">Real-Time Tracking</div>
        </div>
        <div class="feature">
            <div class="feature-icon">⚡</div>
            <div class="feature-text">Instant Quotes</div>
        </div>
        <div class="feature">
            <div class="feature-icon">🤖</div>
            <div class="feature-text">AI-Powered Routes</div>
        </div>
        <div class="feature">
            <div class="feature-icon">🔒</div>
            <div class="feature-text">Secure & Reliable</div>
        </div>
    </div>
    <div class="cta">Get Started</div>
</body>
</html>
    `, { waitUntil: 'networkidle2' });
    
    const outputPath = path.join(__dirname, '../generated/instagram-story.png');
    await page.screenshot({ path: outputPath });
    
    console.log(`✅ Instagram story created: ${outputPath}`);
    
    await browser.close();
})();
EOF

    cd "${SOCIAL_DIR}"
    npx puppeteer@latest /tmp/generate-story.js
    rm /tmp/generate-story.js
    
    log "✅ Instagram story created"
}

# Generate LinkedIn banner (1584x396)
generate_linkedin_banner() {
    log "Generating LinkedIn banner (1584x396)..."
    
    if command -v convert &> /dev/null && [ -f "${OUTPUT_DIR}/og-image.png" ]; then
        convert "${OUTPUT_DIR}/og-image.png" \
            -resize 1584x396! \
            "${OUTPUT_DIR}/linkedin-banner.png"
        
        log "✅ LinkedIn banner created"
    else
        warn "ImageMagick not installed or OG image missing. Skipping LinkedIn banner."
    fi
}

# Main function
main() {
    local platform=${1:-all}
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║    Infamous Freight - Social Media Image Generator      ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    
    check_dependencies
    
    case "$platform" in
        all)
            info "Generating all social media images..."
            generate_og_image
            generate_twitter_card
            generate_instagram_post
            generate_instagram_story
            generate_linkedin_banner
            ;;
        twitter)
            generate_og_image
            generate_twitter_card
            ;;
        facebook)
            generate_og_image
            ;;
        linkedin)
            generate_og_image
            generate_linkedin_banner
            ;;
        instagram)
            generate_instagram_post
            generate_instagram_story
            ;;
        *)
            warn "Unknown platform: $platform"
            info "Available platforms: all, twitter, facebook, linkedin, instagram"
            exit 1
            ;;
    esac
    
    log "✅ Social media images generated in: ${OUTPUT_DIR}"
    
    info "📊 Generated images:"
    if [ "$platform" = "all" ] || [ "$platform" = "facebook" ]; then
        info "  - og-image.png (1200x630) - Facebook, LinkedIn, Twitter"
    fi
    if [ "$platform" = "all" ] || [ "$platform" = "twitter" ]; then
        info "  - twitter-card.png (1200x600)"
    fi
    if [ "$platform" = "all" ] || [ "$platform" = "instagram" ]; then
        info "  - instagram-post.png (1080x1080)"
        info "  - instagram-story.png (1080x1920)"
    fi
    if [ "$platform" = "all" ] || [ "$platform" = "linkedin" ]; then
        info "  - linkedin-banner.png (1584x396)"
    fi
}

main "$@"
