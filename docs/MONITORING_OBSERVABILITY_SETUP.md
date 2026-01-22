# Monitoring & Observability Setup Guide

## Quick Start (5 Minutes)

```bash
# 1. Deploy Prometheus
kubectl apply -f monitoring/prometheus-deployment.yml

# 2. Deploy Grafana
kubectl apply -f monitoring/grafana-deployment.yml

# 3. Access Grafana (port-forward)
kubectl port-forward svc/grafana 3000:3000

# 4. Login to http://localhost:3000 (admin/admin)

# 5. Add Prometheus as datasource
# URL: http://prometheus:9090
```

---

## Architecture

```
Your Application
    ↓
API Exports Metrics (/api/metrics)
    ↓
Prometheus Scrapes Metrics (every 15s)
    ↓
Prometheus Stores TSDB
    ↓
Grafana Queries Prometheus
    ↓
Dashboards & Alerts
```

---

## Prometheus Setup

### ConfigMap for Prometheus

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: infamous-freight
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
      external_labels:
        cluster: 'production'
        environment: 'prod'
    
    alerting:
      alertmanagers:
      - static_configs:
        - targets:
          - alertmanager:9093
    
    rule_files:
      - '/etc/prometheus/alerts.yml'
    
    scrape_configs:
      - job_name: 'api'
        static_configs:
          - targets: ['api:4000']
        metrics_path: '/api/metrics'
        scrape_interval: 15s
        scrape_timeout: 10s
      
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
          - role: endpoints
      
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
      
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: infamous-freight
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: data
          mountPath: /prometheus
        args:
          - '--config.file=/etc/prometheus/prometheus.yml'
          - '--storage.tsdb.path=/prometheus'
          - '--web.console.libraries=/etc/prometheus/console_libraries'
          - '--web.console.templates=/etc/prometheus/consoles'
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: data
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: infamous-freight
spec:
  ports:
  - port: 9090
    targetPort: 9090
  selector:
    app: prometheus
```

---

## Grafana Setup

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: infamous-freight
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: grafana-secrets
              key: admin-password
        - name: GF_INSTALL_PLUGINS
          value: "grafana-piechart-panel"
        volumeMounts:
        - name: datasources
          mountPath: /etc/grafana/provisioning/datasources
        - name: dashboards
          mountPath: /etc/grafana/provisioning/dashboards
        - name: storage
          mountPath: /var/lib/grafana
      volumes:
      - name: datasources
        configMap:
          name: grafana-datasources
      - name: dashboards
        configMap:
          name: grafana-dashboards
      - name: storage
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: infamous-freight
spec:
  ports:
  - port: 3000
    targetPort: 3000
  selector:
    app: grafana
  type: LoadBalancer
```

### Datasources ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
  namespace: infamous-freight
data:
  prometheus.yml: |
    apiVersion: 1
    datasources:
    - name: Prometheus
      type: prometheus
      access: proxy
      url: http://prometheus:9090
      isDefault: true
      editable: true
```

---

## Alert Rules

### Alert Rules ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
  namespace: infamous-freight
data:
  alerts.yml: |
    groups:
    - name: application-alerts
      interval: 30s
      rules:
      
      # Error Rate Alert
      - alert: HighErrorRate
        expr: rate(http_request_errors_total[5m]) > 0.001
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} (> 0.1%)"
      
      # Latency Alert
      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_ms) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P95 latency is {{ $value }}ms (> 1000ms)"
      
      # Database Connection Alert
      - alert: HighDatabaseConnections
        expr: db_connections_active > 20
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Active DB connections: {{ $value }} (> 20)"
      
      # Pod Restart Alert
      - alert: PodRestarting
        expr: rate(kube_pod_container_status_restarts_total[1h]) > 0
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Pod is restarting"
          description: "Pod {{ $labels.pod }} is restarting frequently"
      
      # Memory Alert
      - alert: HighMemoryUsage
        expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage: {{ $value | humanizePercentage }}"
      
      # CPU Alert
      - alert: HighCPUUsage
        expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage: {{ $value | humanizePercentage }}"
```

---

## Grafana Dashboard Template

### API Performance Dashboard

```json
{
  "dashboard": {
    "title": "API Performance",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_request_errors_total[5m])"
          }
        ],
        "type": "graph"
      },
      {
        "title": "P50 Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.5, http_request_duration_ms)"
          }
        ],
        "type": "stat"
      },
      {
        "title": "P95 Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_ms)"
          }
        ],
        "type": "stat"
      },
      {
        "title": "P99 Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, http_request_duration_ms)"
          }
        ],
        "type": "stat"
      },
      {
        "title": "DB Connections",
        "targets": [
          {
            "expr": "db_connections_active"
          }
        ],
        "type": "gauge"
      },
      {
        "title": "Rate Limit Blocks",
        "targets": [
          {
            "expr": "rate_limit_blocked_total"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Cache Hit Rate",
        "targets": [
          {
            "expr": "rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))"
          }
        ],
        "type": "stat"
      }
    ]
  }
}
```

---

## Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 0.1% for 5 min | Investigate logs |
| P95 Latency | > 500ms for 5 min | Check DB, scale up |
| P99 Latency | > 1000ms for 5 min | Escalate |
| DB Connections | > 20 | Investigate queries |
| Memory Usage | > 80% | Scale or optimize |
| CPU Usage | > 75% | Scale up |
| Uptime | < 99.9% monthly | Investigate outages |
| Error Budget | < 10% remaining | Plan maintenance |

---

## Querying Prometheus

### Common Queries

```promql
# Request rate (requests per second)
rate(http_requests_total[5m])

# Error rate (errors per second)
rate(http_request_errors_total[5m])

# P95 latency (milliseconds)
histogram_quantile(0.95, http_request_duration_ms)

# Error percentage
rate(http_request_errors_total[5m]) / rate(http_requests_total[5m])

# Database connection count
db_connections_active

# Cache hit rate
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))

# Uptime percentage (over 24h)
(1 - (increase(node_restarts_total[24h]) / 1)) * 100
```

---

## Health Checks

### Prometheus Health

```bash
# Check Prometheus is running
curl http://prometheus:9090/-/healthy

# Check targets
curl http://prometheus:9090/api/v1/targets

# Check alerts
curl http://prometheus:9090/api/v1/alerts
```

### Grafana Health

```bash
# Check Grafana is running
curl http://grafana:3000/api/health

# Check datasources
curl -u admin:admin http://grafana:3000/api/datasources
```

---

## Alerting Channels

### Slack Integration

```yaml
alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - alertmanager:9093

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
    
    route:
      receiver: 'slack'
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
    
    receivers:
    - name: 'slack'
      slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.description }}'
```

### Email Integration

```yaml
receivers:
- name: 'email'
  email_configs:
  - to: 'alerts@yourdomain.com'
    from: 'prometheus@yourdomain.com'
    smarthost: 'smtp.example.com:587'
    auth_username: 'alerts@yourdomain.com'
    auth_password: 'PASSWORD'
    headers:
      Subject: 'Alert: {{ .GroupLabels.alertname }}'
```

---

## Logs & Distributed Tracing

### Adding Loki (Log Aggregation)

```bash
# Deploy Loki
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack \
  -n infamous-freight \
  --set loki.enabled=true \
  --set promtail.enabled=true

# Query logs in Grafana
# Datasource: Loki
# Query: {job="api"} | json
```

### Adding Jaeger (Distributed Tracing)

```bash
# Deploy Jaeger
kubectl apply -f https://raw.githubusercontent.com/jaegertracing/jaeger-kubernetes/master/all-in-one/jaeger-all-in-one-template.yml

# Add to Express middleware
const jaeger = require('jaeger-client');
const initTracer = require('jaeger-client').initTracer;

const initTracerConfig = {
  serviceName: 'api-service',
  sampler: { type: 'const', param: 1 },
  reporter: { logSpans: true },
};

const tracer = initTracer(initTracerConfig);
```

---

## Metrics Export Endpoint

### API Endpoint

The API exports metrics at `/api/metrics` in Prometheus format:

```bash
# View raw metrics
curl http://api:4000/api/metrics | head -20

# Output:
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
# http_requests_total{path="/api/shipments",method="GET"} 1250
# ...
```

---

## Cost Estimation

| Component | Cloud Option | Cost |
|-----------|--------------|------|
| Prometheus | EC2 t3.small (8GB) | $20/mo |
| Grafana | EC2 t3.small | $20/mo |
| Data retention (7 days) | EBS 100GB | $10/mo |
| Alerting | SNS/Email | Free |
| **Total** | AWS | **~$50/mo** |

---

## Troubleshooting

### Prometheus not scraping metrics

```bash
# Check config
kubectl exec prometheus -- cat /etc/prometheus/prometheus.yml

# Check targets status
curl http://prometheus:9090/api/v1/targets?state=down

# Restart Prometheus
kubectl rollout restart deployment/prometheus
```

### Grafana dashboards empty

```bash
# Verify Prometheus datasource
curl -u admin:admin http://grafana:3000/api/datasources

# Test Prometheus query
curl http://prometheus:9090/api/v1/query?query=up

# Check if metrics are being collected
kubectl logs deployment/api | grep "metrics"
```

### Alerts not firing

```bash
# Check alert rules
curl http://prometheus:9090/api/v1/rules

# Test alert query manually
curl http://prometheus:9090/api/v1/query?query=ALERT_NAME

# Check Alertmanager
curl http://alertmanager:9093/api/v1/alerts
```

---

**Last Updated**: 2026-01-22  
**Status**: Production Ready  
**Owner**: DevOps + SRE Team
