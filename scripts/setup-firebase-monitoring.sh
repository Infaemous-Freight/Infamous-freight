#!/bin/bash
# Setup Firebase Monitoring and Alerts
# Configures monitoring dashboards and alert rules

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Firebase Monitoring Setup${NC}"
echo "===================================="
echo ""

# Check Firebase project
if [ ! -f ".firebaserc" ]; then
    echo -e "${RED}✗ .firebaserc not found${NC}"
    echo "Please run ./scripts/setup-firebase-production.sh first"
    exit 1
fi

PROJECT_ID=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4)
echo "Project: $PROJECT_ID"
echo ""

# Create monitoring configuration directory
mkdir -p monitoring/firebase

# Create Firebase alerts configuration
echo "Creating alert configurations..."

cat > monitoring/firebase/alerts.yaml <<'EOF'
# Firebase Monitoring Alerts Configuration
# Import these rules in Firebase Console → Monitoring → Alerts

alerts:
  # Firestore Alerts
  - name: "High Firestore Read Rate"
    condition: "firestore_reads_per_minute > 1000"
    severity: "warning"
    notification_channels:
      - email
      - slack
    description: "Firestore read rate exceeding 1000/min - may impact quota"
    
  - name: "High Firestore Write Rate"
    condition: "firestore_writes_per_minute > 500"
    severity: "warning"
    notification_channels:
      - email
    description: "Firestore write rate exceeding 500/min - check for loops"
    
  - name: "Firestore Quota Exceeded"
    condition: "firestore_quota_usage > 90"
    severity: "critical"
    notification_channels:
      - email
      - slack
      - pagerduty
    description: "Approaching Firestore quota limit - upgrade plan or optimize"

  # Cloud Messaging Alerts
  - name: "High FCM Failure Rate"
    condition: "fcm_failure_rate > 10"
    severity: "warning"
    notification_channels:
      - email
      - slack
    description: "More than 10% of push notifications failing"
    
  - name: "FCM Delivery Issues"
    condition: "fcm_delivered_count < 50 AND fcm_sent_count > 100"
    severity: "critical"
    notification_channels:
      - email
      - slack
    description: "Push notifications not being delivered - check configuration"

  # Storage Alerts
  - name: "High Storage Usage"
    condition: "storage_usage_gb > 800"
    severity: "warning"
    notification_channels:
      - email
    description: "Storage approaching 1TB limit"
    
  - name: "Storage Upload Failures"
    condition: "storage_upload_failure_rate > 5"
    severity: "warning"
    notification_channels:
      - email
      - slack
    description: "More than 5% of file uploads failing"

  # Authentication Alerts
  - name: "High Failed Login Rate"
    condition: "auth_failed_logins_per_minute > 50"
    severity: "critical"
    notification_channels:
      - email
      - slack
      - pagerduty
    description: "Possible brute force attack - investigate immediately"
    
  - name: "Unusual Signup Activity"
    condition: "auth_new_users_per_hour > 100"
    severity: "warning"
    notification_channels:
      - email
    description: "Unusual number of new signups - check for bots"

  # Cost Alerts
  - name: "Daily Cost Exceeds Budget"
    condition: "daily_cost_usd > 10"
    severity: "warning"
    notification_channels:
      - email
      - slack
    description: "Daily Firebase costs exceeding $10 - review usage"
    
  - name: "Monthly Cost Warning"
    condition: "monthly_cost_usd > 250"
    severity: "critical"
    notification_channels:
      - email
      - slack
    description: "Monthly costs approaching budget limit"

notification_channels:
  email:
    - ops@infamousfreight.com
    - devops@infamousfreight.com
  
  slack:
    webhook_url: "${SLACK_WEBHOOK_URL}"
    channel: "#firebase-alerts"
  
  pagerduty:
    integration_key: "${PAGERDUTY_INTEGRATION_KEY}"
EOF

echo -e "${GREEN}✓ Alert configuration created${NC}"

# Create monitoring dashboard configuration
echo ""
echo "Creating dashboard configuration..."

cat > monitoring/firebase/dashboard.json <<'EOF'
{
  "displayName": "Infamous Freight - Firebase Production Dashboard",
  "dashboardFilters": [],
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Push Notification Delivery Rate",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "metric.type=\"firebase.com/messaging/sent\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE"
                    }
                  }
                },
                "plotType": "LINE"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Messages/sec",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Firestore Operations",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "metric.type=\"firestore.googleapis.com/document/read_count\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE"
                    }
                  }
                },
                "plotType": "LINE",
                "targetAxis": "Y1"
              },
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "metric.type=\"firestore.googleapis.com/document/write_count\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE"
                    }
                  }
                },
                "plotType": "LINE",
                "targetAxis": "Y1"
              }
            ]
          }
        }
      },
      {
        "width": 4,
        "height": 4,
        "widget": {
          "title": "Active Users (Auth)",
          "scorecard": {
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"firebase.com/auth/user/count\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_MEAN"
                }
              }
            }
          }
        }
      },
      {
        "width": 4,
        "height": 4,
        "widget": {
          "title": "Storage Usage (GB)",
          "scorecard": {
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"firebase.com/storage/total_bytes\"",
                "aggregation": {
                  "alignmentPeriod": "3600s",
                  "perSeriesAligner": "ALIGN_MEAN"
                }
              }
            }
          }
        }
      },
      {
        "width": 4,
        "height": 4,
        "widget": {
          "title": "Daily Cost (USD)",
          "scorecard": {
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"firebase.com/billing/daily_cost\"",
                "aggregation": {
                  "alignmentPeriod": "86400s",
                  "perSeriesAligner": "ALIGN_SUM"
                }
              }
            }
          }
        }
      }
    ]
  }
}
EOF

echo -e "${GREEN}✓ Dashboard configuration created${NC}"

# Create log-based metrics
echo ""
echo "Creating log-based metrics configuration..."

cat > monitoring/firebase/log-metrics.yaml <<'EOF'
# Firebase Log-Based Metrics
# Create these in Cloud Logging → Logs Router → Create Metric

metrics:
  - name: "firebase_notification_sent"
    description: "Count of push notifications sent"
    filter: 'resource.type="cloud_function" AND textPayload=~"Push notification sent"'
    metric_type: "counter"
    
  - name: "firebase_notification_failed"
    description: "Count of failed push notifications"
    filter: 'resource.type="cloud_function" AND severity="ERROR" AND textPayload=~"Failed to send"'
    metric_type: "counter"
    
  - name: "firebase_token_registered"
    description: "Count of device tokens registered"
    filter: 'resource.type="cloud_function" AND textPayload=~"Push token registered"'
    metric_type: "counter"
    
  - name: "firebase_api_latency"
    description: "Firebase API call latency"
    filter: 'resource.type="cloud_function" AND textPayload=~"duration"'
    metric_type: "distribution"
    value_extractor: 'EXTRACT(jsonPayload.duration)'
EOF

echo -e "${GREEN}✓ Log metrics configuration created${NC}"

# Create Firebase emulator configuration for local testing
echo ""
echo "Creating emulator configuration..."

cat > firebase.emulator.json <<'EOF'
{
  "emulators": {
    "auth": {
      "host": "localhost",
      "port": 9099
    },
    "firestore": {
      "host": "localhost",
      "port": 8080
    },
    "storage": {
      "host": "localhost",
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "host": "localhost",
      "port": 4000
    }
  }
}
EOF

echo -e "${GREEN}✓ Emulator configuration created${NC}"

# Create monitoring script
echo ""
echo "Creating monitoring script..."

cat > scripts/monitor-firebase.sh <<'SCRIPT'
#!/bin/bash
# Monitor Firebase metrics in real-time

PROJECT_ID=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4)

echo "Firebase Monitoring - $PROJECT_ID"
echo "=================================="
echo ""
echo "Opening dashboards..."
echo ""
echo "1. Firebase Console:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID"
echo ""
echo "2. Cloud Monitoring:"
echo "   https://console.cloud.google.com/monitoring/dashboards?project=$PROJECT_ID"
echo ""
echo "3. Cloud Logging:"
echo "   https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
echo ""
echo "Quick metrics:"
echo ""

# Check if gcloud is installed
if command -v gcloud &> /dev/null; then
    echo "Fetching recent metrics..."
    gcloud logging read "resource.type=cloud_function" --limit 10 --project="$PROJECT_ID" --format="table(timestamp,severity,textPayload)" 2>/dev/null || echo "Run 'gcloud auth login' to fetch metrics"
else
    echo "Install gcloud CLI to fetch metrics from terminal"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
fi

echo ""
echo "Press Ctrl+C to exit"
SCRIPT

chmod +x scripts/monitor-firebase.sh

echo -e "${GREEN}✓ Monitoring script created${NC}"

# Instructions
echo ""
echo "===================================="
echo -e "${GREEN}✓ Monitoring Setup Complete!${NC}"
echo "===================================="
echo ""
echo "Configuration files created in monitoring/firebase/:"
echo "  • alerts.yaml - Alert rules"
echo "  • dashboard.json - Monitoring dashboard"
echo "  • log-metrics.yaml - Log-based metrics"
echo ""
echo "Next steps:"
echo ""
echo "1. Set up alerts in Firebase Console:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID/monitoring"
echo ""
echo "2. Import dashboard:"
echo "   https://console.cloud.google.com/monitoring/dashboards?project=$PROJECT_ID"
echo "   Click 'Create Dashboard' → Import from JSON"
echo "   Use: monitoring/firebase/dashboard.json"
echo ""
echo "3. Configure notification channels:"
echo "   - Email: ops@infamousfreight.com"
echo "   - Slack webhook: Set SLACK_WEBHOOK_URL environment variable"
echo "   - PagerDuty: Set PAGERDUTY_INTEGRATION_KEY environment variable"
echo ""
echo "4. Start monitoring:"
echo "   ./scripts/monitor-firebase.sh"
echo ""
echo "5. Test locally with Firebase emulator:"
echo "   firebase emulators:start"
echo ""
