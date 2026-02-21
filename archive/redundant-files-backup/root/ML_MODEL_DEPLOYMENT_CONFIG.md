# Phase 10: ML Model Deployment Configuration

## TensorFlow Serving Deployment

version: '3.8'

services:

# Fraud Detection Model

fraud-detection-model: image: tensorflow/serving:latest container_name:
fraud-detection-model ports: - "8501:8501" # REST API - "8500:8500" # gRPC
environment: - MODEL_NAME=fraud_detection -
MODEL_BASE_PATH=/models/fraud_detection volumes: -
./ml-models/fraud_detection:/models/fraud_detection command: -
"--model_config_file=/models/models.config" -
"--monitoring_config_file=/models/monitoring.config" restart: unless-stopped
healthcheck: test: ["CMD", "curl", "-f",
"http://localhost:8501/v1/models/fraud_detection"] interval: 30s timeout: 10s
retries: 3

# Demand Forecasting Models

demand-forecast-model: image: tensorflow/serving:latest container_name:
demand-forecast-model ports: - "8502:8501" - "8503:8500" environment: -
MODEL_NAME=demand_forecast - MODEL_BASE_PATH=/models/demand_forecast volumes: -
./ml-models/demand_forecast:/models/demand_forecast restart: unless-stopped

# Route Optimization Model

route-optimization-model: image: tensorflow/serving:latest container_name:
route-optimization-model ports: - "8504:8501" - "8505:8500" environment: -
MODEL_NAME=route_optimization - MODEL_BASE_PATH=/models/route_optimization
volumes: - ./ml-models/route_optimization:/models/route_optimization restart:
unless-stopped

# Predictive Maintenance Model

predictive-maintenance-model: image: tensorflow/serving:latest container_name:
predictive-maintenance-model ports: - "8506:8501" - "8507:8500" environment: -
MODEL_NAME=predictive_maintenance -
MODEL_BASE_PATH=/models/predictive_maintenance volumes: -
./ml-models/predictive_maintenance:/models/predictive_maintenance restart:
unless-stopped

# MLflow Tracking Server

mlflow: image: ghcr.io/mlflow/mlflow:latest container_name: mlflow-server
ports: - "5000:5000" environment: -
MLFLOW_BACKEND_STORE_URI=postgresql://mlflow:mlflow@postgres:5432/mlflow -
MLFLOW_DEFAULT_ARTIFACT_ROOT=s3://mlflow-artifacts -
AWS_API_KEY=${AWS_API_KEY}
      - AWS_API_SECRET=${AWS_API_SECRET}
command: - "mlflow" - "server" - "--host" - "0.0.0.0" - "--port" - "5000" -
"--backend-store-uri" - "postgresql://mlflow:mlflow@postgres:5432/mlflow" -
"--default-artifact-root" - "s3://mlflow-artifacts" depends_on: - postgres
restart: unless-stopped

# Model Registry (PostgreSQL for MLflow)

postgres: image: postgres:14 container_name: mlflow-postgres environment: -
POSTGRES_DB=mlflow - POSTGRES_USER=mlflow - POSTGRES_PASSWORD=mlflow volumes: -
mlflow-postgres-data:/var/lib/postgresql/data restart: unless-stopped

volumes: mlflow-postgres-data:

---

## Model Configuration File (models.config)

```protobuf
model_config_list {
  config {
    name: 'fraud_detection'
    base_path: '/models/fraud_detection'
    model_platform: 'tensorflow'
    model_version_policy {
      specific {
        versions: 2
        versions: 1
      }
    }
  }
  config {
    name: 'demand_forecast'
    base_path: '/models/demand_forecast'
    model_platform: 'tensorflow'
  }
  config {
    name: 'route_optimization'
    base_path: '/models/route_optimization'
    model_platform: 'tensorflow'
  }
  config {
    name: 'predictive_maintenance'
    base_path: '/models/predictive_maintenance'
    model_platform: 'tensorflow'
  }
}
```

## Monitoring Configuration (monitoring.config)

```protobuf
prometheus_config {
  enable: true
  path: "/monitoring/prometheus/metrics"
}
logging_config {
  log_collector_config {
    type: COLLECTOR_CONFIG_TYPE_PROMETHEUS
    prefix: "/monitoring/prometheus/metrics"
    num_of_collection_threads: 1
    collection_period_msec: 30000
  }
}
```

## Kubernetes Deployment

### Fraud Detection Service

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fraud-detection-model
  namespace: ml-services
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fraud-detection-model
  template:
    metadata:
      labels:
        app: fraud-detection-model
    spec:
      containers:
        - name: tensorflow-serving
          image: tensorflow/serving:latest
          ports:
            - containerPort: 8501
              name: rest-api
            - containerPort: 8500
              name: grpc
          env:
            - name: MODEL_NAME
              value: fraud_detection
            - name: MODEL_BASE_PATH
              value: /models/fraud_detection
          volumeMounts:
            - name: model-volume
              mountPath: /models
          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2000m
              memory: 4Gi
          livenessProbe:
            httpGet:
              path: /v1/models/fraud_detection
              port: 8501
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /v1/models/fraud_detection
              port: 8501
            initialDelaySeconds: 10
            periodSeconds: 5
      volumes:
        - name: model-volume
          persistentVolumeClaim:
            claimName: ml-models-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: fraud-detection-model-service
  namespace: ml-services
spec:
  selector:
    app: fraud-detection-model
  ports:
    - name: rest-api
      port: 8501
      targetPort: 8501
    - name: grpc
      port: 8500
      targetPort: 8500
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fraud-detection-model-hpa
  namespace: ml-services
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fraud-detection-model
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## Model Training Pipeline (CI/CD)

### GitHub Actions Workflow

```yaml
name: ML Model Training and Deployment

on:
  schedule:
    - cron: "0 2 * * 0" # Weekly on Sunday at 2 AM
  workflow_dispatch:

jobs:
  train-fraud-detection:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.10"

      - name: Install dependencies
        run: |
          pip install tensorflow scikit-learn mlflow pandas numpy

      - name: Train Fraud Detection Model
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
        run: |
          python ml-training/fraud_detection/train.py

      - name: Evaluate Model
        run: |
          python ml-training/fraud_detection/evaluate.py

      - name: Export Model
        if: success()
        run: |
          python ml-training/fraud_detection/export.py

      - name: Upload Model to S3
        if: success()
        run: |
          aws s3 sync ./ml-models/fraud_detection s3://ml-models/fraud_detection/

      - name: Deploy to Production
        if: success()
        run: |
          kubectl set image deployment/fraud-detection-model \
            tensorflow-serving=tensorflow/serving:latest \
            -n ml-services
          kubectl rollout status deployment/fraud-detection-model -n ml-services
```

## Model Performance Monitoring

### Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: "tensorflow-serving"
    static_configs:
      - targets:
          - "fraud-detection-model:8501"
          - "demand-forecast-model:8502"
          - "route-optimization-model:8504"
          - "predictive-maintenance-model:8506"
    metrics_path: "/monitoring/prometheus/metrics"
    scrape_interval: 30s
```

### Grafana Dashboard

Key metrics to track:

- **Inference Latency**: P50, P95, P99
- **Requests per Second**: Total throughput
- **Error Rate**: Failed predictions
- **Model Accuracy**: Real-time validation
- **Resource Usage**: CPU, Memory, GPU
- **Batch Size**: Average batch size
- **Queue Length**: Pending requests

## Model Versioning Strategy

### Version Management

```javascript
// Model Version Controller
class ModelVersionController {
  constructor() {
    this.currentVersions = {
      fraud_detection: "2.1.0",
      demand_forecast: "1.5.0",
      route_optimization: "1.8.0",
      predictive_maintenance: "1.5.0",
    };
  }

  async loadModel(modelName, version = "latest") {
    const endpoint =
      version === "latest"
        ? `http://${modelName}-model:8501/v1/models/${modelName}`
        : `http://${modelName}-model:8501/v1/models/${modelName}/versions/${version}`;

    return endpoint;
  }

  async canaryDeployment(modelName, newVersion) {
    // Route 10% traffic to new version
    // Monitor performance for 24 hours
    // Gradually increase to 100% if stable
  }

  async rollback(modelName, targetVersion) {
    // Instant rollback to previous version
  }
}
```

## Model Retraining Schedule

| Model                  | Frequency | Trigger        | Data Source                          |
| ---------------------- | --------- | -------------- | ------------------------------------ |
| Fraud Detection        | Weekly    | Accuracy < 95% | fraud_checks table                   |
| Demand Forecast        | Daily     | MAPE > 10%     | shipments table                      |
| Route Optimization     | Bi-weekly | Savings < 20%  | route_optimizations table            |
| Predictive Maintenance | Monthly   | Accuracy < 85% | sensor_readings, maintenance_records |

## A/B Testing Framework

```javascript
// A/B Test Controller
class ModelABTest {
  async runTest(modelName, versionA, versionB, duration = "7d") {
    // Split traffic 50/50
    // Track metrics for both versions
    // Determine winner based on:
    // - Accuracy
    // - Latency
    // - Error rate
    // - Business metrics
  }
}
```

## Environment Variables

```bash
# ML Model Configuration
FRAUD_DETECTION_MODEL_URL=http://fraud-detection-model:8501
DEMAND_FORECAST_MODEL_URL=http://demand-forecast-model:8502
ROUTE_OPTIMIZATION_MODEL_URL=http://route-optimization-model:8504
PREDICTIVE_MAINTENANCE_MODEL_URL=http://predictive-maintenance-model:8506

# MLflow Configuration
MLFLOW_TRACKING_URI=http://mlflow:5000
MLFLOW_S3_ENDPOINT_URL=https://s3.amazonaws.com
MLFLOW_EXPERIMENT_NAME=phase10-ml-services

# Model Performance Thresholds
FRAUD_MODEL_MIN_ACCURACY=0.95
FORECAST_MODEL_MAX_MAPE=10
ROUTE_MODEL_MIN_SAVINGS=0.20
MAINTENANCE_MODEL_MIN_ACCURACY=0.85
```

## Security Considerations

1. **Model Access Control**: JWT authentication for model serving endpoints
2. **Data Encryption**: TLS for model serving traffic
3. **Input Validation**: Sanitize all inputs before inference
4. **Model Poisoning Prevention**: Validate training data sources
5. **Adversarial Attack Protection**: Input perturbation detection
6. **Model Audit Logs**: Track all predictions and model versions used

## Disaster Recovery

- **Model Backup**: Daily S3 snapshots
- **Fallback Strategy**: Use rule-based systems if ML models fail
- **RTO**: 5 minutes (restore from S3)
- **RPO**: 24 hours (daily model backups)

## Cost Optimization

- **Auto-scaling**: Scale down during low traffic hours
- **Batch Inference**: Group predictions to reduce overhead
- **Model Compression**: Quantization for smaller models
- **Cold Start Optimization**: Keep minimum 1 replica warm
- **GPU Scheduling**: Use spot instances for training

## Deployment Checklist

- [ ] Train model with latest data
- [ ] Validate model accuracy meets threshold
- [ ] Export model in TensorFlow SavedModel format
- [ ] Upload to S3 with versioning
- [ ] Update Kubernetes deployment with new image
- [ ] Run canary deployment (10% traffic)
- [ ] Monitor metrics for 24 hours
- [ ] Gradually increase traffic to 100%
- [ ] Update model version in API configuration
- [ ] Document model performance in MLflow
- [ ] Archive old model versions (keep last 3)
