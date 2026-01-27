#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Bundle Size Audit Script - Monitors and alerts on bundle size changes

set -e

BUILD_DIR="${1:-web/.next}"
THRESHOLD_KB="${BUNDLE_SIZE_THRESHOLD_KB:-200}"
OUTPUT_FILE="${OUTPUT_FILE:-/tmp/bundle-analysis.json}"

echo "📦 Bundle Size Audit"
echo "========================================"
echo "Build directory: $BUILD_DIR"
echo "Threshold: ${THRESHOLD_KB}KB"
echo ""

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found: $BUILD_DIR"
    echo "Run 'pnpm --filter web build' first"
    exit 1
fi

# Function to analyze bundle
analyze_bundle() {
    echo "🔍 Analyzing bundle sizes..."
    
    # Find all JS chunks
    local chunks_dir="${BUILD_DIR}/static/chunks"
    
    if [ ! -d "$chunks_dir" ]; then
        echo "⚠️  Chunks directory not found"
        return 1
    fi
    
    # Calculate sizes
    local total_size=0
    local chunk_count=0
    local large_chunks=()
    
    while IFS= read -r -d '' file; do
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        local size_kb=$((size / 1024))
        local filename=$(basename "$file")
        
        total_size=$((total_size + size))
        chunk_count=$((chunk_count + 1))
        
        # Track large chunks
        if [ $size_kb -gt $THRESHOLD_KB ]; then
            large_chunks+=("$filename: ${size_kb}KB")
        fi
        
        # Show top 5 largest
        if [ $chunk_count -le 5 ]; then
            echo "  📄 $filename: ${size_kb}KB"
        fi
    done < <(find "$chunks_dir" -name "*.js" -type f -print0 | head -z -5)
    
    local total_kb=$((total_size / 1024))
    local total_mb=$((total_kb / 1024))
    
    echo ""
    echo "📊 Summary:"
    echo "  Total chunks: $chunk_count"
    echo "  Total size: ${total_kb}KB (${total_mb}MB)"
    echo ""
    
    # Check against threshold
    if [ ${#large_chunks[@]} -gt 0 ]; then
        echo "⚠️  Large chunks detected (>${THRESHOLD_KB}KB):"
        for chunk in "${large_chunks[@]}"; do
            echo "    $chunk"
        done
        echo ""
        echo "💡 Consider:"
        echo "   - Dynamic imports for heavy components"
        echo "   - Code splitting strategies"
        echo "   - Tree-shaking unused imports"
        echo "   - Review dependencies with: pnpm why <package>"
    else
        echo "✅ All chunks below threshold"
    fi
    
    # Save results
    echo "{\"totalKB\": $total_kb, \"chunkCount\": $chunk_count, \"largeChunks\": ${#large_chunks[@]}, \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" > "$OUTPUT_FILE"
    echo ""
    echo "💾 Results saved to: $OUTPUT_FILE"
}

# Function to analyze pages
analyze_pages() {
    echo ""
    echo "📄 Page Analysis:"
    
    local pages_dir="${BUILD_DIR}/server/pages"
    
    if [ ! -d "$pages_dir" ]; then
        echo "⚠️  Pages directory not found"
        return 1
    fi
    
    # Find HTML/JSON files
    local page_count=0
    while IFS= read -r -d '' file; do
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        local size_kb=$((size / 1024))
        local filename=$(basename "$file")
        
        page_count=$((page_count + 1))
        
        if [ $page_count -le 5 ]; then
            echo "  📃 $filename: ${size_kb}KB"
        fi
    done < <(find "$pages_dir" -type f \( -name "*.html" -o -name "*.json" \) -print0 | head -z -5)
    
    echo "  Total pages: $page_count"
}

# Function to check for duplicates
check_duplicates() {
    echo ""
    echo "🔎 Checking for duplicate dependencies..."
    
    cd "$(dirname "$BUILD_DIR")/.."
    
    if command -v pnpm &> /dev/null; then
        local duplicates=$(pnpm list --depth=0 2>/dev/null | grep -c "dependencies" || echo "0")
        echo "  Found $duplicates package groups"
        
        # Check for common duplicate issues
        echo ""
        echo "💡 Run these commands to investigate:"
        echo "  pnpm why react"
        echo "  pnpm why lodash"
        echo "  pnpm dedupe"
    else
        echo "  pnpm not found, skipping"
    fi
}

# Function to generate recommendations
generate_recommendations() {
    echo ""
    echo "📋 Optimization Recommendations:"
    echo ""
    echo "1. Dynamic Imports:"
    echo "   import dynamic from 'next/dynamic';"
    echo "   const Chart = dynamic(() => import('./Chart'), { ssr: false });"
    echo ""
    echo "2. Bundle Analyzer:"
    echo "   ANALYZE=true pnpm --filter web build"
    echo ""
    echo "3. Tree Shaking Check:"
    echo "   Review package.json 'sideEffects' field"
    echo ""
    echo "4. Dependency Audit:"
    echo "   pnpm audit"
    echo "   npx depcheck"
}

# Main execution
main() {
    analyze_bundle
    analyze_pages
    check_duplicates
    generate_recommendations
    
    echo ""
    echo "✅ Bundle audit complete"
}

main "$@"
