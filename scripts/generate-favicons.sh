#!/bin/bash
# Generate favicons from logo using ImageMagick or online tool
# For infamousfreight.com 100% completion

set -e

echo "🎨 Favicon Generator for infamousfreight.com"
echo "============================================"
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Installing..."
    
    # Detect OS and install
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install imagemagick
        else
            echo "❌ Homebrew not found. Install from: https://brew.sh"
            echo "Then run: brew install imagemagick"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux"* ]]; then
        # Linux (Alpine in dev container)
        if command -v apk &> /dev/null; then
            sudo apk add --no-cache imagemagick
        elif command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y imagemagick
        else
            echo "❌ Package manager not found. Please install ImageMagick manually."
            exit 1
        fi
    else
        echo "❌ Unsupported OS. Please install ImageMagick manually."
        exit 1
    fi
fi

cd apps/web/public

# Check if source logo exists
if [ ! -f "logo.png" ] && [ ! -f "logo.svg" ]; then
    echo "⚠️  No source logo found (logo.png or logo.svg)"
    echo "Creating placeholder favicons..."
    echo ""
    
    # Create a simple placeholder with IF initials
    convert -size 512x512 xc:'#000000' \
            -gravity center \
            -pointsize 300 \
            -fill '#FFFFFF' \
            -font 'Helvetica-Bold' \
            -annotate +0+0 'IF' \
            logo-source.png
    
    SOURCE="logo-source.png"
    echo "✅ Created placeholder logo: $SOURCE"
else
    if [ -f "logo.png" ]; then
        SOURCE="logo.png"
    else
        SOURCE="logo.svg"
    fi
    echo "✅ Using source: $SOURCE"
fi

echo ""
echo "📦 Generating favicons..."

# Generate all required sizes
convert "$SOURCE" -resize 16x16 -background none -flatten favicon-16x16.png
echo "  ✓ favicon-16x16.png"

convert "$SOURCE" -resize 32x32 -background none -flatten favicon-32x32.png
echo "  ✓ favicon-32x32.png"

convert "$SOURCE" -resize 32x32 -background none -flatten favicon.ico
echo "  ✓ favicon.ico"

convert "$SOURCE" -resize 180x180 -background none -flatten apple-touch-icon.png
echo "  ✓ apple-touch-icon.png"

convert "$SOURCE" -resize 192x192 -background none -flatten icon-192x192.png
echo "  ✓ icon-192x192.png"

convert "$SOURCE" -resize 512x512 -background none -flatten icon-512x512.png
echo "  ✓ icon-512x512.png"

echo ""
echo "✅ All favicons generated successfully!"
echo ""
echo "Files created in apps/web/public/:"
ls -lh favicon*.png favicon.ico apple-touch-icon.png icon-*.png

echo ""
echo "🔍 Verify in your HTML <head>:"
echo "  <link rel=\"icon\" href=\"/favicon.ico\" />"
echo "  <link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"/favicon-32x32.png\" />"
echo "  <link rel=\"icon\" type=\"image/png\" sizes=\"16x16\" href=\"/favicon-16x16.png\" />"
echo "  <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/apple-touch-icon.png\" />"
echo ""
echo "Next steps:"
echo "  1. Replace placeholder with your actual logo (optional)"
echo "  2. Re-run this script: ./scripts/generate-favicons.sh"
echo "  3. Verify favicons appear in browser tab"
echo ""
