# 🚀 Automation Scripts

This directory contains helper scripts to automate common tasks for the Infamous Freight Enterprises repository.

---

## 📜 Available Scripts

### 1. **github-actions-metrics.sh**

Analyzes GitHub Actions usage and costs.

**Purpose:** Track workflow runs, calculate costs, and project monthly usage  
**Usage:**

```bash
./scripts/github-actions-metrics.sh [days]
```

**What it does:**

- Fetches workflow runs from last N days (default: 30)
- Calculates total runs, success rate, total minutes
- Projects monthly cost based on GitHub Actions pricing
- Compares against free tier limits (2000 min/month)
- Outputs JSON for further analysis

**Requirements:** GitHub CLI (`gh`) installed

---

### 2. **trigger-metrics-collection.sh** 🆕

Triggers the automated metrics collection workflow.

**Purpose:** Manually start metrics collection for the dashboard  
**Usage:**

```bash
./scripts/trigger-metrics-collection.sh
```

**What it does:**

- Triggers `collect-metrics.yml` workflow via GitHub API
- Fetches last 30 days of workflow data
- Calculates success rates and statistics
- Saves to `docs/metrics/workflow-data.json`
- Updates real-time analytics dashboard

**Requirements:** GitHub CLI (`gh`) installed  
**Alternative:** Trigger manually in GitHub Actions UI

---

### 3. **setup-github-pages.sh** 🆕

Helps set up GitHub Pages for the analytics dashboard.

**Purpose:** Enable public hosting of the workflow analytics dashboard  
**Usage:**

```bash
./scripts/setup-github-pages.sh
```

**What it does:**

- Checks if GitHub Pages is enabled
- Provides manual setup instructions
- Validates required files (dashboard, metrics)
- Shows expected dashboard URL

**Result:** Dashboard accessible at `https://mrmiless44.github.io/Infamous-freight-enterprises/workflows-dashboard.html`

**Requirements:** None (provides instructions)  
**Optional:** GitHub CLI (`gh`) for automated checks

---

### 4. **publish-to-marketplace.sh** 🆕

Interactive helper for publishing custom actions to GitHub Marketplace.

**Purpose:** Streamline the marketplace publishing process  
**Usage:**

```bash
./scripts/publish-to-marketplace.sh
```

**Features:**

- Validate action files (action.yml, README.md)
- Create semantic version tags
- Show publishing checklist
- Provide step-by-step instructions

**Actions available:**

- `health-check`: Health Check with Retries
- `performance-baseline`: Performance Regression Detection

**Interactive menu:**

1. Validate all actions
2. Create release tag for an action
3. Show publishing checklist
4. Exit

**See also:** [MARKETPLACE_PUBLISHING_GUIDE.md](../.github/MARKETPLACE_PUBLISHING_GUIDE.md)

---

## 🔧 Setup Instructions

### Make scripts executable

```bash
chmod +x scripts/*.sh
```

### Install GitHub CLI (if needed)

**macOS:**

```bash
brew install gh
```

**Linux:**

```bash
# Debian/Ubuntu
sudo apt install gh

# Other distributions
# See: https://github.com/cli/cli/blob/trunk/docs/install_linux.md
```

**Authenticate:**

```bash
gh auth login
```

---

## 📋 Quick Start Workflows

### First-time Setup

```bash
# 1. Enable GitHub Pages
./scripts/setup-github-pages.sh

# 2. Collect initial metrics
./scripts/trigger-metrics-collection.sh

# 3. Wait 2-3 minutes for workflow to complete

# 4. Open dashboard
open docs/workflows-dashboard.html
# or visit: https://mrmiless44.github.io/Infamous-freight-enterprises/workflows-dashboard.html
```

### Regular Monitoring

```bash
# Check monthly usage and costs
./scripts/github-actions-metrics.sh 30

# Manually trigger metrics update (runs every 6 hours automatically)
./scripts/trigger-metrics-collection.sh
```

### Publishing Actions

```bash
# Run interactive publishing helper
./scripts/publish-to-marketplace.sh

# Or manually:
# 1. Validate action
# 2. Create tag: git tag -a health-check-v1.0.0 -m "Release v1.0.0"
# 3. Push tag: git push origin health-check-v1.0.0
# 4. Create release in GitHub UI with marketplace option
```

---

## 📊 Script Dependencies

| Script                          | Requires `gh` CLI | Can Run Without              |
| ------------------------------- | ----------------- | ---------------------------- |
| `github-actions-metrics.sh`     | ✅ Required       | ❌                           |
| `trigger-metrics-collection.sh` | ✅ Required       | ⚠️ Shows manual instructions |
| `setup-github-pages.sh`         | ℹ️ Optional       | ✅ Provides manual steps     |
| `publish-to-marketplace.sh`     | ℹ️ Optional       | ✅ Manual tagging            |

---

## 🆘 Troubleshooting

### GitHub CLI not found

```bash
# Install gh CLI (see setup instructions above)
# Or use alternative methods shown in script output
```

### Permission denied

```bash
chmod +x scripts/<script-name>.sh
```

### Metrics collection fails

```bash
# Check GitHub Actions permissions
# Verify workflow file: .github/workflows/collect-metrics.yml
# Check Actions tab for error logs
```

### Dashboard shows mock data

```bash
# Ensure metrics have been collected:
ls -la docs/metrics/workflow-data.json

# If file doesn't exist, trigger collection:
./scripts/trigger-metrics-collection.sh
```

---

## 🔗 Related Documentation

- [Workflow Guide](../.github/WORKFLOW_GUIDE.md) - All workflows documented
- [Metrics Guide](../.github/METRICS.md) - Cost tracking and metrics
- [Marketplace Publishing Guide](../.github/MARKETPLACE_PUBLISHING_GUIDE.md) - Detailed publishing instructions
- [Advanced Features Complete](../.github/ADVANCED_FEATURES_COMPLETE.md) - Implementation summary

---

## 💡 Tips

- Run `github-actions-metrics.sh` monthly for cost tracking
- Metrics collection runs automatically every 6 hours (cron schedule)
- Dashboard updates automatically when new metrics are committed
- Use `setup-github-pages.sh` for one-time Pages enablement
- Keep scripts executable: `chmod +x scripts/*.sh`

---

**Last Updated:** December 31, 2025  
**Maintained by:** DevOps Team

Need help? Check the [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) or create an issue using our [issue templates](../.github/ISSUE_TEMPLATE/).
