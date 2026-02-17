#!/bin/bash

# Marketplace Publishing Helper Script
# This script helps prepare and publish custom actions to GitHub Marketplace

set -e

echo "🚀 GitHub Marketplace Publishing Helper"
echo "========================================"
echo ""

# Configuration
REPO_OWNER="MrMiless44"
REPO_NAME="Infamous-freight-enterprises"
ACTIONS_DIR=".github/actions"

# Action configurations
declare -A ACTIONS
ACTIONS["health-check"]="Health Check with Retries"
ACTIONS["performance-baseline"]="Performance Regression Detection"

echo "📦 Available Actions:"
echo ""
for action in "${!ACTIONS[@]}"; do
    echo "  - $action: ${ACTIONS[$action]}"
done
echo ""

# Function to create a release tag
create_tag() {
    local action=$1
    local version=$2
    local tag="${action}-v${version}"
    
    echo "🏷️  Creating tag: $tag"
    
    git tag -a "$tag" -m "Release $action v${version}

Action: ${ACTIONS[$action]}
Version: v${version}
Date: $(date '+%Y-%m-%d')

See MARKETPLACE_PUBLISHING_GUIDE.md for details."
    
    echo "✅ Tag created: $tag"
    echo ""
    echo "Push tag with: git push origin $tag"
}

# Function to validate action files
validate_action() {
    local action=$1
    local action_path="${ACTIONS_DIR}/${action}"
    
    echo "🔍 Validating action: $action"
    
    # Check if action directory exists
    if [ ! -d "$action_path" ]; then
        echo "❌ Action directory not found: $action_path"
        return 1
    fi
    
    # Check for action.yml
    if [ ! -f "$action_path/action.yml" ]; then
        echo "❌ action.yml not found in $action_path"
        return 1
    fi
    
    # Check for README.md
    if [ ! -f "$action_path/README.md" ]; then
        echo "❌ README.md not found in $action_path"
        return 1
    fi
    
    echo "✅ Action validated successfully"
    return 0
}

# Main menu
echo "What would you like to do?"
echo ""
echo "1. Validate all actions"
echo "2. Create release tag for an action"
echo "3. Show publishing checklist"
echo "4. Exit"
echo ""
read -p "Select option (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📋 Validating all actions..."
        echo ""
        
        for action in "${!ACTIONS[@]}"; do
            validate_action "$action"
            echo ""
        done
        
        echo "✅ Validation complete!"
        ;;
        
    2)
        echo ""
        echo "Select action:"
        select action in "${!ACTIONS[@]}"; do
            if [ -n "$action" ]; then
                break
            fi
        done
        
        echo ""
        read -p "Enter version (e.g., 1.0.0): " version
        
        if [ -z "$version" ]; then
            echo "❌ Version cannot be empty"
            exit 1
        fi
        
        # Validate action first
        if ! validate_action "$action"; then
            echo "❌ Action validation failed"
            exit 1
        fi
        
        echo ""
        create_tag "$action" "$version"
        
        echo ""
        echo "📝 Next steps:"
        echo "   1. Push the tag: git push origin ${action}-v${version}"
        echo "   2. Go to: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/new"
        echo "   3. Select tag: ${action}-v${version}"
        echo "   4. Add release notes"
        echo "   5. Check 'Publish this Action to the GitHub Marketplace'"
        echo "   6. Select categories and publish"
        echo ""
        echo "📖 See: .github/MARKETPLACE_PUBLISHING_GUIDE.md for detailed instructions"
        ;;
        
    3)
        echo ""
        echo "📋 Marketplace Publishing Checklist"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Before Publishing:"
        echo "  [ ] Test action thoroughly in workflows"
        echo "  [ ] Comprehensive README with examples"
        echo "  [ ] All inputs documented with defaults"
        echo "  [ ] All outputs documented"
        echo "  [ ] Troubleshooting section in README"
        echo "  [ ] Branding (icon and color) in action.yml"
        echo "  [ ] No hardcoded secrets or credentials"
        echo ""
        echo "During Release:"
        echo "  [ ] Create semantic version tag (v1.0.0)"
        echo "  [ ] Write clear release notes"
        echo "  [ ] Select appropriate marketplace categories"
        echo "  [ ] Add descriptive marketplace description"
        echo "  [ ] Check 'Publish to GitHub Marketplace'"
        echo ""
        echo "After Publishing:"
        echo "  [ ] Verify action appears in Marketplace"
        echo "  [ ] Test installation from Marketplace"
        echo "  [ ] Monitor for issues and feedback"
        echo "  [ ] Update documentation with marketplace badge"
        echo ""
        echo "📖 Full guide: .github/MARKETPLACE_PUBLISHING_GUIDE.md"
        ;;
        
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
        
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac
