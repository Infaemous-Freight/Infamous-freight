#!/bin/bash
# GitHub Actions Cost Tracking Script
# Collects metrics about workflow runs for cost analysis

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DAYS_BACK=${1:-30}
OUTPUT_FILE="github-actions-metrics.json"

echo -e "${BLUE}📊 Collecting GitHub Actions metrics for last ${DAYS_BACK} days...${NC}"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo -e "${GREEN}📦 Repository: ${REPO}${NC}"

# Calculate date threshold
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    DATE_THRESHOLD=$(date -v-${DAYS_BACK}d -u +"%Y-%m-%dT%H:%M:%SZ")
else
    # Linux
    DATE_THRESHOLD=$(date -d "${DAYS_BACK} days ago" -u +"%Y-%m-%dT%H:%M:%SZ")
fi

echo -e "${BLUE}📅 Collecting runs since: ${DATE_THRESHOLD}${NC}"

# Collect workflow runs
echo -e "${BLUE}🔍 Fetching workflow runs...${NC}"
gh run list \
    --limit 1000 \
    --json name,status,conclusion,durationMs,createdAt,workflowName \
    --created ">${DATE_THRESHOLD}" \
    > "$OUTPUT_FILE"

# Parse and analyze data
echo -e "${BLUE}📈 Analyzing data...${NC}"

# Count total runs
TOTAL_RUNS=$(jq 'length' "$OUTPUT_FILE")

# Count by status
SUCCESS_COUNT=$(jq '[.[] | select(.conclusion=="success")] | length' "$OUTPUT_FILE")
FAILURE_COUNT=$(jq '[.[] | select(.conclusion=="failure")] | length' "$OUTPUT_FILE")
CANCELLED_COUNT=$(jq '[.[] | select(.conclusion=="cancelled")] | length' "$OUTPUT_FILE")

# Calculate success rate
if [ "$TOTAL_RUNS" -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($SUCCESS_COUNT / $TOTAL_RUNS) * 100}")
else
    SUCCESS_RATE="0"
fi

# Calculate total duration in minutes
TOTAL_DURATION_MS=$(jq '[.[].durationMs // 0] | add' "$OUTPUT_FILE")
TOTAL_MINUTES=$(awk "BEGIN {printf \"%.0f\", $TOTAL_DURATION_MS / 60000}")

# Get average duration
if [ "$TOTAL_RUNS" -gt 0 ]; then
    AVG_DURATION=$(awk "BEGIN {printf \"%.1f\", $TOTAL_MINUTES / $TOTAL_RUNS}")
else
    AVG_DURATION="0"
fi

# Group by workflow
echo -e "${BLUE}📊 Workflow breakdown:${NC}"
jq -r '.[] | .workflowName' "$OUTPUT_FILE" | sort | uniq -c | sort -rn | while read count workflow; do
    # Calculate minutes for this workflow
    WORKFLOW_DURATION_MS=$(jq "[.[] | select(.workflowName==\"$workflow\") | .durationMs // 0] | add" "$OUTPUT_FILE")
    WORKFLOW_MINUTES=$(awk "BEGIN {printf \"%.0f\", $WORKFLOW_DURATION_MS / 60000}")
    AVG_WORKFLOW_DURATION=$(awk "BEGIN {printf \"%.1f\", $WORKFLOW_MINUTES / $count}")
    
    echo -e "  ${GREEN}$workflow${NC}"
    echo -e "    Runs: $count"
    echo -e "    Total: ${WORKFLOW_MINUTES} minutes"
    echo -e "    Avg: ${AVG_WORKFLOW_DURATION} minutes"
done

# Display summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}📊 GitHub Actions Metrics Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}Repository:${NC} $REPO"
echo -e "  ${YELLOW}Period:${NC} Last $DAYS_BACK days"
echo ""
echo -e "${GREEN}Workflow Runs:${NC}"
echo -e "  Total: ${TOTAL_RUNS}"
echo -e "  ${GREEN}✅ Success: ${SUCCESS_COUNT}${NC}"
echo -e "  ${RED}❌ Failed: ${FAILURE_COUNT}${NC}"
echo -e "  ${YELLOW}⚠️  Cancelled: ${CANCELLED_COUNT}${NC}"
echo -e "  ${GREEN}Success Rate: ${SUCCESS_RATE}%${NC}"
echo ""
echo -e "${GREEN}Action Minutes:${NC}"
echo -e "  Total: ${BLUE}${TOTAL_MINUTES} minutes${NC}"
echo -e "  Average per run: ${AVG_DURATION} minutes"
echo ""

# Cost estimation (GitHub free tier: 2000 minutes/month)
FREE_TIER=2000
MONTHLY_ESTIMATE=$(awk "BEGIN {printf \"%.0f\", $TOTAL_MINUTES * (30 / $DAYS_BACK)}")

echo -e "${GREEN}Monthly Estimate:${NC}"
echo -e "  Projected: ${BLUE}${MONTHLY_ESTIMATE} minutes/month${NC}"
echo -e "  Free tier limit: ${FREE_TIER} minutes/month"

if [ "$MONTHLY_ESTIMATE" -lt "$FREE_TIER" ]; then
    PERCENTAGE=$(awk "BEGIN {printf \"%.1f\", ($MONTHLY_ESTIMATE / $FREE_TIER) * 100}")
    echo -e "  ${GREEN}✅ Within free tier (${PERCENTAGE}%)${NC}"
elif [ "$MONTHLY_ESTIMATE" -lt $((FREE_TIER * 2)) ]; then
    OVERAGE=$((MONTHLY_ESTIMATE - FREE_TIER))
    echo -e "  ${YELLOW}⚠️  Approaching limit (+${OVERAGE} minutes)${NC}"
else
    OVERAGE=$((MONTHLY_ESTIMATE - FREE_TIER))
    echo -e "  ${RED}❌ Exceeding free tier (+${OVERAGE} minutes)${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Metrics saved to: ${OUTPUT_FILE}${NC}"
echo ""

# Recommendations
echo -e "${YELLOW}💡 Recommendations:${NC}"
if [ "$SUCCESS_RATE" -lt "90" ]; then
    echo -e "  ${RED}• Success rate is below 90%. Review failed workflows.${NC}"
fi
if [ "$MONTHLY_ESTIMATE" -gt $((FREE_TIER * 80 / 100)) ]; then
    echo -e "  ${YELLOW}• Consider optimizing workflows to reduce minutes.${NC}"
fi
if [ "$AVG_DURATION" -gt "15" ]; then
    echo -e "  ${YELLOW}• Average duration >15min. Look for optimization opportunities.${NC}"
fi

echo ""
echo -e "${BLUE}📚 For detailed analysis, see: .github/METRICS.md${NC}"
echo ""
