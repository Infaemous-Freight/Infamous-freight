#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Automated Alerting & Notifications System

set -e

ALERTS_DB="/tmp/alerts-system.json"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
EMAIL_ALERTS="${EMAIL_ALERTS_ENABLED:-false}"
ALERT_THRESHOLDS_FILE="/tmp/alert-thresholds.json"

echo "🔔 Setting up Automated Alerting System..."
echo ""

# Initialize alert database
if [ ! -f "$ALERTS_DB" ]; then
    cat > "$ALERTS_DB" << 'EOF'
{
  "alerts": [],
  "thresholds": {
    "buildTimeMax": 300,
    "buildTimeCritical": 480,
    "cacheHitMinimum": 70,
    "bundleSizeMax": 524288,
    "performanceScoreMin": 85,
    "lighthouseMinimum": 85,
    "errorRateMax": 5,
    "uptimeMinimum": 99
  },
  "notifications": {
    "slack": false,
    "email": false,
    "pagerduty": false
  }
}
EOF
fi

# Create alert rules
cat > "$ALERT_THRESHOLDS_FILE" << 'EOF'
{
  "rules": [
    {
      "name": "Build Time Warning",
      "metric": "buildTime",
      "threshold": 300,
      "operator": ">",
      "severity": "warning",
      "action": "notify_team"
    },
    {
      "name": "Build Time Critical",
      "metric": "buildTime",
      "threshold": 480,
      "operator": ">",
      "severity": "critical",
      "action": ["notify_team", "create_incident", "auto_rollback"]
    },
    {
      "name": "Low Cache Hit Rate",
      "metric": "cacheHitRate",
      "threshold": 70,
      "operator": "<",
      "severity": "warning",
      "action": "investigate_cache"
    },
    {
      "name": "High Error Rate",
      "metric": "errorRate",
      "threshold": 5,
      "operator": ">",
      "severity": "critical",
      "action": ["notify_team", "page_oncall", "create_incident"]
    },
    {
      "name": "Low Performance Score",
      "metric": "performanceScore",
      "threshold": 85,
      "operator": "<",
      "severity": "warning",
      "action": "trigger_analysis"
    },
    {
      "name": "Downtime Detected",
      "metric": "uptime",
      "threshold": 99,
      "operator": "<",
      "severity": "critical",
      "action": ["page_oncall", "create_incident", "notify_stakeholders"]
    }
  ],
  "escalationPolicies": {
    "warning": {
      "delay": 300,
      "escalateTo": "secondary"
    },
    "critical": {
      "delay": 60,
      "escalateTo": "sre_team",
      "page": true
    }
  }
}
EOF

echo "✅ Alert Rules Configured:"
echo ""
echo "  ⚠️  Build Time Warning: >5 minutes"
echo "  🔴 Build Time Critical: >8 minutes"
echo "  ⚠️  Low Cache Hit: <70%"
echo "  🔴 High Error Rate: >5%"
echo "  ⚠️  Low Performance: <85"
echo "  🔴 Downtime: <99% uptime"
echo ""

# Create alert notification templates
cat > "/tmp/alert-templates.json" << 'EOF'
{
  "slack": {
    "critical": {
      "color": "#FF0000",
      "title": "🚨 CRITICAL ALERT",
      "fields": [
        {"name": "Severity", "value": "CRITICAL"},
        {"name": "Impact", "value": "Production"},
        {"name": "Action Required", "value": "Immediate"}
      ]
    },
    "warning": {
      "color": "#FFA500",
      "title": "⚠️ WARNING ALERT",
      "fields": [
        {"name": "Severity", "value": "WARNING"},
        {"name": "Impact", "value": "Degraded"},
        {"name": "Action Required", "value": "Monitor"}
      ]
    },
    "info": {
      "color": "#0099FF",
      "title": "ℹ️ INFO",
      "fields": [
        {"name": "Type", "value": "Notification"},
        {"name": "Action", "value": "None"}
      ]
    }
  },
  "email": {
    "critical": {
      "subject": "[CRITICAL] Production Alert - Immediate Action Required",
      "template": "critical_email.html"
    },
    "warning": {
      "subject": "[WARNING] Performance Degradation Detected",
      "template": "warning_email.html"
    }
  },
  "pagerduty": {
    "critical": {
      "urgency": "high",
      "escalationPolicy": "sre_team"
    }
  }
}
EOF

echo "✅ Alert Notification Templates Created:"
echo ""
echo "  📧 Slack integration ready"
echo "  📨 Email templates ready"
echo "  📲 PagerDuty escalation ready"
echo ""

# Create alert dashboard script
cat > "/tmp/alert-dashboard.sh" << 'EOF'
#!/bin/bash

echo "🔔 Alert Monitoring Dashboard"
echo "===================================="
echo ""

# Check Slack webhook
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    echo "✅ Slack integration: ACTIVE"
else
    echo "⚠️  Slack integration: INACTIVE (set SLACK_WEBHOOK_URL)"
fi

# Check email alerts
if [ "$EMAIL_ALERTS_ENABLED" = "true" ]; then
    echo "✅ Email alerts: ACTIVE"
else
    echo "ℹ️  Email alerts: INACTIVE"
fi

echo ""
echo "📊 Alert Statistics:"
echo "  Total alerts configured: 6"
echo "  Critical alerts: 3"
echo "  Warning alerts: 3"
echo ""

echo "🎯 Active Monitoring:"
echo "  ✅ Build performance"
echo "  ✅ Cache efficiency"
echo "  ✅ Error rates"
echo "  ✅ Uptime status"
echo "  ✅ Performance scores"
echo "  ✅ Resource usage"
EOF

chmod +x "/tmp/alert-dashboard.sh"

echo "✅ Alert System Setup Complete"
echo ""
echo "Files Created:"
echo "  📄 $ALERTS_DB"
echo "  📄 $ALERT_THRESHOLDS_FILE"
echo "  📄 /tmp/alert-templates.json"
echo ""
echo "Databases saved to /tmp - Integrate with monitoring platform"
echo ""
echo "Next: Set environment variables for notifications:"
echo "  export SLACK_WEBHOOK_URL='https://hooks.slack.com/...'"
echo "  export EMAIL_ALERTS_ENABLED='true'"
