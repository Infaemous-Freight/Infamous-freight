#!/bin/bash

###############################################################################
# Favicon Generator for Infamous Freight Enterprises
#
# Generates favicon in multiple formats from SVG source.
#
# Usage:
#   ./favicon-generator.sh
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}"
SVG_SOURCE="${SCRIPT_DIR}/infamous-freight-logo.svg"

echo "🎨 Generating favicons from SVG source..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not installed"
    echo "Install with: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)"
    exit 1
fi

# Generate PNG versions at different sizes
echo "📐 Generating PNG versions..."
convert -background none -resize 16x16 "${SVG_SOURCE}" "${OUTPUT_DIR}/favicon-16x16.png"
convert -background none -resize 32x32 "${SVG_SOURCE}" "${OUTPUT_DIR}/favicon-32x32.png"
convert -background none -resize 48x48 "${SVG_SOURCE}" "${OUTPUT_DIR}/favicon-48x48.png"
convert -background none -resize 64x64 "${SVG_SOURCE}" "${OUTPUT_DIR}/favicon-64x64.png"
convert -background none -resize 128x128 "${SVG_SOURCE}" "${OUTPUT_DIR}/favicon-128x128.png"
convert -background none -resize 180x180 "${SVG_SOURCE}" "${OUTPUT_DIR}/apple-touch-icon.png"
convert -background none -resize 192x192 "${SVG_SOURCE}" "${OUTPUT_DIR}/android-chrome-192x192.png"
convert -background none -resize 512x512 "${SVG_SOURCE}" "${OUTPUT_DIR}/android-chrome-512x512.png"

# Generate ICO file (multi-resolution)
echo "💾 Generating .ico file..."
convert "${OUTPUT_DIR}/favicon-16x16.png" \
        "${OUTPUT_DIR}/favicon-32x32.png" \
        "${OUTPUT_DIR}/favicon-48x48.png" \
        "${OUTPUT_DIR}/favicon.ico"

echo "✅ Favicons generated successfully!"
echo ""
echo "📁 Generated files:"
echo "  - favicon.ico (16x16, 32x32, 48x48)"
echo "  - favicon-16x16.png"
echo "  - favicon-32x32.png"
echo "  - favicon-48x48.png"
echo "  - favicon-64x64.png"
echo "  - favicon-128x128.png"
echo "  - apple-touch-icon.png (180x180)"
echo "  - android-chrome-192x192.png"
echo "  - android-chrome-512x512.png"
echo ""
echo "📋 Add to your HTML <head>:"
echo '<link rel="icon" type="image/x-icon" href="/favicon.ico">'
echo '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">'
echo '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">'
echo '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">'
echo '<link rel="manifest" href="/site.webmanifest">'
