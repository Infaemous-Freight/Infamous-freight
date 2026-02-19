#!/bin/bash
################################################################################
# ⚙️  Setup Cron Automation - Schedule auto-run to execute periodically
#
# Usage: bash scripts/setup-cron.sh
################################################################################

echo "⚙️  Setup Cron Automation"
echo "════════════════════════════════════════════════════════════"
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
else
    OS="Unknown"
fi

echo "System: $OS"
echo ""

# Get current directory
REPO_DIR="$(pwd)"

# Check if we're in the repo
if [ ! -f "package.json" ] || [ ! -f "scripts/auto-run-all.sh" ]; then
    echo "❌ Error: Must be run from repository root"
    exit 1
fi

echo "Repository: $REPO_DIR"
echo ""

# Check if crontab is available
if ! command -v crontab &> /dev/null; then
    echo "⚠️  Crontab not available on this system"
    echo "Manual setup required. Use your system's task scheduler:"
    echo ""
    echo "  Linux (systemd): Use 'systemctl --user' timer"
    echo "  macOS: Use LaunchAgent"
    echo "  Windows: Use Task Scheduler"
    echo ""
    exit 1
fi

echo ""
echo "Supported Cron Schedules:"
echo "────────────────────────────────────────────────────────────"
echo "1. Daily at 2 AM"
echo "2. Every 12 hours"
echo "3. Every 6 hours"
echo "4. Every 4 hours"
echo "5. Every 2 hours"
echo "6. Custom"
echo "7. Skip (manual execution only)"
echo ""

read -p "Choose schedule (1-7): " choice

case $choice in
    1)
        CRON="0 2 * * *"
        DESC="Daily at 2 AM"
        ;;
    2)
        CRON="0 */12 * * *"
        DESC="Every 12 hours"
        ;;
    3)
        CRON="0 */6 * * *"
        DESC="Every 6 hours"
        ;;
    4)
        CRON="0 */4 * * *"
        DESC="Every 4 hours"
        ;;
    5)
        CRON="0 */2 * * *"
        DESC="Every 2 hours"
        ;;
    6)
        read -p "Enter cron expression (e.g., '0 2 * * *'): " CRON
        DESC="Custom: $CRON"
        ;;
    7)
        echo "Skipping cron setup. Run manually with:"
        echo "  bash scripts/auto-run-all.sh"
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Schedule: $DESC"
echo ""

# Get current crontab or create empty
TEMP_CRON=$(mktemp)
crontab -l 2>/dev/null > "$TEMP_CRON" || true

# Check if job already exists
if grep -q "auto-run-all.sh" "$TEMP_CRON"; then
    echo "⚠️  Auto-run job already exists in crontab"
    read -p "Replace existing job? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove old job
        sed -i.bak '/auto-run-all.sh/d' "$TEMP_CRON"
    else
        echo "Aborted"
        rm -f "$TEMP_CRON" "$TEMP_CRON.bak"
        exit 0
    fi
fi

# Add new job
echo "$CRON cd $REPO_DIR && bash scripts/auto-run-all.sh >> .cron-logs.txt 2>&1" >> "$TEMP_CRON"

# Install crontab
crontab "$TEMP_CRON"

echo "✅ Cron job installed!"
echo ""
echo "Details:"
echo "  Schedule: $DESC"
echo "  Command: cd $REPO_DIR && bash scripts/auto-run-all.sh"
echo "  Logs: $REPO_DIR/.cron-logs.txt"
echo ""
echo "To view crontab: crontab -l"
echo "To edit crontab: crontab -e"
echo "To remove job: crontab -l | grep -v auto-run-all.sh | crontab -"
echo ""

# Cleanup
rm -f "$TEMP_CRON" "$TEMP_CRON.bak"

echo "════════════════════════════════════════════════════════════"
echo "✅ Cron automation setup complete!"
