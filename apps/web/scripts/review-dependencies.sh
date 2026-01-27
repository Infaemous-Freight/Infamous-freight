#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Dependency Tree Review & Cleanup Automation

set -e

PROJECT_ROOT="${1:-.}"
REPORT_FILE="${REPORT_FILE:-/tmp/dependency-review.md}"

echo "🌳 Dependency Tree Review"
echo "========================================"
echo "Project: $PROJECT_ROOT"
echo ""

cd "$PROJECT_ROOT"

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Install with: npm install -g pnpm"
    exit 1
fi

# Initialize report
cat > "$REPORT_FILE" << 'EOF'
# Dependency Review Report

Generated: $(date)

## Executive Summary

EOF

# Function to check for outdated packages
check_outdated() {
    echo "🔍 Checking for outdated packages..."
    
    local outdated=$(pnpm outdated 2>/dev/null || echo "")
    
    if [ -z "$outdated" ]; then
        echo "  ✅ All packages up to date"
        echo "" >> "$REPORT_FILE"
        echo "### Outdated Packages" >> "$REPORT_FILE"
        echo "✅ All packages are up to date" >> "$REPORT_FILE"
    else
        echo "  ⚠️  Found outdated packages"
        echo "$outdated" | head -10
        echo "" >> "$REPORT_FILE"
        echo "### Outdated Packages" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "$outdated" | head -20 >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
    fi
    echo ""
}

# Function to find duplicate dependencies
check_duplicates() {
    echo "🔎 Checking for duplicate dependencies..."
    
    # Common packages that often have duplicates
    local common_deps=("react" "react-dom" "lodash" "axios" "date-fns" "typescript")
    local found_duplicates=false
    
    echo "" >> "$REPORT_FILE"
    echo "### Duplicate Dependencies" >> "$REPORT_FILE"
    
    for dep in "${common_deps[@]}"; do
        local versions=$(pnpm why "$dep" 2>/dev/null | grep -c "$dep@" || echo "0")
        
        if [ "$versions" -gt 1 ]; then
            echo "  ⚠️  $dep: $versions versions"
            echo "- ⚠️  \`$dep\`: $versions versions found" >> "$REPORT_FILE"
            found_duplicates=true
        fi
    done
    
    if [ "$found_duplicates" = false ]; then
        echo "  ✅ No critical duplicates found"
        echo "✅ No critical duplicates detected" >> "$REPORT_FILE"
    fi
    echo ""
}

# Function to analyze bundle impact
analyze_bundle_impact() {
    echo "📦 Analyzing bundle impact..."
    
    echo "" >> "$REPORT_FILE"
    echo "### Heavy Dependencies" >> "$REPORT_FILE"
    
    # Check for large packages
    local heavy_packages=(
        "moment:500KB:Use date-fns or day.js instead"
        "lodash:70KB:Import specific functions only"
        "axios:15KB:Consider native fetch API"
        "recharts:400KB:Lazy load with dynamic import"
    )
    
    for pkg_info in "${heavy_packages[@]}"; do
        IFS=':' read -r pkg size recommendation <<< "$pkg_info"
        
        if pnpm list "$pkg" &>/dev/null; then
            echo "  📊 $pkg found ($size) - $recommendation"
            echo "- 📊 \`$pkg\` ($size) - $recommendation" >> "$REPORT_FILE"
        fi
    done
    echo ""
}

# Function to check security vulnerabilities
check_security() {
    echo "🔒 Running security audit..."
    
    echo "" >> "$REPORT_FILE"
    echo "### Security Audit" >> "$REPORT_FILE"
    
    local audit_output=$(pnpm audit --json 2>/dev/null || echo '{"vulnerabilities":{}}')
    local vulnerabilities=$(echo "$audit_output" | grep -o '"high":[0-9]*' | head -1 | cut -d: -f2 || echo "0")
    
    if [ "$vulnerabilities" = "0" ]; then
        echo "  ✅ No high-severity vulnerabilities"
        echo "✅ No high-severity vulnerabilities detected" >> "$REPORT_FILE"
    else
        echo "  ⚠️  Found $vulnerabilities high-severity vulnerabilities"
        echo "⚠️  Found $vulnerabilities high-severity vulnerabilities" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "Run \`pnpm audit\` for details" >> "$REPORT_FILE"
    fi
    echo ""
}

# Function to generate cleanup recommendations
generate_recommendations() {
    echo "💡 Generating recommendations..."
    
    echo "" >> "$REPORT_FILE"
    echo "### Recommended Actions" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "#### Immediate Actions" >> "$REPORT_FILE"
    echo "1. Run \`pnpm dedupe\` to remove duplicate packages" >> "$REPORT_FILE"
    echo "2. Update critical security patches with \`pnpm update\`" >> "$REPORT_FILE"
    echo "3. Review and remove unused dependencies with \`npx depcheck\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "#### Long-term Optimizations" >> "$REPORT_FILE"
    echo "1. Replace heavy packages (see Heavy Dependencies section)" >> "$REPORT_FILE"
    echo "2. Set up automated dependency updates (Dependabot/Renovate)" >> "$REPORT_FILE"
    echo "3. Implement bundle size monitoring in CI/CD" >> "$REPORT_FILE"
    echo "4. Use \`pnpm why <package>\` to understand dependency chains" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "  ✅ Recommendations added to report"
}

# Function to check for unused dependencies
check_unused() {
    echo "🧹 Checking for unused dependencies..."
    
    if command -v depcheck &> /dev/null; then
        echo "  Running depcheck..."
        local unused=$(npx depcheck --json 2>/dev/null | grep -c '"dependencies"' || echo "0")
        
        echo "" >> "$REPORT_FILE"
        echo "### Unused Dependencies" >> "$REPORT_FILE"
        
        if [ "$unused" = "0" ]; then
            echo "  ✅ No unused dependencies detected"
            echo "✅ All dependencies appear to be in use" >> "$REPORT_FILE"
        else
            echo "  ⚠️  Found potentially unused dependencies"
            echo "⚠️  Run \`npx depcheck\` for full report" >> "$REPORT_FILE"
        fi
    else
        echo "  ℹ️  Install depcheck for unused dependency analysis: pnpm add -D depcheck"
        echo "" >> "$REPORT_FILE"
        echo "### Unused Dependencies" >> "$REPORT_FILE"
        echo "ℹ️  Install \`depcheck\` to analyze unused dependencies" >> "$REPORT_FILE"
    fi
    echo ""
}

# Function to show workspace analysis
analyze_workspace() {
    echo "🏗️  Analyzing workspace structure..."
    
    echo "" >> "$REPORT_FILE"
    echo "### Workspace Analysis" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Count packages
    local workspaces=$(find . -name "package.json" -not -path "*/node_modules/*" | wc -l)
    echo "  📦 Found $workspaces package.json files"
    echo "- Total packages: $workspaces" >> "$REPORT_FILE"
    
    # Shared dependencies
    echo "- Monorepo structure detected" >> "$REPORT_FILE"
    echo "- Consider using workspace: protocol for internal deps" >> "$REPORT_FILE"
    echo ""
}

# Main execution
main() {
    echo "Starting dependency review..."
    echo ""
    
    check_outdated
    check_duplicates
    analyze_bundle_impact
    check_security
    check_unused
    analyze_workspace
    generate_recommendations
    
    echo "========================================"
    echo "✅ Dependency review complete"
    echo "📄 Full report: $REPORT_FILE"
    echo ""
    echo "Quick commands:"
    echo "  pnpm dedupe          # Remove duplicates"
    echo "  pnpm update          # Update packages"
    echo "  npx depcheck         # Find unused deps"
    echo "  pnpm audit --fix     # Auto-fix vulnerabilities"
    echo ""
    
    # Show report preview
    echo "Report preview:"
    head -30 "$REPORT_FILE"
    echo "..."
    echo ""
    echo "View full report: cat $REPORT_FILE"
}

main "$@"
