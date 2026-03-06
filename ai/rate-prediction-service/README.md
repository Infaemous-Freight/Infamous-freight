# Rate Prediction Service

FastAPI microservice for freight rate inference.

## Endpoints

- `GET /health`
- `POST /predict-rate`

## Run locally

From the `ai/` directory:

```bash
pip install -r requirements.txt
python main.py
```

## Test

From the `ai/rate-prediction-service/` directory:

```bash
PYTHONPATH=. pytest -q
```
