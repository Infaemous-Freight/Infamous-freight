#!/bin/bash

# Trigger Metrics Collection Workflow
# This script triggers the metrics collection workflow manually

echo "🚀 Triggering Metrics Collection Workflow..."
echo ""

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found. Please install it:"
    echo "   https://cli.github.com/"
    echo ""
    echo "Alternative: Trigger manually in GitHub UI:"
    echo "   https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/collect-metrics.yml"
    exit 1
fi

# Trigger the workflow
echo "📊 Dispatching collect-metrics workflow..."
gh workflow run collect-metrics.yml

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Workflow triggered successfully!"
    echo ""
    echo "📈 Monitor progress:"
    echo "   https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/collect-metrics.yml"
    echo ""
    echo "⏱️  The workflow will:"
    echo "   1. Fetch last 30 days of workflow run data"
    echo "   2. Calculate success rates and statistics"
    echo "   3. Save metrics to docs/metrics/workflow-data.json"
    echo "   4. Commit changes to the repository"
    echo ""
    echo "🎯 After completion:"
    echo "   - Open docs/workflows-dashboard.html to view real-time metrics"
    echo "   - Dashboard will automatically use the collected data"
else
    echo ""
    echo "❌ Failed to trigger workflow"
    echo ""
    echo "Try manually:"
    echo "   1. Go to: https://github.com/MrMiless44/Infamous-freight-enterprises/actions"
    echo "   2. Select 'Collect Workflow Metrics'"
    echo "   3. Click 'Run workflow' button"
    exit 1
fi
